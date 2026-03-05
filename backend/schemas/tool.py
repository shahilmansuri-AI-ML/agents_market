from pydantic import BaseModel


# ✅ Used when creating tool
class ToolCreate(BaseModel):
    tool_name: str
    tool_api: str


# ✅ Used when returning tool data
class ToolOut(BaseModel):
    tool_id: int
    tool_name: str
    tool_api: str

    class Config:
        from_attributes = True


# ✅ Used when executing tool
class ToolExecute(BaseModel):
    tool_id: int
    message: str

