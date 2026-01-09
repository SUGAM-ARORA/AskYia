from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, Text, Float, func
from sqlalchemy.orm import relationship
from app.db.base import Base


class ExecutionLog(Base):
    """Persistent execution logs for workflows."""
    __tablename__ = "execution_logs"

    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(String(36), unique=True, index=True, nullable=False)
    
    # Association
    workflow_id = Column(Integer, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    workflow_version = Column(Integer, nullable=True)
    
    # Execution info
    status = Column(String(20), nullable=False)  # pending, running, completed, failed, cancelled
    
    # Input/Output
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    
    # Detailed logs
    logs = Column(JSON, default=list)  # List of log entries
    node_results = Column(JSON, default=dict)  # Results per node
    
    # Error info
    error_message = Column(Text, nullable=True)
    error_node_id = Column(String(100), nullable=True)
    
    # Performance metrics
    duration_seconds = Column(Float, nullable=True)
    tokens_used = Column(Integer, nullable=True)
    
    # Timestamps
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    workflow = relationship("Workflow", back_populates="execution_logs")
    user = relationship("User")