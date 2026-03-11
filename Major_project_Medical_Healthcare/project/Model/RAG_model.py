from .FDA_search import fetch_from_fda
import httpx
from fastapi import HTTPException, Query
import requests
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))
HF_API_URL = "https://router.huggingface.co/featherless-ai/v1/completions"
HEADERS = {"Authorization": f"Bearer {os.getenv('HUGGINGFACE_API_KEY')}"}

async def ai_diagnose(symptoms: str = str, knowledge_chunks = []):
    print(HEADERS)
    """This is the RAG endpoint using Llama-3.1-8B"""
    
    # 1. Retrieval (Basic keyword match for now)
    input_words = set(symptoms.lower().split())
    context = "\n".join([c for c in knowledge_chunks if any(w in c.lower() for w in input_words)])
    
    # 2. Llama 3.1 Prompting
    llama_prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
    Identify the disease from the context. If the exact symptoms are not in the context, use your general medical knowledge to provide a prediction and a brief general idea of what might be causing it. Output in this format:
    Disease: [Disease Name]
    Idea: [Brief idea/prediction]
    Context: {context}
    <|eot_id|><|start_header_id|>user<|end_header_id|>
    Symptoms: {symptoms}
    <|eot_id|><|start_header_id|>assistant<|end_header_id|>"""

    # 3. Request to Hugging Face
    payload = {
        "model": "meta-llama/Meta-Llama-3.1-8B-Instruct",
        "prompt": llama_prompt,
        "temperature": 0.3,
        "max_tokens": 100,
        "stop": ["<|eot_id|>"]
    }
    
    hf_res = requests.post(HF_API_URL, headers=HEADERS, json=payload)
    
    if hf_res.status_code != 200:
        raise HTTPException(status_code=500, detail="AI service currently unavailable.")
        
    response_text = hf_res.json()['choices'][0]['text'].strip()

    # Parse Disease and Idea from response
    disease_name = ""
    idea = ""
    for line in response_text.split('\n'):
        if line.startswith("Disease:"):
            disease_name = line.replace("Disease:", "").strip()
        elif line.startswith("Idea:"):
            idea = line.replace("Idea:", "").strip()

    if not disease_name:
        disease_name = response_text # Fallback if format is not exactly followed
        idea = "Could not cleanly parse the prediction."

    if "Unknown" in disease_name and not idea:
        raise HTTPException(status_code=404, detail="Could not predict a disease based on the given symptoms.")

    # 4. Trigger the shared FDA search logic
    disease_search_term = disease_name.lower().split()[0] if disease_name else "" # Use first word for search
    data = None
    try:
        data = await fetch_from_fda(disease_search_term, "approved")
    except Exception as e:
        data = {"error": f"Could not fetch FDA data for {disease_name}"}
    
    return {
        "source": "AI-RAG-Diagnosis",
        "identified_disease": disease_name,
        "general_idea": idea,
        "symptoms": symptoms,
        "data": data,
        "raw_response": response_text
    }