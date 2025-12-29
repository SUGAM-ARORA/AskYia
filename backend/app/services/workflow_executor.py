"""
Workflow Executor - Orchestrates component execution
Askyia - No-Code AI Workflow Builder
"""

from typing import Dict, Any
import structlog

from app.services.components.user_query import UserQueryComponent
from app.services.components.knowledge_base import KnowledgeBaseComponent
from app.services.components.llm_engine import LLMEngineComponent
from app.services.components.output import OutputComponent
from app.services.embedding_service import get_embedding_service
from app.services.vector_store import get_vector_store
from app.services.llm_service import get_llm_service
from app.services.web_search import get_web_search_service
from app.services.components.base import ComponentContext

logger = structlog.get_logger()


class WorkflowExecutor:
    """
    Executes workflow by running components in order:
    UserQuery -> KnowledgeBase (optional) -> LLMEngine -> Output
    """
    
    def __init__(self, store=None, embedder=None):
        # Use singletons
        self.embedder = embedder or get_embedding_service()
        self.store = store or get_vector_store()
        self.llm = get_llm_service()
        self.search = get_web_search_service()
        
        # Initialize components
        self.user_query = UserQueryComponent()
        self.knowledge_base = KnowledgeBaseComponent(self.embedder, self.store)
        self.llm_engine = LLMEngineComponent(llm=self.llm, search=self.search)
        self.output = OutputComponent()
        
        logger.info(
            "WorkflowExecutor initialized",
            web_search_available=self.search.configured
        )

    async def execute(self, definition: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the workflow with given definition and payload."""
        
        logger.info(
            "workflow_execution_started",
            query=payload.get("query", "")[:50],
            kb_enabled=definition.get("knowledge_base_enabled", True),
            web_search=payload.get("web_search", False)
        )
        
        context: ComponentContext = ComponentContext()
        
        try:
            # Step 1: Process user query
            query = payload.get("query", "")
            context["query"] = query
            await self.user_query.run(payload, context)
            
            # Step 2: Knowledge base retrieval
            kb_enabled = definition.get("knowledge_base_enabled", True)
            doc_count = self.store.count()
            
            if kb_enabled and doc_count > 0:
                await self.knowledge_base.run(payload, context)
                logger.debug("kb_context_added", length=len(context.get("context", "")))
            
            # Step 3: LLM generation (with optional web search)
            await self.llm_engine.run(payload, context)
            
            # Step 4: Format output
            result = await self.output.run(payload, context)
            
            logger.info("workflow_execution_complete", has_answer=bool(result.get("answer")))
            return result
            
        except Exception as e:
            logger.error("workflow_execution_failed", error=str(e))
            return {"answer": f"Workflow execution failed: {str(e)}", "error": True}