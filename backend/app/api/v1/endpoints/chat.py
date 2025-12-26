from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any, Dict, Optional
from app.services.workflow_executor import WorkflowExecutor
from app.services.state import vector_store, embedding_service

router = APIRouter()
executor = WorkflowExecutor(store=vector_store, embedder=embedding_service)


class ChatRequest(BaseModel):
    query: str
    workflow_definition: Dict[str, Any]
    prompt: Optional[str] = None
    web_search: bool = False


@router.post("/ask")
async def chat(body: ChatRequest):
    payload = {"query": body.query, "prompt": body.prompt, "web_search": body.web_search}
    result = await executor.execute(definition=body.workflow_definition, payload=payload)
    return {"answer": result.get("answer")}
