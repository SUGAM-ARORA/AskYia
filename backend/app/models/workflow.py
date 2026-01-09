from sqlalchemy import Column, Integer, String, JSON, ForeignKey, DateTime, Boolean, Text, Enum, func, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum


class WorkflowStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class CollaboratorRole(str, enum.Enum):
    VIEWER = "viewer"
    EDITOR = "editor"
    ADMIN = "admin"


class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, index=True, nullable=False)  # Public identifier
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Workflow definition
    definition = Column(JSON, nullable=False, default=dict)
    
    # Metadata
    status = Column(String(20), default=WorkflowStatus.DRAFT.value)
    is_public = Column(Boolean, default=False)
    is_template = Column(Boolean, default=False)
    tags = Column(JSON, default=list)  # List of tags
    
    # Version tracking
    current_version = Column(Integer, default=1)
    
    # Owner
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_executed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Stats
    execution_count = Column(Integer, default=0)
    
    # Relationships
    owner = relationship("User", back_populates="workflows")
    versions = relationship("WorkflowVersion", back_populates="workflow", cascade="all, delete-orphan", order_by="desc(WorkflowVersion.version)")
    collaborators = relationship("WorkflowCollaborator", back_populates="workflow", cascade="all, delete-orphan")
    shares = relationship("WorkflowShare", back_populates="workflow", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="workflow", cascade="all, delete-orphan")
    webhooks = relationship("Webhook", back_populates="workflow", cascade="all, delete-orphan")
    execution_logs = relationship("ExecutionLog", back_populates="workflow", cascade="all, delete-orphan")


class WorkflowVersion(Base):
    """Stores workflow version history for versioning feature."""
    __tablename__ = "workflow_versions"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    version = Column(Integer, nullable=False)
    
    # Snapshot of workflow at this version
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    definition = Column(JSON, nullable=False)
    
    # Version metadata
    commit_message = Column(String(500), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Constraints
    __table_args__ = (
        UniqueConstraint('workflow_id', 'version', name='uq_workflow_version'),
    )

    # Relationships
    workflow = relationship("Workflow", back_populates="versions")
    created_by = relationship("User")


class WorkflowCollaborator(Base):
    """Manages workflow collaborators for collaboration feature."""
    __tablename__ = "workflow_collaborators"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), default=CollaboratorRole.VIEWER.value)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Constraints
    __table_args__ = (
        UniqueConstraint('workflow_id', 'user_id', name='uq_workflow_collaborator'),
    )

    # Relationships
    workflow = relationship("Workflow", back_populates="collaborators")
    user = relationship("User", back_populates="collaborations")


class WorkflowShare(Base):
    """Shareable links for workflows."""
    __tablename__ = "workflow_shares"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    share_token = Column(String(64), unique=True, index=True, nullable=False)
    
    # Share settings
    allow_edit = Column(Boolean, default=False)
    allow_execute = Column(Boolean, default=True)
    allow_duplicate = Column(Boolean, default=False)
    
    # Expiration
    expires_at = Column(DateTime(timezone=True), nullable=True)
    max_uses = Column(Integer, nullable=True)
    use_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    workflow = relationship("Workflow", back_populates="shares")
    created_by = relationship("User")