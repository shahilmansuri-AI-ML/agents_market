from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database.session import get_db
from app.models.llm_model import LLMModel
from app.schemas.llm_model import LLMModelCreate, LLMModelUpdate, LLMModelOut

router = APIRouter(prefix="/llm-models", tags=["LLM Models"])


@router.get("/free-models")
def list_free_models():
    """
    Return the curated list of free/popular models available for Agent Nodes.
    Each entry includes display label, canonical model_id, provider, and
    information about the 2-layer fallback chain that protects execution.
    """
    from app.adapters.provider_router import ProviderRouter
    models = ProviderRouter.get_free_models()
    return {
        "models": models,
        "fallback_chain": {
            "layer_1": "User-selected model (primary)",
            "layer_2": "Groq llama-3.1-8b-instant (always-on fallback)",
        },
    }


@router.post("", response_model=LLMModelOut)
def create_model(model_in: LLMModelCreate, db: Session = Depends(get_db)):
    existing = db.query(LLMModel).filter(
        LLMModel.provider_name == model_in.provider_name,
        LLMModel.model_name == model_in.model_name
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Model already exists for this provider")
    
    # model_dict() is replaced by model_dump()
    new_model = LLMModel(**model_in.model_dump())
    db.add(new_model)
    db.commit()
    db.refresh(new_model)
    return new_model

@router.get("", response_model=List[LLMModelOut])
def list_models(db: Session = Depends(get_db)):
    return db.query(LLMModel).all()

@router.put("/{model_id}", response_model=LLMModelOut)
def update_model(model_id: UUID, model_in: LLMModelUpdate, db: Session = Depends(get_db)):
    db_model = db.query(LLMModel).filter(LLMModel.id == model_id).first()
    if not db_model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    update_data = model_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_model, key, value)
        
    db.commit()
    db.refresh(db_model)
    return db_model

@router.delete("/{model_id}")
def delete_model(model_id: UUID, db: Session = Depends(get_db)):
    db_model = db.query(LLMModel).filter(LLMModel.id == model_id).first()
    if not db_model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    db.delete(db_model)
    db.commit()
    return {"message": "Model deleted successfully"}