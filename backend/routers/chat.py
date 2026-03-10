import os
import requests
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.session import get_db
from models.conversation import Conversation
from models.message import Message
from schemas.chat import *
from uuid import UUID
import time
from models.agent_deployment import AgentDeployment
from models.agent_deployment import AgentDeployment


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

    # 1️⃣ Save user message
    user_msg = Message(
        conversation_id=payload.conversation_id,
        role="user",
        content=payload.content
    )
    db.add(user_msg)
    db.commit()

    # 2️⃣ Get conversation
    convo = db.query(Conversation).filter(
        Conversation.id == payload.conversation_id
    ).first()

    if not convo:
        return {"error": "Conversation not found"}

    deployment = (
        db.query(AgentDeployment)
        .filter(
            AgentDeployment.agent_id == convo.agent_id,
            AgentDeployment.status == "active"
        )
        .first()
    )

    if not deployment:
        return {"error": "Agent not deployed"}

    agent_id = deployment.agent_id

    # Verify Pod3 still has this agent deployed
    try:
        verify_resp = requests.get(
            f"{WORKFLOW_URL}/agents/{agent_id}"
        )

        if verify_resp.status_code != 200:
            return {"error": "Agent not deployed in runtime"}

    except Exception:
        return {"error": "Workflow engine not reachable"}   

    # 3️⃣ Call Pod3 runtime
    try:
        response = requests.post(
            f"{WORKFLOW_URL}/executions",
            json={
                "agent_id": str(agent_id),
                "tenant_id": convo.tenant_id,
                "message": payload.content
            }
        )

        result = response.json()

        execution_id = result.get("execution_id")

        if not execution_id:
            raise Exception("Execution ID not returned")

        # Poll execution result
        execution_result = None
        execution_status = None

        max_wait_time = 15   # seconds
        interval = 1         # seconds

        start_time = time.time()

        while True:

            status_resp = requests.get(
                f"{WORKFLOW_URL}/executions/{execution_id}"
            )

            status_data = status_resp.json()

            execution_status = status_data.get("status")

            if execution_status == "COMPLETED":
                execution_result = status_data.get("output_payload")
                break

            if execution_status == "FAILED":
                execution_result = "Agent execution failed"
                break

            if time.time() - start_time > max_wait_time:
                execution_result = "Agent is still processing..."
                break

            time.sleep(interval)

    except Exception as e:
        agent_reply = str(e)

    # 4️⃣ Save assistant response
    ai_msg = Message(
        conversation_id=payload.conversation_id,
        role="assistant",
        content=agent_reply
    )

    db.add(ai_msg)
    db.commit()

    return {
        "assistant": execution_result
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


@router.get("/executions/{execution_id}/logs")
def get_execution_logs(execution_id: str):

    try:

        response = requests.get(
            f"{WORKFLOW_URL}/executions/{execution_id}/logs"
        )

        if response.status_code != 200:
            return {"error": "Failed to fetch execution logs"}

        return response.json()

    except Exception as e:
        return {"error": str(e)}