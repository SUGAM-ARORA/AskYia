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

        # Get settings from payload (passed from workflow executor)
        top_k = payload.get("top_k", payload.get("topK", 3))
        threshold = payload.get("threshold", 0.7)

        try:
            logger.info(
                "knowledge_base_search_start", 
                query=query[:100], 
                top_k=top_k, 
                threshold=threshold
            )

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

            # Filter by threshold
            filtered_results = [r for r in results if r.get("score", 0) >= threshold]
            
            logger.info(
                "knowledge_base_filtered_results", 
                original=len(results), 
                filtered=len(filtered_results),
                threshold=threshold,
                scores=[round(r.get("score", 0), 3) for r in results]
            )

            if not filtered_results:
                logger.info("knowledge_base_no_results_above_threshold", threshold=threshold)
                # Still provide some context if we have results, even below threshold
                # This prevents empty context when threshold is too high
                if results:
                    logger.info("knowledge_base_using_best_available", 
                              best_score=results[0].get("score", 0))
                    filtered_results = results[:min(top_k, len(results))]
                else:
                    context["context"] = ""
                    return {"context": "", "chunks": 0, "message": f"No results above threshold {threshold}"}

            # Combine retrieved texts
            retrieved_texts = []
            sources = []
            scores = []
            
            for i, result in enumerate(filtered_results):
                text = result.get("text", "")
                score = result.get("score", 0)
                metadata = result.get("metadata", {})
                
                logger.debug(f"Result {i}: score={score:.3f}, text={text[:50]}...")

                if text:
                    # Include relevance score in the context for transparency
                    retrieved_texts.append(f"[Document {i+1} (relevance: {score:.0%})]\n{text}")
                    sources.append({
                        "index": i + 1,
                        "score": score,
                        "filename": metadata.get("filename", "unknown"),
                        "chunk_index": metadata.get("chunk_index", 0)
                    })
                    scores.append(score)

            combined_context = "\n\n---\n\n".join(retrieved_texts)
            context["context"] = combined_context
            context["sources"] = sources
            context["scores"] = scores

            logger.info(
                "knowledge_base_success",
                chunks_retrieved=len(retrieved_texts),
                context_length=len(combined_context),
                avg_score=sum(scores)/len(scores) if scores else 0
            )

            return {
                "context": combined_context,
                "chunks": len(retrieved_texts),
                "scores": scores,
                "sources": sources
            }

        except Exception as e:
            logger.error("knowledge_base_error", error=str(e), exc_info=True)
            context["context"] = ""
            return {"context": "", "chunks": 0, "error": str(e)}