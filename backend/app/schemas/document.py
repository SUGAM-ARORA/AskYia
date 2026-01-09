from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class DocumentOut(BaseModel):
    id: int
    uuid: str
    filename: str
    original_filename: str
    file_type: Optional[str]
    file_size: Optional[int]
    chunk_count: int
    processing_status: str
    created_at: datetime
    processed_at: Optional[datetime]

    class Config:
        from_attributes = True


class DocumentListOut(BaseModel):
    documents: list[DocumentOut]
    total: int