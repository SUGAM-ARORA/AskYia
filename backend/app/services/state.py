"""
Service State Management - Singleton instances
Askyia - No-Code AI Workflow Builder
"""

from app.services.vector_store import VectorStore, get_vector_store
from app.services.embedding_service import EmbeddingService, get_embedding_service

# Create singleton instances
vector_store = get_vector_store()
embedding_service = get_embedding_service()

__all__ = ['vector_store', 'embedding_service']