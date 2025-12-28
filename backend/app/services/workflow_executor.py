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
from app.services.embedding_service import EmbeddingService, get_embedding_service
from app.services.vector_store import VectorStore, get_vector_store
from app.services.llm_service import LLMService, get_llm_service
from app.services.web_search import WebSearchService
from app.services.components.base import ComponentContext

logger = structlog.get_logger()


class WorkflowExecutor:
    """
    Executes workflow by running components in order:
    UserQuery -> KnowledgeBase (optional) -> LLMEngine -> Output
    """
    
    def __init__(
        self, 
        store: VectorStore | None = None, 
        embedder: EmbeddingService | None = None
    ):
        # Use singletons if not provided
        self.embedder = embedder or get_embedding_service()
        self.store = store or get_vector_store()
        self.llm = get_llm_service()
        self.search = WebSearchService()
        
        # Initialize components
        self.user_query = UserQueryComponent()
        self.knowledge_base = KnowledgeBaseComponent(self.embedder, self.store)
        self.llm_engine = LLMEngineComponent(llm=self.llm, search=self.search)
        self.output = OutputComponent()
        
        logger.info("WorkflowExecutor initialized")

    async def execute(
        self, 
        definition: Dict[str, Any], 
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute the workflow with given definition and payload.
        """
        logger.info(
            "workflow_execution_started",
            query=payload.get("query", "")[:50],
            kb_enabled=definition.get("knowledge_base_enabled", True)
        )
        
        # Create execution context
        context: ComponentContext = ComponentContext()
        
        try:
            # Step 1: Process user query
            query = payload.get("query", "")
            context["query"] = query
            await self.user_query.run(payload, context)
            logger.debug("workflow_step_complete", step="user_query")
            
            # Step 2: Knowledge base retrieval (if enabled and has documents)
            kb_enabled = definition.get("knowledge_base_enabled", True)
            doc_count = self.store.count()
            
            logger.debug(
                "knowledge_base_check",
                enabled=kb_enabled,
                document_count=doc_count
            )
            
            if kb_enabled and doc_count > 0:
                logger.info("knowledge_base_retrieving", doc_count=doc_count)
                await self.knowledge_base.run(payload, context)
                logger.debug(
                    "workflow_step_complete", 
                    step="knowledge_base",
                    context_length=len(context.get("context", ""))
                )
            else:
                context["context"] = ""
                logger.debug("knowledge_base_skipped", reason="disabled or no documents")
            
            # Step 3: LLM generation
            await self.llm_engine.run(payload, context)
            logger.debug("workflow_step_complete", step="llm_engine")
            
            # Step 4: Format output
            result = await self.output.run(payload, context)
            
            logger.info(
                "workflow_execution_complete",
                has_answer=bool(result.get("answer")),
                used_context=bool(context.get("context"))
            )
            
            return result
            
        except Exception as e:
            logger.error("workflow_execution_failed", error=str(e))
            return {
                "answer": f"Workflow execution failed: {str(e)}",
                "error": True
            }