"""
LLM Engine Component - Generates responses using LLM
Askyia - No-Code AI Workflow Builder
"""

from typing import Dict, Optional
import structlog

from app.services.components.base import Component, ComponentContext, ComponentResult
from app.services.llm_service import LLMService
from app.services.web_search import WebSearchService

logger = structlog.get_logger()


class LLMEngineComponent(Component):
    """LLM Engine component that generates responses."""
    
    def __init__(self, llm: LLMService, search: Optional[WebSearchService] = None):
        self.llm = llm
        self.search = search

    async def run(self, payload: Dict, context: ComponentContext) -> ComponentResult:
        """Generate LLM response using query and optional context."""
        
        query = context.get("query", payload.get("query", ""))
        kb_context = context.get("context", "")  # From knowledge base
        prompt = payload.get("prompt")
        
        if not query:
            logger.warning("llm_engine_no_query")
            return {"answer": "No query provided.", "error": True}
        
        logger.info(
            "llm_engine_start",
            query_length=len(query),
            kb_context_length=len(kb_context),
            web_search_enabled=payload.get("web_search", False)
        )
        
        # Web search augmentation (if enabled)
        web_context = ""
        if payload.get("web_search") and self.search:
            try:
                logger.info("web_search_executing", query=query[:50])
                search_results = await self.search.search(query, num_results=3)
                
                if search_results and "No results" not in search_results:
                    web_context = f"\n\n### Web Search Results:\n{search_results}"
                    logger.info("web_search_added", length=len(web_context))
                    
            except Exception as e:
                logger.warning("web_search_failed", error=str(e))
        
        # Combine all context
        full_context = ""
        if kb_context:
            full_context += f"### Retrieved Documents:\n{kb_context}"
        if web_context:
            full_context += web_context
        
        # Generate response
        try:
            answer = await self.llm.generate(
                query=query,
                context=full_context if full_context else None,
                prompt=prompt,
                temperature=payload.get("temperature", 0.7),
                max_tokens=payload.get("max_tokens", 1024)
            )
            
            context["answer"] = answer
            
            logger.info(
                "llm_engine_success",
                answer_length=len(answer),
                used_kb=bool(kb_context),
                used_web=bool(web_context)
            )
            
            return {
                "answer": answer,
                "used_context": bool(kb_context),
                "used_web_search": bool(web_context)
            }
            
        except Exception as e:
            error_msg = f"LLM generation failed: {str(e)}"
            logger.error("llm_engine_failed", error=str(e))
            context["answer"] = error_msg
            return {"answer": error_msg, "error": True}