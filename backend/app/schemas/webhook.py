from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class WebhookEvent(str, Enum):
    WORKFLOW_EXECUTED = "workflow.executed"
    WORKFLOW_COMPLETED = "workflow.completed"
    WORKFLOW_FAILED = "workflow.failed"
    WORKFLOW_UPDATED = "workflow.updated"


class WebhookCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    workflow_id: int
    
    # Outgoing webhook config
    url: Optional[str] = None
    secret: Optional[str] = None
    events: List[WebhookEvent] = Field(default_factory=list)
    headers: Dict[str, str] = Field(default_factory=dict)
    
    # Incoming trigger config
    is_trigger: bool = False
    trigger_path: Optional[str] = None
    trigger_secret: Optional[str] = None
    allowed_methods: List[str] = Field(default=["POST"])


class WebhookUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    url: Optional[str] = None
    secret: Optional[str] = None
    events: Optional[List[WebhookEvent]] = None
    headers: Optional[Dict[str, str]] = None
    is_active: Optional[bool] = None
    trigger_secret: Optional[str] = None
    allowed_methods: Optional[List[str]] = None


class WebhookOut(BaseModel):
    id: int
    uuid: str
    name: str
    description: Optional[str]
    workflow_id: int
    url: Optional[str]
    events: List[str]
    is_trigger: bool
    trigger_path: Optional[str]
    trigger_url: Optional[str] = None
    is_active: bool
    total_calls: int
    successful_calls: int
    failed_calls: int
    last_triggered_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class WebhookLogOut(BaseModel):
    id: int
    webhook_id: int
    event: Optional[str]
    method: Optional[str]
    response_status: Optional[int]
    success: bool
    error_message: Optional[str]
    response_time_ms: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class WebhookTriggerRequest(BaseModel):
    """Request body for webhook triggers."""
    query: Optional[str] = None
    data: Dict[str, Any] = Field(default_factory=dict)
    variables: Dict[str, Any] = Field(default_factory=dict)


class WebhookTriggerResponse(BaseModel):
    execution_id: str
    status: str
    result: Optional[Dict[str, Any]] = None