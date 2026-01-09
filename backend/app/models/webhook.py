from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, JSON, Text, func
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum


class WebhookEvent(str, enum.Enum):
    WORKFLOW_EXECUTED = "workflow.executed"
    WORKFLOW_COMPLETED = "workflow.completed"
    WORKFLOW_FAILED = "workflow.failed"
    WORKFLOW_UPDATED = "workflow.updated"
    TRIGGER_INCOMING = "trigger.incoming"


class Webhook(Base):
    """Webhook configurations for workflows."""
    __tablename__ = "webhooks"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, index=True, nullable=False)
    
    # Association
    workflow_id = Column(Integer, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Webhook configuration
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Outgoing webhook (notify external services)
    url = Column(String(2000), nullable=True)
    secret = Column(String(255), nullable=True)
    events = Column(JSON, default=list)  # List of WebhookEvent values
    
    # Incoming webhook (trigger workflows)
    is_trigger = Column(Boolean, default=False)
    trigger_path = Column(String(255), nullable=True, unique=True)  # /webhook/trigger/{path}
    trigger_secret = Column(String(255), nullable=True)
    allowed_methods = Column(JSON, default=["POST"])
    
    # Headers to include
    headers = Column(JSON, default=dict)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Stats
    total_calls = Column(Integer, default=0)
    successful_calls = Column(Integer, default=0)
    failed_calls = Column(Integer, default=0)
    last_triggered_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    workflow = relationship("Workflow", back_populates="webhooks")
    owner = relationship("User")
    logs = relationship("WebhookLog", back_populates="webhook", cascade="all, delete-orphan")


class WebhookLog(Base):
    """Logs for webhook calls."""
    __tablename__ = "webhook_logs"

    id = Column(Integer, primary_key=True, index=True)
    webhook_id = Column(Integer, ForeignKey("webhooks.id", ondelete="CASCADE"), nullable=False)
    
    # Request details
    event = Column(String(50), nullable=True)
    method = Column(String(10), nullable=True)
    request_headers = Column(JSON, nullable=True)
    request_body = Column(Text, nullable=True)
    
    # Response details
    response_status = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    
    # Status
    success = Column(Boolean, default=False)
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    webhook = relationship("Webhook", back_populates="logs")