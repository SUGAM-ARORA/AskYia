"""
Workflow Executor - Dynamic workflow execution based on actual node graph
Askyia - No-Code AI Workflow Builder
"""

from typing import Dict, Any, Optional, List, Set
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

# Import the logging service
from app.services.log_service import (
    execution_log_service,
    LogLevel,
    ExecutionStatus
)

# Import metrics
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
    Dynamic Workflow Executor - Executes ONLY the nodes present in the workflow.
    Respects the user's workflow design instead of running a fixed pipeline.
    """

    # Map node types to internal component types
    NODE_TYPE_MAP = {
        # Input nodes
        "input": "user_query",
        "userQuery": "user_query",
        "user_query": "user_query",
        "UserQuery": "user_query",
        
        # Knowledge Base nodes
        "knowledgeBase": "knowledge_base",
        "knowledge_base": "knowledge_base",
        "KnowledgeBase": "knowledge_base",
        
        # LLM nodes
        "llm": "llm_engine",
        "llmEngine": "llm_engine",
        "llm_engine": "llm_engine",
        "LLM": "llm_engine",
        
        # Output nodes
        "output": "output",
        "Output": "output",
    }

    # Node type labels for logging
    NODE_TYPE_LABELS = {
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

        # Initialize components (lazy - only used if needed)
        self.components = {
            "user_query": UserQueryComponent(),
            "knowledge_base": KnowledgeBaseComponent(self.embedder, self.store),
            "llm_engine": LLMEngineComponent(llm=self.llm, search=self.search),
            "output": OutputComponent(),
        }

        logger.info(
            "WorkflowExecutor initialized (dynamic mode)",
            web_search_available=self.search.configured
        )

    def _parse_workflow(self, definition: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse workflow definition to extract nodes, edges, and execution info.
        Returns structured workflow data.
        """
        nodes = definition.get("nodes", [])
        edges = definition.get("edges", [])
        
        # Identify which component types are in the workflow
        present_components: Set[str] = set()
        node_map: Dict[str, Dict] = {}  # node_id -> node_data
        node_types: Dict[str, str] = {}  # node_id -> component_type
        
        for node in nodes:
            node_id = node.get("id", "")
            node_type = node.get("type", "")
            
            # Map to internal component type
            component_type = self.NODE_TYPE_MAP.get(node_type)
            
            if component_type:
                present_components.add(component_type)
                node_map[node_id] = node
                node_types[node_id] = component_type
            else:
                logger.warning(f"Unknown node type: {node_type}, skipping")
        
        # Build execution order using topological sort
        execution_order = self._topological_sort(nodes, edges, node_types)
        
        return {
            "present_components": present_components,
            "node_map": node_map,
            "node_types": node_types,
            "execution_order": execution_order,
            "edges": edges,
            "has_input": "user_query" in present_components,
            "has_kb": "knowledge_base" in present_components,
            "has_llm": "llm_engine" in present_components,
            "has_output": "output" in present_components,
        }

    def _topological_sort(
        self, 
        nodes: List[Dict], 
        edges: List[Dict],
        node_types: Dict[str, str]
    ) -> List[str]:
        """
        Topological sort to determine execution order based on edges.
        Only includes nodes that have valid component types.
        """
        # Build adjacency list and in-degree count
        in_degree: Dict[str, int] = {}
        adjacency: Dict[str, List[str]] = {}
        
        valid_node_ids = set(node_types.keys())
        
        for node_id in valid_node_ids:
            in_degree[node_id] = 0
            adjacency[node_id] = []
        
        for edge in edges:
            source = edge.get("source", "")
            target = edge.get("target", "")
            
            if source in valid_node_ids and target in valid_node_ids:
                adjacency[source].append(target)
                in_degree[target] = in_degree.get(target, 0) + 1
        
        # Kahn's algorithm
        queue = [node_id for node_id, degree in in_degree.items() if degree == 0]
        result = []
        
        while queue:
            node_id = queue.pop(0)
            result.append(node_id)
            
            for neighbor in adjacency.get(node_id, []):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)
        
        return result

    def _extract_node_settings(self, node: Dict, component_type: str) -> Dict[str, Any]:
        """Extract settings from a node based on its type."""
        data = node.get("data", {})
        
        if component_type == "knowledge_base":
            return {
                "enabled": data.get("enabled", True),
                "topK": data.get("topK", data.get("top_k", 3)),
                "threshold": data.get("threshold", 0.7),
            }
        elif component_type == "llm_engine":
            return {
                "provider": data.get("provider", "google"),
                "model": data.get("model", "gemini-2.0-flash"),
                "systemPrompt": data.get("systemPrompt", ""),
                "temperature": data.get("temperature", 0.7),
                "maxTokens": data.get("maxTokens", 4096),
            }
        elif component_type == "user_query":
            return {
                "query": data.get("query", data.get("userQuery", data.get("value", ""))),
            }
        
        return data

    async def execute(
        self,
        definition: Dict[str, Any],
        payload: Dict[str, Any],
        user_id: Optional[str] = None,
        workflow_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execute the workflow DYNAMICALLY based on actual nodes present.
        Only runs components that exist in the user's workflow design.
        """

        # Generate workflow_id if not provided
        workflow_id = workflow_id or definition.get("id", str(uuid.uuid4()))

        # Parse the workflow to understand its structure
        workflow_info = self._parse_workflow(definition)
        
        present_components = workflow_info["present_components"]
        node_map = workflow_info["node_map"]
        node_types = workflow_info["node_types"]
        execution_order = workflow_info["execution_order"]
        
        has_kb = workflow_info["has_kb"]
        has_llm = workflow_info["has_llm"]
        
        total_nodes = len(execution_order)

        # Start execution logging
        execution_id = await execution_log_service.start_execution(
            workflow_id=workflow_id,
            user_id=user_id,
            total_nodes=total_nodes
        )

        # Get query from payload or from input node
        query = payload.get("query", "")
        if not query:
            for node_id in execution_order:
                if node_types.get(node_id) == "user_query":
                    node = node_map.get(node_id, {})
                    settings = self._extract_node_settings(node, "user_query")
                    query = settings.get("query", "")
                    if query:
                        break

        logger.info(
            "workflow_execution_started_dynamic",
            workflow_id=workflow_id,
            execution_id=execution_id,
            query=query[:100] if query else "NO QUERY",
            present_components=list(present_components),
            execution_order=[node_types.get(nid, "unknown") for nid in execution_order],
            has_kb=has_kb,
            has_llm=has_llm,
            total_nodes=total_nodes
        )

        context: ComponentContext = ComponentContext()
        context["query"] = query
        execution_start_time = time.time()

        try:
            # Execute nodes in order
            for node_id in execution_order:
                component_type = node_types.get(node_id)
                if not component_type:
                    continue
                
                node = node_map.get(node_id, {})
                node_label = node.get("data", {}).get("label", component_type)
                settings = self._extract_node_settings(node, component_type)
                
                await self._execute_dynamic_node(
                    execution_id=execution_id,
                    node_id=node_id,
                    component_type=component_type,
                    node_label=node_label,
                    settings=settings,
                    payload=payload,
                    context=context,
                    has_llm=has_llm,
                    has_kb=has_kb
                )

            # Build final result
            total_duration = time.time() - execution_start_time

            # Determine the answer based on what was executed
            if has_llm:
                # LLM generated an answer
                answer = context.get("answer", context.get("output", ""))
            elif has_kb:
                # Only KB - return retrieved context
                answer = context.get("context", "")
                if answer:
                    answer = f"📚 Retrieved from documents:\n\n{answer}"
                else:
                    answer = "No relevant documents found."
            else:
                # No LLM, No KB - just echo the query
                answer = f"Query received: {query}\n\n⚠️ No LLM node in workflow. Add an LLM node to generate AI responses."

            # Complete execution
            await execution_log_service.complete_execution(
                execution_id=execution_id,
                status=ExecutionStatus.COMPLETED
            )

            # Record metrics
            WORKFLOW_EXECUTIONS_TOTAL.labels(
                workflow_id=workflow_id,
                status='success'
            ).inc()
            WORKFLOW_EXECUTION_DURATION.labels(
                workflow_id=workflow_id
            ).observe(total_duration)

            logger.info(
                "workflow_execution_complete_dynamic",
                workflow_id=workflow_id,
                execution_id=execution_id,
                components_executed=list(present_components),
                has_answer=bool(answer),
                duration_seconds=round(total_duration, 3)
            )

            result = {
                "answer": answer,
                "query": query,
                "_execution": {
                    "execution_id": execution_id,
                    "workflow_id": workflow_id,
                    "duration_seconds": round(total_duration, 3),
                    "status": "completed",
                    "components_used": list(present_components),
                    "kb_used": has_kb,
                    "llm_used": has_llm,
                    "context_length": len(context.get("context", ""))
                }
            }

            return result

        except Exception as e:
            total_duration = time.time() - execution_start_time

            await execution_log_service.log(
                execution_id=execution_id,
                level=LogLevel.ERROR,
                message=f"Workflow execution failed: {str(e)}",
                metadata={"error_type": type(e).__name__, "error": str(e)}
            )

            await execution_log_service.complete_execution(
                execution_id=execution_id,
                status=ExecutionStatus.FAILED,
                error=str(e)
            )

            WORKFLOW_EXECUTIONS_TOTAL.labels(
                workflow_id=workflow_id,
                status='error'
            ).inc()

            logger.error(
                "workflow_execution_failed_dynamic",
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

    async def _execute_dynamic_node(
        self,
        execution_id: str,
        node_id: str,
        component_type: str,
        node_label: str,
        settings: Dict[str, Any],
        payload: Dict[str, Any],
        context: ComponentContext,
        has_llm: bool,
        has_kb: bool
    ):
        """Execute a single node based on its type."""
        
        node_type_label = self.NODE_TYPE_LABELS.get(component_type, component_type)
        
        # Log node start
        await execution_log_service.log_node_start(
            execution_id=execution_id,
            node_id=node_id,
            node_type=node_type_label,
            node_name=node_label
        )

        start_time = time.time()

        try:
            result = None
            
            if component_type == "user_query":
                # User Query - just store the query in context
                query = settings.get("query") or payload.get("query", "")
                context["query"] = query
                result = {"query": query}
                
                await execution_log_service.log(
                    execution_id=execution_id,
                    level=LogLevel.INFO,
                    message=f"Query: {query[:100]}{'...' if len(query) > 100 else ''}",
                    node_id=node_id,
                    node_type=node_type_label
                )

            elif component_type == "knowledge_base":
                # Knowledge Base - retrieve context
                kb_enabled = settings.get("enabled", True)
                doc_count = self.store.count()
                
                if kb_enabled and doc_count > 0:
                    kb_payload = {
                        **payload,
                        "query": context.get("query", ""),
                        "top_k": settings.get("topK", 3),
                        "threshold": settings.get("threshold", 0.7)
                    }
                    
                    result = await self.components["knowledge_base"].run(kb_payload, context)
                    
                    chunks_retrieved = result.get("chunks", 0)
                    await execution_log_service.log(
                        execution_id=execution_id,
                        level=LogLevel.INFO,
                        message=f"Retrieved {chunks_retrieved} relevant chunks",
                        node_id=node_id,
                        node_type=node_type_label,
                        metadata={"chunks": chunks_retrieved, "doc_count": doc_count}
                    )
                else:
                    context["context"] = ""
                    skip_reason = "disabled" if not kb_enabled else "no documents uploaded"
                    result = {"context": "", "chunks": 0, "skipped": skip_reason}
                    
                    await execution_log_service.log(
                        execution_id=execution_id,
                        level=LogLevel.WARNING,
                        message=f"Knowledge base skipped: {skip_reason}",
                        node_id=node_id,
                        node_type=node_type_label
                    )

            elif component_type == "llm_engine":
                # LLM Engine - generate response
                llm_payload = {
                    **payload,
                    "query": context.get("query", ""),
                    "context": context.get("context", ""),
                    "provider": settings.get("provider", "google"),
                    "model": settings.get("model"),
                    "systemPrompt": settings.get("systemPrompt") or payload.get("prompt"),
                    "temperature": settings.get("temperature", 0.7),
                    "maxTokens": settings.get("maxTokens", 4096)
                }
                
                result = await self.components["llm_engine"].run(llm_payload, context)
                
                answer_preview = str(context.get("answer", ""))[:100]
                await execution_log_service.log(
                    execution_id=execution_id,
                    level=LogLevel.INFO,
                    message=f"LLM response generated",
                    node_id=node_id,
                    node_type=node_type_label,
                    metadata={
                        "provider": settings.get("provider"),
                        "has_context": bool(context.get("context")),
                        "answer_preview": answer_preview
                    }
                )

            elif component_type == "output":
                # Output - finalize
                result = await self.components["output"].run(payload, context)
                
                await execution_log_service.log(
                    execution_id=execution_id,
                    level=LogLevel.INFO,
                    message="Output formatted",
                    node_id=node_id,
                    node_type=node_type_label
                )

            duration_ms = (time.time() - start_time) * 1000

            # Log node completion
            await execution_log_service.log_node_complete(
                execution_id=execution_id,
                node_id=node_id,
                node_type=node_type_label,
                duration_ms=duration_ms,
                output_summary=self._summarize_output(result)
            )

            # Record metrics
            ctx = execution_log_service.get_execution_context(execution_id)
            if ctx:
                WORKFLOW_NODE_EXECUTIONS.labels(
                    workflow_id=ctx.workflow_id,
                    node_type=node_type_label,
                    status='success'
                ).inc()
            WORKFLOW_NODE_DURATION.labels(node_type=node_type_label).observe(duration_ms / 1000)

        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000

            await execution_log_service.log_node_error(
                execution_id=execution_id,
                node_id=node_id,
                node_type=node_type_label,
                error=str(e)
            )

            ctx = execution_log_service.get_execution_context(execution_id)
            if ctx:
                WORKFLOW_NODE_EXECUTIONS.labels(
                    workflow_id=ctx.workflow_id,
                    node_type=node_type_label,
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
            if "context" in output:
                ctx = output["context"]
                return f"Context: {len(ctx)} chars"
            if "query" in output:
                return f"Query: {output['query'][:50]}..."
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