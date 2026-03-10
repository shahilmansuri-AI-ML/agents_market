from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from db.session import get_db
from models.tool import Tool
from schemas.tool import ToolCreate, ToolOut
from pydantic import BaseModel
from typing import List


router = APIRouter(prefix="/tools", tags=["tools"])


# ✅ Request schema for tool execution
class ToolExecuteRequest(BaseModel):
    tool_id: int
    message: str


# ✅ Add new tool
@router.post("/", response_model=ToolOut)
def add_tool(tool_data: ToolCreate, db: Session = Depends(get_db)):

    existing_name = db.query(Tool).filter(
        Tool.tool_name == tool_data.tool_name
    ).first()

    if existing_name:
        raise HTTPException(
            status_code=400,
            detail="Tool name already exists"
        )

    new_tool = Tool(
        tool_name=tool_data.tool_name,
        tool_api=tool_data.tool_api
    )

    db.add(new_tool)
    db.commit()
    db.refresh(new_tool)

    return new_tool


# ✅ Get all tools
@router.get("/", response_model=List[ToolOut])
def get_tools(db: Session = Depends(get_db)):

    tools = db.query(Tool).all()

    return tools


# ✅ Execute tool
@router.post("/execute")
def run_tool(request: ToolExecuteRequest, db: Session = Depends(get_db)):

    tool = db.query(Tool).filter(
        Tool.tool_id == request.tool_id
    ).first()

    if not tool:
        raise HTTPException(
            status_code=404,
            detail="Tool not found"
        )

    # Example execution logic
    return {
        "tool_id": tool.tool_id,
        "tool_name": tool.tool_name,
        "message": request.message,
        "reply": f"Tool '{tool.tool_name}' executed successfully"
    }