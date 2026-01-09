from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, func, BigInteger, Text
from sqlalchemy.orm import relationship
from app.db.base import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), unique=True, index=True, nullable=False)
    
    # File info
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)
    file_type = Column(String(50), nullable=True)
    file_size = Column(BigInteger, nullable=True)
    
    # Processing info
    chunk_count = Column(Integer, default=0)
    embedding_model = Column(String(100), nullable=True)
    processing_status = Column(String(20), default="pending")  # pending, processing, completed, failed
    
    # Metadata
    document_metadata = Column("metadata", JSON, default=dict)
        
    # Owner
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    owner = relationship("User", back_populates="documents")