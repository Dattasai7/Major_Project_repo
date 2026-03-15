import os
import httpx
from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from dotenv import load_dotenv

from Model.FDA_search import get_drugs, fetch_from_fda
from Model.RAG_model import ai_diagnose, get_drug_from_RAG
from routes.auth_routes import router as auth_router
from routes.chat_routes import router as chat_router

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

app = FastAPI(title="Medical Healthcare API")

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(chat_router)

# Renamed to avoid shadowing inside the function
DEFAULT_KNOWLEDGE_CHUNKS = [
    "Symptom: memory loss, confusion, disorientation. Disease: Alzheimers",
    "Symptom: high blood sugar, excessive thirst, frequent urination. Disease: Diabetes",
    "Symptom: wheezing, shortness of breath, chest tightness. Disease: Asthma",
    "Symptom: fever, chills, muscle aches, fatigue. Disease: Flu",
    "Symptom: persistent cough, weight loss, night sweats. Disease: Tuberculosis",
    "Symptom: severe headache, nausea, sensitivity to light. Disease: Migraine",
    "Symptom: chest pain, shortness of breath, left arm pain. Disease: Heart Attack",
    "Symptom: joint pain, stiffness, swelling. Disease: Arthritis",
    "If the symptom is not in KB, then provide a general idea and predict the most likely disease based on general medical knowledge."
]


@app.get("/search-drugs")
async def search_drugs(
    disease: str,
    status: str = Query("approved", description="e.g., approved, experimental"),
):
    return await get_drugs(disease, status)


@app.get("/ai-diagnose")
async def ai_diagnose_endpoint(
    symptoms: str = Query(..., description="Describe your symptoms"),
    knowledge_chunks: Optional[List[str]] = Query(None),
):
    # If URL params are empty, use the DEFAULT list
    chunks_to_use = knowledge_chunks if knowledge_chunks else DEFAULT_KNOWLEDGE_CHUNKS

    try:
        return await ai_diagnose(symptoms, chunks_to_use)
    except Exception as e:
        # This will show you the ACTUAL error in your terminal
        print(f"CRITICAL ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))