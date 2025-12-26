from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any, Dict, Optional
from app.services.workflow_executor import WorkflowExecutor
from app.services.state import vector_store, embedding_service

router = APIRouter()
executor = WorkflowExecutor(store=vector_store, embedder=embedding_service)


class WorkflowDefinition(BaseModel):
    definition: Dict[str, Any]


class ExecuteRequest(WorkflowDefinition):
    query: str
    prompt: Optional[str] = None
    web_search: bool = False


@router.post("/validate")
async def validate_workflow(body: WorkflowDefinition):
    # Placeholder validation
    if "nodes" not in body.definition:
        return {"valid": False, "reason": "Missing nodes"}
    return {"valid": True}


@router.post("/execute")
async def execute_workflow(body: ExecuteRequest):
    payload = {"query": body.query, "prompt": body.prompt, "web_search": body.web_search}
    result = await executor.execute(definition=body.definition, payload=payload)
    return {"result": result}
