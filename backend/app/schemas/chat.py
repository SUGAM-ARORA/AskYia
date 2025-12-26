from typing import Any, Optional
from pydantic import BaseModel


class ChatMessageBase(BaseModel):
    workflow_id: int
    sender: str
    content: str
    metadata: Optional[Any] = None


class ChatMessageCreate(ChatMessageBase):
    pass


class ChatMessageOut(ChatMessageBase):
    id: int

    class Config:
        orm_mode = True
