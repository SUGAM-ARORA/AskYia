"""
Logs API Endpoints for Workflow Execution Monitoring
Askyia - No-Code AI Workflow Builder
"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse, Response
from sse_starlette.sse import EventSourceResponse
from typing import Optional
import asyncio
import json

from app.services.log_service import (
    execution_log_service,
    ExecutionStatus
)
from app.core.metrics import get_metrics, get_metrics_content_type

router = APIRouter()


@router.get("/executions/{execution_id}/logs")
async def get_execution_logs(
    execution_id: str,
    limit: Optional[int] = Query(100, ge=1, le=1000),
    offset: Optional[int] = Query(0, ge=0),
    level: Optional[str] = Query(None, regex="^(DEBUG|INFO|WARNING|ERROR|CRITICAL)$")
):
    """Get logs for a specific workflow execution."""
    logs = execution_log_service.get_execution_logs(execution_id)
    
    if not logs and not execution_log_service.get_execution_context(execution_id):
        raise HTTPException(status_code=404, detail="Execution not found")
    
    # Filter by level if specified
    if level:
        logs = [log for log in logs if log.level.value == level]
    
    # Apply pagination
    total = len(logs)
    logs = logs[offset:offset + limit]
    
    return {
        "execution_id": execution_id,
        "total": total,
        "offset": offset,
        "limit": limit,
        "logs": [log.to_dict() for log in logs]
    }


@router.get("/executions/{execution_id}/stream")
async def stream_execution_logs(execution_id: str):
    """Stream real-time logs for a workflow execution using Server-Sent Events."""
    
    context = execution_log_service.get_execution_context(execution_id)
    if not context:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    async def event_generator():
        try:
            async for log_entry in execution_log_service.subscribe(execution_id):
                if log_entry.metadata.get('type') == 'heartbeat':
                    yield {
                        "event": "heartbeat",
                        "data": json.dumps({"timestamp": log_entry.timestamp})
                    }
                else:
                    yield {
                        "event": "log",
                        "data": log_entry.to_json()
                    }
                
                # Check if execution is complete
                ctx = execution_log_service.get_execution_context(execution_id)
                if ctx and ctx.status in [
                    ExecutionStatus.COMPLETED,
                    ExecutionStatus.FAILED,
                    ExecutionStatus.CANCELLED
                ]:
                    yield {
                        "event": "complete",
                        "data": json.dumps({
                            "status": ctx.status.value,
                            "duration_seconds": (
                                (ctx.ended_at - ctx.started_at).total_seconds()
                                if ctx.ended_at else None
                            )
                        })
                    }
                    break
                    
        except asyncio.CancelledError:
            pass
        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e)})
            }
    
    return EventSourceResponse(event_generator())


@router.get("/executions/{execution_id}/status")
async def get_execution_status(execution_id: str):
    """Get current status of a workflow execution."""
    context = execution_log_service.get_execution_context(execution_id)
    
    if not context:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    return {
        "execution_id": execution_id,
        "workflow_id": context.workflow_id,
        "status": context.status.value,
        "started_at": context.started_at.isoformat(),
        "ended_at": context.ended_at.isoformat() if context.ended_at else None,
        "progress": {
            "completed_nodes": context.completed_nodes,
            "total_nodes": context.total_nodes,
            "percentage": (
                (context.completed_nodes / context.total_nodes * 100)
                if context.total_nodes > 0 else 0
            ),
            "current_node": context.current_node
        },
        "error": context.error
    }


@router.get("/metrics")
async def prometheus_metrics():
    """Prometheus metrics endpoint."""
    return Response(
        content=get_metrics(),
        media_type=get_metrics_content_type()
    )