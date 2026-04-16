from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.database.session import get_db
from app.models.conversation import Conversation
from app.models.message import Message
from app.middleware.auth_middleware import get_current_user, get_current_tenant, AuthContext, TenantContext

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/conversation")
def create_conversation(
    agent_id: str,
    title: str = "New Chat",
    auth: AuthContext = Depends(get_current_user),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Create a new conversation."""
    convo = Conversation(
        tenant_id=tenant.tenant_id,
        agent_id=UUID(agent_id),
        title=title
    )
    db.add(convo)
    db.commit()
    db.refresh(convo)
    return convo


@router.post("/message")
def save_message(
    conversation_id: str,
    role: str,
    content: str,
    auth: AuthContext = Depends(get_current_user),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Save a message to conversation."""
    # Verify conversation belongs to tenant
    conversation = db.query(Conversation).filter(
        Conversation.id == UUID(conversation_id),
        Conversation.tenant_id == tenant.tenant_id
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    msg = Message(
        conversation_id=UUID(conversation_id),
        role=role,
        content=content
    )
    db.add(msg)
    db.commit()
    return {"status": "saved"}


@router.get("/conversations/{agent_id}")
def get_conversations(
    agent_id: str,
    auth: AuthContext = Depends(get_current_user),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Get all conversations for an agent."""
    return (
        db.query(Conversation)
        .filter(
            Conversation.tenant_id == tenant.tenant_id,
            Conversation.agent_id == UUID(agent_id)
        )
        .order_by(Conversation.created_at.desc())
        .all()
    )


@router.get("/messages/{conversation_id}")
def get_messages(
    conversation_id: str,
    auth: AuthContext = Depends(get_current_user),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Get all messages in a conversation."""
    # Verify conversation belongs to tenant
    conversation = db.query(Conversation).filter(
        Conversation.id == UUID(conversation_id),
        Conversation.tenant_id == tenant.tenant_id
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return (
        db.query(Message)
        .filter(Message.conversation_id == UUID(conversation_id))
        .order_by(Message.created_at)
        .all()
    )
