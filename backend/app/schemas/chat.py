from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ChatSessionCreate(BaseModel):
    title: Optional[str] = None
    workflow_id: Optional[int] = None
    model: Optional[str] = None
    system_prompt: Optional[str] = None


class ChatSessionUpdate(BaseModel):
    title: Optional[str] = None
    model: Optional[str] = None
    system_prompt: Optional[str] = None
    is_active: Optional[bool] = None


class ChatSessionOut(BaseModel):
    id: int
    uuid: str
    title: Optional[str]
    workflow_id: Optional[int]
    model: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    class Config:
        from_attributes = True


class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1)
    role: str = "user"
    metadata: Optional[Dict[str, Any]] = None


class ChatMessageOut(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    metadata: Optional[Dict[str, Any]]
    tokens_used: Optional[int]
    model_used: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    session_id: Optional[str] = None
    workflow_id: Optional[int] = None
    model: Optional[str] = None
    system_prompt: Optional[str] = None
    include_context: bool = True


class ChatResponse(BaseModel):
    session_id: str
    message: ChatMessageOut
    response: ChatMessageOut