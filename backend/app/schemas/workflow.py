from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class WorkflowStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class CollaboratorRole(str, Enum):
    VIEWER = "viewer"
    EDITOR = "editor"
    ADMIN = "admin"


# ============== Workflow Schemas ==============

class WorkflowBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    definition: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    is_public: bool = False
    is_template: bool = False


class WorkflowCreate(WorkflowBase):
    pass


class WorkflowUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    definition: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None
    is_template: Optional[bool] = None
    status: Optional[WorkflowStatus] = None


class WorkflowOut(WorkflowBase):
    id: int
    uuid: str
    status: str
    current_version: int
    owner_id: int
    execution_count: int
    created_at: datetime
    updated_at: datetime
    last_executed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WorkflowListOut(BaseModel):
    id: int
    uuid: str
    name: str
    description: Optional[str]
    status: str
    is_public: bool
    is_template: bool
    tags: List[str]
    current_version: int
    execution_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============== Version Schemas ==============

class WorkflowVersionCreate(BaseModel):
    commit_message: Optional[str] = Field(None, max_length=500)


class WorkflowVersionOut(BaseModel):
    id: int
    version: int
    name: str
    description: Optional[str]
    definition: Dict[str, Any]
    commit_message: Optional[str]
    created_at: datetime
    created_by_id: Optional[int]

    class Config:
        from_attributes = True


# ============== Collaborator Schemas ==============

class CollaboratorAdd(BaseModel):
    email: str
    role: CollaboratorRole = CollaboratorRole.VIEWER


class CollaboratorUpdate(BaseModel):
    role: CollaboratorRole


class CollaboratorOut(BaseModel):
    id: int
    user_id: int
    role: str
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============== Share Schemas ==============

class ShareCreate(BaseModel):
    allow_edit: bool = False
    allow_execute: bool = True
    allow_duplicate: bool = False
    expires_in_days: Optional[int] = None
    max_uses: Optional[int] = None


class ShareOut(BaseModel):
    id: int
    share_token: str
    share_url: str
    allow_edit: bool
    allow_execute: bool
    allow_duplicate: bool
    expires_at: Optional[datetime]
    max_uses: Optional[int]
    use_count: int
    created_at: datetime

    class Config:
        from_attributes = True


# ============== Execution Schemas ==============

class WorkflowExecuteRequest(BaseModel):
    query: str
    prompt: Optional[str] = None
    web_search: bool = False
    variables: Dict[str, Any] = Field(default_factory=dict)


class WorkflowExecuteResponse(BaseModel):
    execution_id: str
    workflow_id: str
    status: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    duration_seconds: Optional[float] = None