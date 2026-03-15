from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from models import ChatRequest
from auth import get_current_user
from database import chat_history_collection
from Model.RAG_model import ai_diagnose

router = APIRouter(prefix="/chat", tags=["Chat"])

# RAG knowledge base (synced with app.py)
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


@router.post("")
async def send_chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    """
    Receive a user message, route based on mode (fda or experimental),
    store both the message and the response in chat_history, and return the response.
    """
    user_message = request.message
    mode = request.mode or "experimental"

    try:
        # Map frontend mode → venkat's source_type
        # "fda" → "approved", "experimental" → "experimental"
        if mode == "both":
            source_type = "both"
        elif mode == "fda":
            source_type = "approved"
        else:
            source_type = "experimental"
        llm_response = await ai_diagnose(user_message, DEFAULT_KNOWLEDGE_CHUNKS, source_type)
    except Exception as e:
        llm_response = {"error": str(e), "source": "AI-RAG-Diagnosis"}

    # Store the interaction in MongoDB
    chat_doc = {
        "user_id": current_user["id"],
        "user_email": current_user["email"],
        "message": user_message,
        "mode": mode,
        "response": llm_response,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await chat_history_collection.insert_one(chat_doc)

    return {
        "message": user_message,
        "mode": mode,
        "response": llm_response,
        "timestamp": chat_doc["timestamp"],
    }


@router.get("/history")
async def get_chat_history(current_user: dict = Depends(get_current_user)):
    """Return the chat history for the current user, ordered by timestamp."""
    cursor = chat_history_collection.find(
        {"user_id": current_user["id"]}
    ).sort("timestamp", 1)

    history = []
    async for doc in cursor:
        history.append({
            "id": str(doc["_id"]),
            "message": doc["message"],
            "mode": doc.get("mode", "experimental"),
            "response": doc["response"],
            "timestamp": doc["timestamp"],
        })

    return {"history": history}
