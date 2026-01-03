"""
Workflow Executor - Orchestrates component execution with comprehensive logging
Askyia - No-Code AI Workflow Builder
"""

from typing import Dict, Any, Optional
import time
import uuid
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

# Import the new logging service
from app.services.log_service import (
    execution_log_service,
    LogLevel,
    ExecutionStatus
)

# Import metrics (will be created)
from app.core.metrics import (
    WORKFLOW_EXECUTIONS_TOTAL,
    WORKFLOW_EXECUTION_DURATION,
    WORKFLOW_NODE_EXECUTIONS,
    WORKFLOW_NODE_DURATION,
    ACTIVE_WORKFLOWS
)

logger = structlog.get_logger()


class WorkflowExecutor:
    """
    Executes workflow by running components in order with full logging and metrics:
    UserQuery -> KnowledgeBase (optional) -> LLMEngine -> Output
    """
    
    # Define node types for logging
    NODE_TYPES = {
        "user_query": "input",
        "knowledge_base": "vector_search",
        "llm_engine": "llm",
        "output": "output"
    }
    
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

    async def execute(
        self,
        definition: Dict[str, Any],
        payload: Dict[str, Any],
        user_id: Optional[str] = None,
        workflow_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Execute the workflow with given definition and payload."""
        
        # Generate workflow_id if not provided
        workflow_id = workflow_id or definition.get("id", str(uuid.uuid4()))
        
        # Determine number of nodes to execute
        kb_enabled = definition.get("knowledge_base_enabled", True)
        doc_count = self.store.count()
        total_nodes = 4 if (kb_enabled and doc_count > 0) else 3
        
        # Start execution logging
        execution_id = await execution_log_service.start_execution(
            workflow_id=workflow_id,
            user_id=user_id,
            total_nodes=total_nodes
        )
        
        logger.info(
            "workflow_execution_started",
            workflow_id=workflow_id,
            execution_id=execution_id,
            query=payload.get("query", "")[:50],
            kb_enabled=kb_enabled,
            web_search=payload.get("web_search", False),
            total_nodes=total_nodes
        )
        
        context: ComponentContext = ComponentContext()
        execution_start_time = time.time()
        
        try:
            # ============== Step 1: Process user query ==============
            query = payload.get("query", "")
            context["query"] = query
            
            await self._execute_node(
                execution_id=execution_id,
                node_id="user_query",
                node_name="User Query Input",
                node_type=self.NODE_TYPES["user_query"],
                execute_fn=lambda: self.user_query.run(payload, context)
            )
            
            # ============== Step 2: Knowledge base retrieval ==============
            if kb_enabled and doc_count > 0:
                await self._execute_node(
                    execution_id=execution_id,
                    node_id="knowledge_base",
                    node_name="Knowledge Base Retrieval",
                    node_type=self.NODE_TYPES["knowledge_base"],
                    execute_fn=lambda: self.knowledge_base.run(payload, context),
                    metadata={"doc_count": doc_count}
                )
                
                # Log context retrieved
                context_length = len(context.get("context", ""))
                await execution_log_service.log(
                    execution_id=execution_id,
                    level=LogLevel.DEBUG,
                    message=f"Retrieved {context_length} characters of context from knowledge base",
                    node_id="knowledge_base",
                    node_type=self.NODE_TYPES["knowledge_base"],
                    metadata={"context_length": context_length}
                )
            else:
                # Log why KB was skipped
                skip_reason = "disabled" if not kb_enabled else "no documents"
                await execution_log_service.log(
                    execution_id=execution_id,
                    level=LogLevel.INFO,
                    message=f"Knowledge base retrieval skipped: {skip_reason}",
                    metadata={"kb_enabled": kb_enabled, "doc_count": doc_count}
                )
            
            # ============== Step 3: LLM generation ==============
            web_search_enabled = payload.get("web_search", False)
            
            await self._execute_node(
                execution_id=execution_id,
                node_id="llm_engine",
                node_name="LLM Engine",
                node_type=self.NODE_TYPES["llm_engine"],
                execute_fn=lambda: self.llm_engine.run(payload, context),
                metadata={
                    "web_search_enabled": web_search_enabled,
                    "has_context": bool(context.get("context"))
                }
            )
            
            # ============== Step 4: Format output ==============
            result = await self._execute_node(
                execution_id=execution_id,
                node_id="output",
                node_name="Output Formatter",
                node_type=self.NODE_TYPES["output"],
                execute_fn=lambda: self.output.run(payload, context),
                return_result=True
            )
            
            # Calculate total execution duration
            total_duration = time.time() - execution_start_time
            
            # Complete execution successfully
            await execution_log_service.complete_execution(
                execution_id=execution_id,
                status=ExecutionStatus.COMPLETED
            )
            
            # Record final metrics
            WORKFLOW_EXECUTIONS_TOTAL.labels(
                workflow_id=workflow_id,
                status='success'
            ).inc()
            WORKFLOW_EXECUTION_DURATION.labels(
                workflow_id=workflow_id
            ).observe(total_duration)
            
            logger.info(
                "workflow_execution_complete",
                workflow_id=workflow_id,
                execution_id=execution_id,
                has_answer=bool(result.get("answer")),
                duration_seconds=round(total_duration, 3)
            )
            
            # Add execution metadata to result
            result["_execution"] = {
                "execution_id": execution_id,
                "workflow_id": workflow_id,
                "duration_seconds": round(total_duration, 3),
                "status": "completed"
            }
            
            return result
            
        except Exception as e:
            total_duration = time.time() - execution_start_time
            
            # Log the error
            await execution_log_service.log(
                execution_id=execution_id,
                level=LogLevel.ERROR,
                message=f"Workflow execution failed: {str(e)}",
                metadata={"error_type": type(e).__name__, "error": str(e)}
            )
            
            # Complete execution with failure status
            await execution_log_service.complete_execution(
                execution_id=execution_id,
                status=ExecutionStatus.FAILED,
                error=str(e)
            )
            
            # Record failure metrics
            WORKFLOW_EXECUTIONS_TOTAL.labels(
                workflow_id=workflow_id,
                status='error'
            ).inc()
            
            logger.error(
                "workflow_execution_failed",
                workflow_id=workflow_id,
                execution_id=execution_id,
                error=str(e),
                duration_seconds=round(total_duration, 3)
            )
            
            return {
                "answer": f"Workflow execution failed: {str(e)}",
                "error": True,
                "_execution": {
                    "execution_id": execution_id,
                    "workflow_id": workflow_id,
                    "duration_seconds": round(total_duration, 3),
                    "status": "failed",
                    "error": str(e)
                }
            }

    async def _execute_node(
        self,
        execution_id: str,
        node_id: str,
        node_name: str,
        node_type: str,
        execute_fn,
        metadata: Optional[Dict[str, Any]] = None,
        return_result: bool = False
    ) -> Any:
        """Execute a single node with logging and metrics."""
        
        # Log node start
        await execution_log_service.log_node_start(
            execution_id=execution_id,
            node_id=node_id,
            node_type=node_type,
            node_name=node_name
        )
        
        start_time = time.time()
        
        try:
            # Execute the node
            result = await execute_fn()
            
            duration_ms = (time.time() - start_time) * 1000
            
            # Log node completion
            await execution_log_service.log_node_complete(
                execution_id=execution_id,
                node_id=node_id,
                node_type=node_type,
                duration_ms=duration_ms,
                output_summary=self._summarize_output(result) if result else None
            )
            
            # Record node-specific metrics
            ctx = execution_log_service.get_execution_context(execution_id)
            if ctx:
                WORKFLOW_NODE_EXECUTIONS.labels(
                    workflow_id=ctx.workflow_id,
                    node_type=node_type,
                    status='success'
                ).inc()
            WORKFLOW_NODE_DURATION.labels(node_type=node_type).observe(duration_ms / 1000)
            
            # Log additional metadata if provided
            if metadata:
                await execution_log_service.log(
                    execution_id=execution_id,
                    level=LogLevel.DEBUG,
                    message=f"Node {node_name} metadata",
                    node_id=node_id,
                    node_type=node_type,
                    metadata=metadata
                )
            
            if return_result:
                return result
                
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            
            # Log node error
            await execution_log_service.log_node_error(
                execution_id=execution_id,
                node_id=node_id,
                node_type=node_type,
                error=str(e)
            )
            
            # Record failure metrics
            ctx = execution_log_service.get_execution_context(execution_id)
            if ctx:
                WORKFLOW_NODE_EXECUTIONS.labels(
                    workflow_id=ctx.workflow_id,
                    node_type=node_type,
                    status='error'
                ).inc()
            
            raise

    def _summarize_output(self, output: Any, max_length: int = 100) -> str:
        """Create a summary of node output for logging."""
        if output is None:
            return "None"
        elif isinstance(output, dict):
            if "answer" in output:
                answer = output["answer"]
                return f"Answer: {str(answer)[:max_length]}{'...' if len(str(answer)) > max_length else ''}"
            keys = list(output.keys())
            return f"Dict with keys: {keys[:5]}{'...' if len(keys) > 5 else ''}"
        elif isinstance(output, list):
            return f"List with {len(output)} items"
        elif isinstance(output, str):
            return output[:max_length] + ('...' if len(output) > max_length else '')
        else:
            return str(type(output).__name__)

    async def get_execution_status(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """Get the status of a workflow execution."""
        context = execution_log_service.get_execution_context(execution_id)
        if not context:
            return None
        
        return {
            "execution_id": execution_id,
            "workflow_id": context.workflow_id,
            "status": context.status.value,
            "started_at": context.started_at.isoformat(),
            "ended_at": context.ended_at.isoformat() if context.ended_at else None,
            "progress": {
                "completed_nodes": context.completed_nodes,
                "total_nodes": context.total_nodes,
                "percentage": (context.completed_nodes / context.total_nodes * 100) if context.total_nodes > 0 else 0,
                "current_node": context.current_node
            },
            "error": context.error
        }

    async def get_execution_logs(self, execution_id: str):
        """Get all logs for a workflow execution."""
        return execution_log_service.get_execution_logs(execution_id)

    async def stream_execution_logs(self, execution_id: str):
        """Stream logs for a workflow execution in real-time."""
        async for log_entry in execution_log_service.subscribe(execution_id):
            yield log_entry