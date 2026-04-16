from pydantic import BaseModel


# Request: Create Tool
class ToolCreate(BaseModel):
    tool_name: str
    tool_api: str


# Response: Tool Output
class ToolOut(BaseModel):
    tool_id: int
    tool_name: str
    tool_api: str

    class Config:
        from_attributes = True


# Request: Execute Tool
class ToolExecuteRequest(BaseModel):
    tool_id: int
    message: str