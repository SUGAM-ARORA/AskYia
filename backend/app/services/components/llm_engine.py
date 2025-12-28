"""
LLM Engine Component - Executes LLM queries with optional web search
"""

from typing import Dict, Optional
from app.services.components.base import Component, ComponentContext, ComponentResult
from app.services.llm_service import LLMService
from app.services.web_search import WebSearchService
import structlog

logger = structlog.get_logger()


class LLMEngineComponent(Component):
    """
    LLM Engine component that generates responses using OpenAI or Gemini.
    
    Supports:
    - Multiple providers (OpenAI, Gemini) with automatic fallback
    - Optional web search augmentation
    - Custom prompts
    - Temperature and model configuration
    """
    
    def __init__(self, llm: LLMService, search: Optional[WebSearchService] = None):
        self.llm = llm
        self.search = search

    async def run(self, payload: Dict, context: ComponentContext) -> ComponentResult:
        """
        Execute LLM generation with optional web search.
        
        Expected payload:
            - query: User's question
            - prompt: Optional system prompt
            - web_search: Boolean to enable web search
            - provider: "openai" or "gemini" (optional)
            - model: Specific model name (optional)
            - temperature: Float 0-1 (optional, default 0.7)
            - max_tokens: Int (optional, default 1024)
        
        Context may contain:
            - query: From UserQueryComponent
            - context: From KnowledgeBaseComponent
        """
        # Get query from context or payload
        query = context.get("query", payload.get("query", ""))
        
        if not query:
            logger.warning("llm_engine_no_query")
            return {"answer": "No query provided.", "error": True}
        
        # Get optional parameters
        prompt = payload.get("prompt")
        kb_context = context.get("context", "")
        
        # LLM configuration from payload
        provider = payload.get("provider")  # "openai" or "gemini"
        model = payload.get("model")  # e.g., "gpt-4o-mini", "gemini-1.5-flash"
        temperature = payload.get("temperature", 0.7)
        max_tokens = payload.get("max_tokens", 1024)
        
        # Web search augmentation
        if payload.get("web_search") and self.search:
            try:
                logger.info("llm_engine_web_search", query=query[:100])
                search_results = await self.search.search(query)
                
                if search_results:
                    # Append web search results to context
                    web_context = f"\n\n### Web Search Results:\n{search_results}"
                    kb_context = (kb_context + web_context) if kb_context else web_context
                    
            except Exception as e:
                logger.warning("llm_engine_web_search_failed", error=str(e))
                # Continue without web search results
        
        # Generate response
        try:
            logger.info(
                "llm_engine_generating",
                provider=provider,
                model=model,
                has_context=bool(kb_context),
                query_preview=query[:100]
            )
            
            answer = await self.llm.generate(
                query=query,
                context=kb_context if kb_context else None,
                prompt=prompt,
                provider=provider,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
                enable_fallback=True  # Enable automatic fallback
            )
            
            context["answer"] = answer
            
            logger.info(
                "llm_engine_success",
                answer_length=len(answer),
                provider=provider,
                model=model
            )
            
            return {
                "answer": answer,
                "provider": provider,
                "model": model,
                "has_context": bool(kb_context),
                "web_search_used": payload.get("web_search", False)
            }
            
        except Exception as e:
            error_msg = f"Failed to generate response: {str(e)}"
            logger.error("llm_engine_failed", error=str(e))
            context["answer"] = error_msg
            return {"answer": error_msg, "error": True}