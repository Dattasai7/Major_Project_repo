from .FDA_search import fetch_from_fda
import httpx
from fastapi import HTTPException, Query
import requests
import os
import asyncio
from .ExperimentalDrug import fetch_experimental_drugs
from dotenv import load_dotenv

load_dotenv()
HF_API_URL = "https://router.huggingface.co/featherless-ai/v1/completions"
HEADERS = {"Authorization": f"Bearer {os.getenv('HUGGINGFACE_API_KEY')}"}

async def ai_diagnose(symptoms: str, knowledge_chunks: list, source_type: str = "both"):
    """Router endpoint to identify intent and fetch correct data"""
    
    # 1. Intent Classification Prompt
    # We ask the AI to determine if it's a symptom or a disease and extract the core condition
    # 1. Intent Classification Prompt
    intent_prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
    You are a medical classifier. Identify if the input is a DISEASE or SYMPTOMS.
    Then, extract ONLY the name of the most likely disease.
    Format your response exactly like this: Type | Disease
    Example: SYMPTOMS | Migraine
    <|eot_id|><|start_header_id|>user<|end_header_id|>
    Input: {symptoms}
    <|eot_id|><|start_header_id|>assistant<|end_header_id|>"""

    payload = {
        "model": "meta-llama/Meta-Llama-3.1-8B-Instruct",
        "prompt": intent_prompt,
        "temperature": 0.1,
        "max_tokens": 30
    }

    hf_res = requests.post(HF_API_URL, headers=HEADERS, json=payload)
    prediction = hf_res.json()['choices'][0]['text'].strip()
    
    # Simple split to get the disease name (e.g., "SYMPTOMS | Alzheimer's")
    disease_name = prediction.split("|")[-1].strip().lower()

    if "|" in prediction:
        # Split by pipe and take the last part, then strip any extra AI chatter
        parts = prediction.split("|")
        disease_name = parts[-1].strip().lower()
        # Remove any trailing periods or conversational fluff if AI was chatty
        disease_name = disease_name.split(".")[0].split("\n")[0].strip()
    else:
        # Fallback: if AI failed format, treat the whole response as the name
        disease_name = prediction.lower()

    # 2. Source Logic
    approved_data = []
    experimental_data = []

    # 3. Call APIs based on frontend selection
    tasks = []
    if source_type in ["approved", "both"]:
        tasks.append(fetch_from_fda(disease_name, "approved"))
    
    if source_type in ["experimental", "both"]:
        # You'll need the fetch_experimental_drugs function from earlier
        tasks.append(fetch_experimental_drugs(disease_name))

    # Run calls in parallel
    results = await asyncio.gather(*tasks)

    # Map results back to variables
    idx = 0
    if source_type in ["approved", "both"]:
        approved_raw = results[idx]
        approved_data = await get_drug_from_RAG(approved_raw[:3], payload)
        idx += 1
    
    if source_type in ["experimental", "both"]:
        experimental_data = results[idx] # Clinical trials are already structured

    return {
        "identified_condition": disease_name,
        "input_type": prediction.split("|")[0].strip(),
        "approved_medications": approved_data,
        "experimental_trials": experimental_data
    }


import json

async def get_drug_from_RAG(data_list, payload):
    if not data_list:
        return []

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
            if new_res.status_code == 200:
                ai_response = new_res.json()['choices'][0]['text'].strip()
                # Parse string to JSON object so the frontend gets a clean array of objects
                structured_results.append(json.loads(ai_response))
        except Exception as e:
            print(f"Error processing a drug: {e}")
            continue

    return structured_results
    raw_text = str(data[0]) # Convert the top drug match to a string

    # 2. Second LLM call to "summarize and structure"
    refine_prompt = f"""
    <|begin_of_text|><|start_header_id|>system<|end_header_id|>
    You are a medical data assistant. Convert the following raw FDA text into a concise JSON object for a patient dashboard. 
    Respond ONLY with JSON.
    <|eot_id|><|start_header_id|>user<|end_header_id|>
    Raw Text: {raw_text[:3000]} # Send a chunk to stay within token limits

    Desired JSON Keys:
    - drug_name
    - primary_use (1 sentence)
    - start_dosage
    - frequency
    - important_warning
    <|eot_id|><|start_header_id|>assistant<|end_header_id|>"""

    payload["prompt"] = refine_prompt
    payload["max_tokens"] = 1000
    # print(payload)
    new_res = requests.post(HF_API_URL, headers=HEADERS, json=payload)

    if new_res.status_code != 200:
        raise HTTPException(status_code=500, detail="AI service currently unavailable.")
        
    return new_res.json()['choices'][0]['text'].strip()