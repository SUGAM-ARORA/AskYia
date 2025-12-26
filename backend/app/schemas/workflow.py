from typing import Any, Optional
from pydantic import BaseModel


class WorkflowBase(BaseModel):
    name: str
    description: Optional[str] = None
    definition: Any


class WorkflowCreate(WorkflowBase):
    pass


class WorkflowOut(WorkflowBase):
    id: int

    class Config:
        orm_mode = True
