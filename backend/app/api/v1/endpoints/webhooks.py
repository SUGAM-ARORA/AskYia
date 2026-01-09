# backend/app/api/v1/endpoints/webhooks.py
from fastapi import APIRouter, Depends, HTTPException, Query, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
import hmac
import hashlib
import json

from app.api import deps
from app.schemas.webhook import (
    WebhookCreate, WebhookUpdate, WebhookOut, WebhookLogOut,
    WebhookTriggerRequest, WebhookTriggerResponse
)
from app.repositories.webhook import webhook_repository
from app.repositories.workflow import workflow_repository
from app.services.workflow_executor import WorkflowExecutor
from app.services.state import vector_store, embedding_service
from app.core.config import get_settings

router = APIRouter()
settings = get_settings()
executor = WorkflowExecutor(store=vector_store, embedder=embedding_service)


# ============== Webhook CRUD ==============

@router.post("", response_model=WebhookOut)
async def create_webhook(
    webhook_in: WebhookCreate,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """Create a new webhook."""
    # Verify workflow access
    has_access = await workflow_repository.check_access(
        db, webhook_in.workflow_id, int(current_user["sub"])
    )
    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied to workflow")
    
    # Check trigger path uniqueness
    if webhook_in.is_trigger and webhook_in.trigger_path:
        existing = await webhook_repository.get_by_trigger_path(db, webhook_in.trigger_path)
        if existing:
            raise HTTPException(status_code=400, detail="Trigger path already in use")
    
    webhook_data = webhook_in.model_dump()
    webhook_data["owner_id"] = int(current_user["sub"])
    webhook_data["events"] = [e.value for e in webhook_in.events] if webhook_in.events else []
    
    webhook = await webhook_repository.create(db, obj_in=webhook_data)
    
    # Build trigger URL if applicable
    trigger_url = None
    if webhook.is_trigger and webhook.trigger_path:
        trigger_url = f"{settings.frontend_url}/api/v1/webhooks/trigger/{webhook.trigger_path}"
    
    return WebhookOut(
        id=webhook.id,
        uuid=webhook.uuid,
        name=webhook.name,
        description=webhook.description,
        workflow_id=webhook.workflow_id,
        url=webhook.url,
        events=webhook.events or [],
        is_trigger=webhook.is_trigger,
        trigger_path=webhook.trigger_path,
        trigger_url=trigger_url,
        is_active=webhook.is_active,
        total_calls=webhook.total_calls,
        successful_calls=webhook.successful_calls,
        failed_calls=webhook.failed_calls,
        last_triggered_at=webhook.last_triggered_at,
        created_at=webhook.created_at
    )


@router.get("", response_model=List[WebhookOut])
async def list_webhooks(
    workflow_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """List webhooks."""
    if workflow_id:
        webhooks = await webhook_repository.get_workflow_webhooks(db, workflow_id)
    else:
        webhooks = await webhook_repository.get_user_webhooks(
            db, int(current_user["sub"]), skip=skip, limit=limit
        )
    
    result = []
    for w in webhooks:
        trigger_url = None
        if w.is_trigger and w.trigger_path:
            trigger_url = f"{settings.frontend_url}/api/v1/webhooks/trigger/{w.trigger_path}"
        
        result.append(WebhookOut(
            id=w.id,
            uuid=w.uuid,
            name=w.name,
            description=w.description,
            workflow_id=w.workflow_id,
            url=w.url,
            events=w.events or [],
            is_trigger=w.is_trigger,
            trigger_path=w.trigger_path,
            trigger_url=trigger_url,
            is_active=w.is_active,
            total_calls=w.total_calls,
            successful_calls=w.successful_calls,
            failed_calls=w.failed_calls,
            last_triggered_at=w.last_triggered_at,
            created_at=w.created_at
        ))
    
    return result


@router.get("/{webhook_id}", response_model=WebhookOut)
async def get_webhook(
    webhook_id: int,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """Get webhook by ID."""
    webhook = await webhook_repository.get(db, webhook_id)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    if webhook.owner_id != int(current_user["sub"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    trigger_url = None
    if webhook.is_trigger and webhook.trigger_path:
        trigger_url = f"{settings.frontend_url}/api/v1/webhooks/trigger/{webhook.trigger_path}"
    
    return WebhookOut(
        id=webhook.id,
        uuid=webhook.uuid,
        name=webhook.name,
        description=webhook.description,
        workflow_id=webhook.workflow_id,
        url=webhook.url,
        events=webhook.events or [],
        is_trigger=webhook.is_trigger,
        trigger_path=webhook.trigger_path,
        trigger_url=trigger_url,
        is_active=webhook.is_active,
        total_calls=webhook.total_calls,
        successful_calls=webhook.successful_calls,
        failed_calls=webhook.failed_calls,
        last_triggered_at=webhook.last_triggered_at,
        created_at=webhook.created_at
    )


@router.put("/{webhook_id}", response_model=WebhookOut)
async def update_webhook(
    webhook_id: int,
    webhook_in: WebhookUpdate,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """Update a webhook."""
    webhook = await webhook_repository.get(db, webhook_id)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    if webhook.owner_id != int(current_user["sub"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = webhook_in.model_dump(exclude_unset=True)
    if "events" in update_data and update_data["events"]:
        update_data["events"] = [e.value if hasattr(e, 'value') else e for e in update_data["events"]]
    
    updated = await webhook_repository.update(db, db_obj=webhook, obj_in=update_data)
    
    trigger_url = None
    if updated.is_trigger and updated.trigger_path:
        trigger_url = f"{settings.frontend_url}/api/v1/webhooks/trigger/{updated.trigger_path}"
    
    return WebhookOut(
        id=updated.id,
        uuid=updated.uuid,
        name=updated.name,
        description=updated.description,
        workflow_id=updated.workflow_id,
        url=updated.url,
        events=updated.events or [],
        is_trigger=updated.is_trigger,
        trigger_path=updated.trigger_path,
        trigger_url=trigger_url,
        is_active=updated.is_active,
        total_calls=updated.total_calls,
        successful_calls=updated.successful_calls,
        failed_calls=updated.failed_calls,
        last_triggered_at=updated.last_triggered_at,
        created_at=updated.created_at
    )


@router.delete("/{webhook_id}")
async def delete_webhook(
    webhook_id: int,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """Delete a webhook."""
    webhook = await webhook_repository.get(db, webhook_id)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    if webhook.owner_id != int(current_user["sub"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    await webhook_repository.delete(db, id=webhook_id)
    return {"message": "Webhook deleted"}


@router.get("/{webhook_id}/logs", response_model=List[WebhookLogOut])
async def get_webhook_logs(
    webhook_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """Get webhook call logs."""
    webhook = await webhook_repository.get(db, webhook_id)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    if webhook.owner_id != int(current_user["sub"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    logs = await webhook_repository.get_logs(db, webhook_id, skip=skip, limit=limit)
    return logs


# ============== Webhook Triggers ==============

@router.post("/trigger/{trigger_path:path}", response_model=WebhookTriggerResponse)
@router.get("/trigger/{trigger_path:path}", response_model=WebhookTriggerResponse)
async def trigger_webhook(
    trigger_path: str,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(deps.get_session)
):
    """
    Incoming webhook trigger endpoint.
    Triggers workflow execution when called.
    """
    # Find webhook by trigger path
    webhook = await webhook_repository.get_by_trigger_path(db, trigger_path)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    if not webhook.is_active:
        raise HTTPException(status_code=400, detail="Webhook is disabled")
    
    # Check allowed methods
    if request.method not in (webhook.allowed_methods or ["POST"]):
        raise HTTPException(
            status_code=405, 
            detail=f"Method {request.method} not allowed. Allowed: {webhook.allowed_methods}"
        )
    
    # Verify secret if configured
    if webhook.trigger_secret:
        provided_secret = request.headers.get("X-Webhook-Secret")
        signature = request.headers.get("X-Webhook-Signature")
        
        if signature:
            # Verify HMAC signature
            body = await request.body()
            expected_sig = hmac.new(
                webhook.trigger_secret.encode(),
                body,
                hashlib.sha256
            ).hexdigest()
            
            if not hmac.compare_digest(signature, expected_sig):
                raise HTTPException(status_code=401, detail="Invalid signature")
        elif provided_secret:
            if provided_secret != webhook.trigger_secret:
                raise HTTPException(status_code=401, detail="Invalid secret")
        else:
            raise HTTPException(status_code=401, detail="Authentication required")
    
    # Parse request body
    try:
        if request.method == "GET":
            data = dict(request.query_params)
            query = data.get("query", data.get("q", ""))
        else:
            body = await request.body()
            if body:
                data = json.loads(body)
            else:
                data = {}
            query = data.get("query", data.get("q", ""))
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    
    # Get workflow
    workflow = webhook.workflow
    if not workflow:
        raise HTTPException(status_code=404, detail="Associated workflow not found")
    
    # Execute workflow
    payload = {
        "query": query,
        "webhook_data": data,
        "webhook_id": webhook.uuid,
        "trigger_path": trigger_path,
        **data.get("variables", {})
    }
    
    try:
        result = await executor.execute(
            definition=workflow.definition,
            payload=payload,
            workflow_id=str(workflow.uuid)
        )
        
        execution_id = result.get("_execution", {}).get("execution_id", "")
        status = result.get("_execution", {}).get("status", "completed")
        
        # Log the webhook call
        background_tasks.add_task(
            webhook_repository.log_call,
            db,
            webhook.id,
            event="trigger.incoming",
            method=request.method,
            request_headers=dict(request.headers),
            request_body=json.dumps(data) if data else None,
            response_status=200,
            success=True
        )
        
        # Update stats
        background_tasks.add_task(
            webhook_repository.update_stats,
            db,
            webhook.id,
            True
        )
        
        return WebhookTriggerResponse(
            execution_id=execution_id,
            status=status,
            result=result
        )
        
    except Exception as e:
        # Log failed call
        background_tasks.add_task(
            webhook_repository.log_call,
            db,
            webhook.id,
            event="trigger.incoming",
            method=request.method,
            request_body=json.dumps(data) if data else None,
            success=False,
            error_message=str(e)
        )
        
        background_tasks.add_task(
            webhook_repository.update_stats,
            db,
            webhook.id,
            False
        )
        
        raise HTTPException(status_code=500, detail=f"Workflow execution failed: {str(e)}")


@router.post("/{webhook_id}/test")
async def test_webhook(
    webhook_id: int,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """Test an outgoing webhook by sending a test payload."""
    import aiohttp
    import time
    
    webhook = await webhook_repository.get(db, webhook_id)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    if webhook.owner_id != int(current_user["sub"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not webhook.url:
        raise HTTPException(status_code=400, detail="Webhook has no URL configured")
    
    # Prepare test payload
    test_payload = {
        "event": "webhook.test",
        "webhook_id": webhook.uuid,
        "workflow_id": webhook.workflow_id,
        "timestamp": time.time(),
        "data": {
            "message": "This is a test webhook call from Askyia"
        }
    }
    
    # Prepare headers
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Askyia-Webhook/1.0",
        **(webhook.headers or {})
    }
    
    # Add signature if secret is configured
    if webhook.secret:
        payload_bytes = json.dumps(test_payload).encode()
        signature = hmac.new(
            webhook.secret.encode(),
            payload_bytes,
            hashlib.sha256
        ).hexdigest()
        headers["X-Askyia-Signature"] = signature
    
    start_time = time.time()
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                webhook.url,
                json=test_payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                response_time = int((time.time() - start_time) * 1000)
                response_body = await response.text()
                
                success = 200 <= response.status < 300
                
                # Log the test call
                await webhook_repository.log_call(
                    db,
                    webhook.id,
                    event="webhook.test",
                    method="POST",
                    request_headers=headers,
                    request_body=json.dumps(test_payload),
                    response_status=response.status,
                    response_body=response_body[:1000],
                    response_time_ms=response_time,
                    success=success
                )
                
                await webhook_repository.update_stats(db, webhook.id, success)
                
                return {
                    "success": success,
                    "status_code": response.status,
                    "response_time_ms": response_time,
                    "response_body": response_body[:500]
                }
                
    except Exception as e:
        response_time = int((time.time() - start_time) * 1000)
        
        await webhook_repository.log_call(
            db,
            webhook.id,
            event="webhook.test",
            method="POST",
            request_body=json.dumps(test_payload),
            response_time_ms=response_time,
            success=False,
            error_message=str(e)
        )
        
        await webhook_repository.update_stats(db, webhook.id, False)
        
        return {
            "success": False,
            "error": str(e),
            "response_time_ms": response_time
        }