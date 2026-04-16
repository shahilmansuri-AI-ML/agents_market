from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.models.tool import Tool
from app.schemas.tool import ToolCreate, ToolOut, ToolExecuteRequest
from app.middleware.auth_middleware import get_current_user, AuthContext, require_permission

router = APIRouter(prefix="/tools", tags=["Tools"])


# ✅ Create Tool
@router.post("", response_model=ToolOut)
def add_tool(
    payload: ToolCreate,
    auth: AuthContext = Depends(require_permission("tools.manage")),
    db: Session = Depends(get_db)
):
    existing = db.query(Tool).filter(
        Tool.tool_name == payload.tool_name
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tool name already exists"
        )

    new_tool = Tool(
        tool_name=payload.tool_name,
        tool_api=payload.tool_api
    )

    db.add(new_tool)
    db.commit()
    db.refresh(new_tool)

    return new_tool

@router.put("/{tool_id}", response_model=ToolOut)
def update_tool(
    tool_id: int,
    payload: ToolCreate,
    auth: AuthContext = Depends(require_permission("tools.manage")),
    db: Session = Depends(get_db)
):
    tool = db.query(Tool).filter(Tool.tool_id == tool_id).first()

    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    tool.tool_name = payload.tool_name
    tool.tool_api = payload.tool_api

    db.commit()
    db.refresh(tool)

    return tool


@router.delete("/{tool_id}")
def delete_tool(
    tool_id: int,
    auth: AuthContext = Depends(require_permission("tools.manage")),
    db: Session = Depends(get_db)
):
    tool = db.query(Tool).filter(Tool.tool_id == tool_id).first()

    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    db.delete(tool)
    db.commit()

    return {"message": "Tool deleted successfully"}

# ✅ Get All Tools
@router.get("", response_model=List[ToolOut])
def get_tools(db: Session = Depends(get_db)):
    return db.query(Tool).all()


# ✅ Execute Tool
@router.post("/execute")
def run_tool(
    payload: ToolExecuteRequest,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tool = db.query(Tool).filter(
        Tool.tool_id == payload.tool_id
    ).first()

    if not tool:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tool not found"
        )

    return {
        "tool_id": tool.tool_id,
        "tool_name": tool.tool_name,
        "message": payload.message,
        "reply": f"Tool '{tool.tool_name}' executed successfully"
    }