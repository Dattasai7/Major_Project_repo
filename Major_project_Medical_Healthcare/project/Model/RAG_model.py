from .FDA_search import fetch_from_fda
import httpx
from fastapi import HTTPException, Query
import requests
import os
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

# import Query from fastapi
import asyncio
from .ExperimentalDrug import fetch_experimental_drugs
from dotenv import load_dotenv

load_dotenv()

# --- INITIALIZE FAISS ONCE ---
# This "Retriever" is the brain of your RAG
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "faiss_medical_index")
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

try:
    # Load the index you created in Step 1
    vector_db = FAISS.load_local(DB_PATH, embeddings, allow_dangerous_deserialization=True)
    retriever = vector_db.as_retriever(search_kwargs={"k": 3})
    print("✅ FAISS Medical Index Loaded Successfully.")
except Exception as e:
    print(f"❌ Could not find FAISS index at {DB_PATH}. Run ingest_data.py first!")
    retriever = None

HF_API_URL = "https://router.huggingface.co/featherless-ai/v1/completions"
HEADERS = {"Authorization": f"Bearer {os.getenv('HUGGINGFACE_API_KEY_1')}"}
usingsecondtoken = False

async def ai_diagnose(symptoms: str, knowledge_chunks: list, source_type: str = "both"):
    global usingsecondtoken
    """Full RAG Pipeline: Retrieve -> Augment -> Generate"""
    
    # 1. RETRIEVAL (Search your FAISS DB)
    context = ""
    if retriever:
        docs = retriever.invoke(symptoms)
        context = "\n".join([d.page_content for d in docs])
    else:
        context = "\n".join(knowledge_chunks) if knowledge_chunks else ""
        
    print(f"\n🔍 [DEBUG RAG] Retrieved Context mapped to Prompt:\n{context}\n")

    # 2. AUGMENTED PROMPT (Giving the AI context to prevent hallucinations)
    rag_prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
    You are a medical diagnostic assistant.
    If the MEDICAL CONTEXT contains the answer, use it and label the source as "RAG".
    If the MEDICAL CONTEXT does NOT contain the answer, use your general medical knowledge and label the source as "General Knowledge".
    
    Analyze the symptoms and return ONLY in this exact format:
    Source | Type | Disease Name
    
    MEDICAL CONTEXT:
    {context}
    <|eot_id|><|start_header_id|>user<|end_header_id|>
    Symptoms: {symptoms}
    <|eot_id|><|start_header_id|>assistant<|end_header_id|>
    Note: If no context is provided, use your general medical knowledge but remain cautious."""

    payload = {
        "model": "meta-llama/Meta-Llama-3.1-8B-Instruct",
        "prompt": rag_prompt,
        "temperature": 0.1,
        "max_tokens": 30
    }

    total_tokens = 0
    baseline_tokens = 0

    hf_res = requests.post(HF_API_URL, headers=HEADERS, json=payload)
    res_json = hf_res.json()

    if "usage" in res_json:
        baseline_tokens = res_json["usage"]["total_tokens"]
        total_tokens += baseline_tokens

    if hf_res.status_code != 200:
        print(f"⚠️ API Error {hf_res.status_code}: {hf_res.text}")
        # Return a fallback so the script keeps running
        if not usingsecondtoken:
            usingsecondtoken = True
            HEADERS["Authorization"] = f"Bearer {os.getenv('HUGGINGFACE_API_KEY_2')}"
        else:
            HEADERS["Authorization"] = f"Bearer {os.getenv('HUGGINGFACE_API_KEY_3')}"
        hf_res = requests.post(HF_API_URL, headers=HEADERS, json=payload)
        # return {"identified_condition": "error", "approved_medications": [], "experimental_trials": []}
    prediction = hf_res.json()['choices'][0]['text'].strip()
    
    # Improved split to safely extract Source, Type, and Disease Name
    parts = [p.strip() for p in prediction.split("|")]
    
    if len(parts) >= 3:
        detected_source = parts[0]
        disease_name = parts[-1].lower().split(".")[0].split("\n")[0].strip()
        input_type = parts[1]
    elif len(parts) == 2:
        detected_source = "Unknown Source"
        disease_name = parts[-1].lower().split(".")[0].split("\n")[0].strip()
        input_type = parts[0]
    else:
        detected_source = "General Knowledge"
        disease_name = prediction.lower().split(".")[0].split("\n")[0].strip()
        input_type = "Unknown Type"
        
    print(f"\n🧠 [DEBUG AI DIAGNOSIS] Source: {detected_source} | Disease: {disease_name}\n")

    # 2. Source Logic
    is_fda = source_type in ["fda", "approved", "both"]
    is_exp = source_type in ["experimental", "both"]

    print("Source Type:", source_type)
    approved_data = []
    experimental_data = []

    # 3. Call APIs based on frontend selection
    tasks = []
    if is_fda:
        tasks.append(fetch_from_fda(disease_name, "approved"))
    
    if is_exp:
        # You'll need the fetch_experimental_drugs function from earlier
        tasks.append(fetch_experimental_drugs(disease_name))

    # Run calls in parallel
    results = await asyncio.gather(*tasks)

    # Map results back to variables
    idx = 0
    if source_type in ["approved", "both"]:
        approved_raw = results[idx]
        if not approved_raw:
            approved_data = [] # Don't try to call get_drug_from_RAG
        else:
            approved_data, refinement_tokens = await get_drug_from_RAG(approved_raw[:3], payload)
            total_tokens += refinement_tokens
        # approved_data = await get_drug_from_RAG(approved_raw[:3], payload)
        idx += 1
    
    if source_type in ["experimental", "both"]:
        experimental_data = results[idx] # Clinical trials are already structured

    print("Approved:", approved_data)
    print("Experimental:", experimental_data)

    return {
        "identified_condition": disease_name,
        "token_usage": total_tokens,
        "accuracy_estimate": 73.0,
        "input_type": input_type,
        "diagnosis_source": detected_source,
        "approved_medications": approved_data,
        "experimental_trials": experimental_data
    }


import json

async def get_drug_from_RAG(data_list, payload):
    if not data_list:
        return []

    total_refinement_tokens = 0
    structured_results = []

    for drug_data in data_list:
        raw_text = str(drug_data)

        refine_prompt = f"""
        <|begin_of_text|><|start_header_id|>system<|end_header_id|>
        You are a medical data assistant. Convert the raw FDA text into a concise JSON object.
        Respond ONLY with JSON.
        <|eot_id|><|start_header_id|>user<|end_header_id|>
        Raw Text: {raw_text[:2500]} 

        Desired JSON Keys:
        - drug_name
        - primary_use
        - start_dosage
        - frequency
        - important_warning
        <|eot_id|><|start_header_id|>assistant<|end_header_id|>"""

        payload["prompt"] = refine_prompt
        payload["max_tokens"] = 500 # Reduced per drug to save total time/tokens
        
        try:
            new_res = requests.post(HF_API_URL, headers=HEADERS, json=payload)
            res_json = new_res.json()
        
            if "usage" in res_json:
                total_refinement_tokens += res_json["usage"]["total_tokens"]

            if new_res.status_code == 200:
                ai_response = new_res.json()['choices'][0]['text'].strip()
                # Parse string to JSON object so the frontend gets a clean array of objects
                structured_results.append(json.loads(ai_response))
        except Exception as e:
            print(f"Error processing a drug: {e}")
            continue

    return structured_results, total_refinement_tokens