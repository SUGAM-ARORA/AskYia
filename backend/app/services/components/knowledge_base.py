"""
Knowledge Base Component - Document retrieval using embeddings
Askyia - No-Code AI Workflow Builder
"""

from typing import Dict
import structlog

from app.services.components.base import Component, ComponentContext, ComponentResult
from app.services.embedding_service import EmbeddingService
from app.services.vector_store import VectorStore

logger = structlog.get_logger()


class KnowledgeBaseComponent(Component):
    """
    Knowledge Base component that retrieves relevant context from documents.
    """
    
    def __init__(self, embedder: EmbeddingService, store: VectorStore):
        self.embedder = embedder
        self.store = store

    async def run(self, payload: Dict, context: ComponentContext) -> ComponentResult:
        """Retrieve relevant documents based on the query."""
        
        query = context.get("query", payload.get("query", ""))
        
        if not query:
            logger.warning("knowledge_base_no_query")
            context["context"] = ""
            return {"context": "", "chunks": 0}
        
        top_k = payload.get("top_k", 3)
        
        try:
            logger.info("knowledge_base_search_start", query=query[:100])
            
            # Generate query embedding
            query_embedding = await self.embedder.embed_query(query)
            
            logger.debug("query_embedding_generated", dimension=len(query_embedding))
            
            # Search for similar documents
            results = await self.store.similarity_search(
                query_embedding=query_embedding,
                top_k=top_k
            )
            
            logger.info("knowledge_base_search_results", count=len(results))
            
            if not results:
                logger.info("knowledge_base_no_results")
                context["context"] = ""
                return {"context": "", "chunks": 0}
            
            # Combine retrieved texts
            retrieved_texts = []
            for i, result in enumerate(results):
                text = result.get("text", "")
                score = result.get("score", 0)
                logger.debug(f"Result {i}: score={score:.3f}, text={text[:50]}...")
                
                if text:
                    retrieved_texts.append(f"[Document {i+1}]\n{text}")
            
            combined_context = "\n\n---\n\n".join(retrieved_texts)
            context["context"] = combined_context
            
            logger.info(
                "knowledge_base_success",
                chunks_retrieved=len(retrieved_texts),
                context_length=len(combined_context)
            )
            
            return {
                "context": combined_context,
                "chunks": len(retrieved_texts)
            }
            
        except Exception as e:
            logger.error("knowledge_base_error", error=str(e))
            context["context"] = ""
            return {"context": "", "chunks": 0, "error": str(e)}