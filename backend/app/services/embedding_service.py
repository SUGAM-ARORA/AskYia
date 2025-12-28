"""
Embedding Service - Gemini Embeddings (with OpenAI fallback)
Askyia - No-Code AI Workflow Builder
"""

import asyncio
from typing import List, Optional
import structlog

import google.generativeai as genai

from app.core.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


class EmbeddingService:
    """
    Embedding Service using Gemini (primary) or OpenAI (fallback).
    Converts text into vector embeddings for semantic search.
    """
    
    def __init__(self):
        self.gemini_configured = False
        self.openai_client = None
        self.embedding_model = None
        self.embedding_dimension = 768  # Default for Gemini
        
        # Initialize Gemini embeddings (primary)
        if settings.gemini_api_key:
            try:
                genai.configure(api_key=settings.gemini_api_key)
                self.gemini_configured = True
                self.embedding_model = "models/embedding-001"
                logger.info("Gemini embedding service initialized", model=self.embedding_model)
            except Exception as e:
                logger.warning(f"Gemini embedding init failed: {e}")
        
        # Initialize OpenAI embeddings (fallback)
        if settings.openai_api_key:
            try:
                from openai import AsyncOpenAI
                self.openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
                self.embedding_dimension = 1536  # OpenAI dimension
                logger.info("OpenAI embedding service initialized")
            except Exception as e:
                logger.warning(f"OpenAI embedding init failed: {e}")
        
        if not self.gemini_configured and not self.openai_client:
            logger.warning("No embedding service configured - using dummy embeddings")
    
    async def embed_text(self, text: str) -> List[float]:
        """Generate embedding for a single text."""
        embeddings = await self.embed_texts([text])
        return embeddings[0] if embeddings else []
    
    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts."""
        
        if not texts:
            return []
        
        # Clean texts
        cleaned_texts = [t.strip() if t else "" for t in texts]
        cleaned_texts = [t if t else "empty" for t in cleaned_texts]  # Replace empty with placeholder
        
        logger.info("embedding_request", count=len(texts))
        
        # Try Gemini first
        if self.gemini_configured:
            try:
                return await self._embed_with_gemini(cleaned_texts)
            except Exception as e:
                logger.error("gemini_embedding_failed", error=str(e))
                if self.openai_client:
                    logger.info("Falling back to OpenAI embeddings")
                    return await self._embed_with_openai(cleaned_texts)
                raise
        
        # Try OpenAI
        if self.openai_client:
            try:
                return await self._embed_with_openai(cleaned_texts)
            except Exception as e:
                logger.error("openai_embedding_failed", error=str(e))
                raise
        
        # Fallback to dummy embeddings (for testing without API keys)
        logger.warning("Using dummy embeddings - no API configured")
        return self._dummy_embeddings(cleaned_texts)
    
    async def embed_query(self, query: str) -> List[float]:
        """Generate embedding for a search query."""
        return await self.embed_text(query)
    
    async def _embed_with_gemini(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings using Gemini."""
        
        embeddings = []
        
        # Gemini embedding API is synchronous, run in executor
        def sync_embed(text: str) -> List[float]:
            result = genai.embed_content(
                model=self.embedding_model,
                content=text,
                task_type="retrieval_document"
            )
            return result['embedding']
        
        loop = asyncio.get_event_loop()
        
        # Process in batches to avoid rate limits
        batch_size = 10
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            
            for text in batch:
                try:
                    embedding = await loop.run_in_executor(None, sync_embed, text)
                    embeddings.append(embedding)
                except Exception as e:
                    logger.warning(f"Failed to embed text: {e}")
                    # Use zero vector as fallback for failed embeddings
                    embeddings.append([0.0] * self.embedding_dimension)
        
        logger.info("gemini_embedding_success", count=len(embeddings))
        return embeddings
    
    async def _embed_with_openai(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings using OpenAI."""
        
        if not self.openai_client:
            raise ValueError("OpenAI client not configured")
        
        try:
            response = await self.openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=texts
            )
            
            embeddings = [item.embedding for item in response.data]
            logger.info("openai_embedding_success", count=len(embeddings))
            return embeddings
            
        except Exception as e:
            logger.error("openai_embedding_error", error=str(e))
            raise
    
    def _dummy_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate dummy embeddings for testing."""
        import hashlib
        
        embeddings = []
        for text in texts:
            # Create deterministic dummy embedding based on text hash
            hash_bytes = hashlib.md5(text.encode()).digest()
            embedding = [float(b) / 255.0 for b in hash_bytes]
            # Extend to match dimension
            while len(embedding) < self.embedding_dimension:
                embedding.extend(embedding)
            embedding = embedding[:self.embedding_dimension]
            embeddings.append(embedding)
        
        return embeddings
    
    def get_dimension(self) -> int:
        """Return the embedding dimension."""
        return self.embedding_dimension


# Singleton
_embedding_service: Optional[EmbeddingService] = None


def get_embedding_service() -> EmbeddingService:
    """Get or create embedding service singleton."""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service