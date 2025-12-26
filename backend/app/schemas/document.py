from typing import Optional
from pydantic import BaseModel


class DocumentBase(BaseModel):
    filename: str
    path: str


class DocumentCreate(DocumentBase):
    pass


class DocumentOut(DocumentBase):
    id: int
    owner_id: Optional[int]

    class Config:
        orm_mode = True
