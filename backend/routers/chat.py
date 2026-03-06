import os
import requests
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import get_db
from models.conversation import Conversation
from models.message import Message
from schemas.chat import *
from uuid import UUID

router = APIRouter(prefix="/chat", tags=["Chat"])

WORKFLOW_URL = os.getenv("WORKFLOW_URL", "http://pod3_fastapi:8002")

@router.post("/conversation")
def create_conversation(payload: CreateConversation, db: Session = Depends(get_db)):
    convo = Conversation(
        tenant_id=payload.tenant_id,
        agent_id=payload.agent_id,
        title="New Chat"
    )
    db.add(convo)
    db.commit()
    db.refresh(convo)
    return convo

@router.post("/message")
def save_message(payload: MessageCreate, db: Session = Depends(get_db)):
    
    # 1️⃣ Save message in DB
    msg = Message(
        conversation_id=payload.conversation_id,
        role=payload.role,
        content=payload.content
    )
    db.add(msg)
    db.commit()

    # 2️⃣ Get conversation to know which agent to run
    convo = db.query(Conversation).filter(
        Conversation.id == payload.conversation_id
    ).first()

    if not convo:
        return {"error": "Conversation not found"}

    agent_id = convo.agent_id

    # 3️⃣ Call Pod3 workflow engine
    try:
        response = requests.post(
            f"{WORKFLOW_URL}/execute/{agent_id}",
            json={
                "tenant_id": convo.tenant_id,
                "message": payload.content
            }
)

        result = response.json()

    except Exception as e:
        result = {"error": str(e)}

    # 4️⃣ Return result to frontend
    return {
        "status": "saved",
        "workflow_result": result
    }

@router.get("/conversations/{tenant_id}/{agent_id}")
def get_conversations(
    tenant_id: str,
    agent_id: str,
    db: Session = Depends(get_db)
):
    return (
        db.query(Conversation)
        .filter(
            Conversation.tenant_id == tenant_id,
            Conversation.agent_id == agent_id
        )
        .order_by(Conversation.created_at.desc())
        .all()
    )

@router.get("/messages/{conversation_id}")
def get_messages(conversation_id: UUID, db: Session = Depends(get_db)):
    return (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
        .all()
    )