from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from ..models import ChatRequest
from ..auth import get_current_user
from ..database import chat_history_collection
from ..Model.RAG_model import ai_diagnose

router = APIRouter(prefix="/chat", tags=["Chat"])

# RAG knowledge base (synced with app.py)
DEFAULT_KNOWLEDGE_CHUNKS = [
    "Symptom: memory loss, confusion, disorientation. Disease: Alzheimers",
    "Symptom: high blood sugar, excessive thirst, frequent urination. Disease: Diabetes",
    "Symptom: wheezing, shortness of breath, chest tightness. Disease: Asthma"
]


@router.post("")
async def send_chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    """
    Receive a user message, run it through the AI diagnose RAG model,
    store both the message and the LLM response in chat_history, and return the response.
    """
    user_message = request.message

    # Call the existing RAG model
    try:
        llm_response = await ai_diagnose(user_message, DEFAULT_KNOWLEDGE_CHUNKS)
    except Exception as e:
        llm_response = {"error": str(e), "source": "AI-RAG-Diagnosis"}

    # Store the interaction in MongoDB
    chat_doc = {
        "user_id": current_user["id"],
        "user_email": current_user["email"],
        "message": user_message,
        "response": llm_response,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await chat_history_collection.insert_one(chat_doc)

    return {
        "message": user_message,
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
            "response": doc["response"],
            "timestamp": doc["timestamp"],
        })

    return {"history": history}
