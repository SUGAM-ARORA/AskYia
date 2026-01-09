# backend/app/api/v1/endpoints/workflows.py
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime, timedelta

from app.api import deps
from app.schemas.workflow import (
    WorkflowCreate, WorkflowUpdate, WorkflowOut, WorkflowListOut,
    WorkflowVersionCreate, WorkflowVersionOut,
    CollaboratorAdd, CollaboratorUpdate, CollaboratorOut,
    ShareCreate, ShareOut,
    WorkflowExecuteRequest, WorkflowExecuteResponse
)
from app.repositories.workflow import workflow_repository
from app.repositories.user import UserRepository
from app.repositories.execution_log import execution_log_repository
from app.services.workflow_executor import WorkflowExecutor
from app.services.webhook_service import webhook_service
from app.services.state import vector_store, embedding_service
from app.core.config import get_settings
from app.models.workflow import CollaboratorRole

router = APIRouter()
user_repo = UserRepository()
executor = WorkflowExecutor(store=vector_store, embedder=embedding_service)
settings = get_settings()


# ============== CRUD Endpoints ==============

@router.post("", response_model=WorkflowOut)
async def create_workflow(
    workflow_in: WorkflowCreate,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """Create a new workflow."""
    workflow_data = workflow_in.model_dump()
    workflow_data["owner_id"] = int(current_user["sub"])
    
    workflow = await workflow_repository.create(db, obj_in=workflow_data)
    return workflow


@router.get("", response_model=List[WorkflowListOut])
async def list_workflows(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """List user's workflows."""
    workflows = await workflow_repository.get_user_workflows(
        db,
        user_id=int(current_user["sub"]),
        skip=skip,
        limit=limit,
        status=status,
        search=search
    )
    return workflows


@router.get("/public", response_model=List[WorkflowListOut])
async def list_public_workflows(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    db: AsyncSession = Depends(deps.get_session)
):
    """List public workflows."""
    workflows = await workflow_repository.get_public_workflows(
        db, skip=skip, limit=limit, search=search
    )
    return workflows


@router.get("/templates", response_model=List[WorkflowListOut])
async def list_templates(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(deps.get_session)
):
    """List workflow templates."""
    templates = await workflow_repository.get_templates(db, skip=skip, limit=limit)
    return templates


@router.get("/{workflow_id}", response_model=WorkflowOut)
async def get_workflow(
    workflow_id: int,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """Get workflow by ID."""
    workflow = await workflow_repository.get_with_details(db, workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Check access
    has_access = await workflow_repository.check_access(
        db, workflow_id, int(current_user["sub"])
    )
    if not has_access and not workflow.is_public:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return workflow


@router.get("/uuid/{uuid}", response_model=WorkflowOut)
async def get_workflow_by_uuid(
    uuid: str,
    db: AsyncSession = Depends(deps.get_session),
    current_user: Optional[dict] = Depends(deps.get_current_user_optional)
):
    """Get workflow by UUID."""
    workflow = await workflow_repository.get_by_uuid(db, uuid)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Check access
    if current_user:
        has_access = await workflow_repository.check_access(
            db, workflow.id, int(current_user["sub"])
        )
        if not has_access and not workflow.is_public:
            raise HTTPException(status_code=403, detail="Access denied")
    elif not workflow.is_public:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return workflow


@router.put("/{workflow_id}", response_model=WorkflowOut)
async def update_workflow(
    workflow_id: int,
    workflow_in: WorkflowUpdate,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """Update a workflow."""
    workflow = await workflow_repository.get(db, workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Check edit access
    has_access = await workflow_repository.check_access(
        db, workflow_id, int(current_user["sub"]), CollaboratorRole.EDITOR
    )
    if not has_access:
        raise HTTPException(status_code=403, detail="Edit access denied")
    
    update_data = workflow_in.model_dump(exclude_unset=True)
    updated = await workflow_repository.update(db, db_obj=workflow, obj_in=update_data)
    
    return updated


@router.delete("/{workflow_id}")
async def delete_workflow(
    workflow_id: int,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """Delete a workflow."""
    workflow = await workflow_repository.get(db, workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Only owner can delete
    if workflow.owner_id != int(current_user["sub"]):
        raise HTTPException(status_code=403, detail="Only owner can delete workflow")
    
    await workflow_repository.delete(db, id=workflow_id)
    return {"message": "Workflow deleted"}


@router.post("/{workflow_id}/duplicate", response_model=WorkflowOut)
async def duplicate_workflow(
    workflow_id: int,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """Duplicate a workflow."""
    workflow = await workflow_repository.get(db, workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Check access
    has_access = await workflow_repository.check_access(
        db, workflow_id, int(current_user["sub"])
    )
    if not has_access and not workflow.is_public:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Create duplicate
    new_workflow_data = {
        "name": f"{workflow.name} (Copy)",
        "description": workflow.description,
        "definition": workflow.definition,
        "tags": workflow.tags,
        "owner_id": int(current_user["sub"])
    }
    
    new_workflow = await workflow_repository.create(db, obj_in=new_workflow_data)
    return new_workflow


# ============== Version Endpoints ==============

@router.post("/{workflow_id}/versions", response_model=WorkflowVersionOut)
async def create_version(
    workflow_id: int,
    version_in: WorkflowVersionCreate,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """Create a new version of the workflow."""
    has_access = await workflow_repository.check_access(
        db, workflow_id, int(current_user["sub"]), CollaboratorRole.EDITOR
    )
    if not has_access:
        raise HTTPException(status_code=403, detail="Edit access denied")
    
    version = await workflow_repository.create_version(
        db,
        workflow_id=workflow_id,
        user_id=int(current_user["sub"]),
        commit_message=version_in.commit_message
    )
    return version


@router.get("/{workflow_id}/versions", response_model=List[WorkflowVersionOut])
async def list_versions(
    workflow_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """List workflow versions."""
    has_access = await workflow_repository.check_access(
        db, workflow_id, int(current_user["sub"])
    )
    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")
    
    versions = await workflow_repository.get_versions(db, workflow_id, skip=skip, limit=limit)
    return versions


@router.get("/{workflow_id}/versions/{version}", response_model=WorkflowVersionOut)
async def get_version(
    workflow_id: int,
    version: int,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """Get specific version of workflow."""
    has_access = await workflow_repository.check_access(
        db, workflow_id, int(current_user["sub"])
    )
    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")
    
    version_obj = await workflow_repository.get_version(db, workflow_id, version)
    if not version_obj:
        raise HTTPException(status_code=404, detail="Version not found")
    
    return version_obj


@router.post("/{workflow_id}/versions/{version}/restore", response_model=WorkflowOut)
async def restore_version(
    workflow_id: int,
    version: int,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """Restore workflow to specific version."""
    has_access = await workflow_repository.check_access(
        db, workflow_id, int(current_user["sub"]), CollaboratorRole.EDITOR
    )
    if not has_access:
        raise HTTPException(status_code=403, detail="Edit access denied")
    
    workflow = await workflow_repository.restore_version(
        db, workflow_id, version, int(current_user["sub"])
    )
    return workflow


# ============== Collaborator Endpoints ==============

@router.post("/{workflow_id}/collaborators", response_model=CollaboratorOut)
async def add_collaborator(
    workflow_id: int,
    collab_in: CollaboratorAdd,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """Add a collaborator to workflow."""
    # Check admin access
    has_access = await workflow_repository.check_access(
        db, workflow_id, int(current_user["sub"]), CollaboratorRole.ADMIN
    )
    workflow = await workflow_repository.get(db, workflow_id)
    if not workflow or (workflow.owner_id != int(current_user["sub"]) and not has_access):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Find user by email
    user = await user_repo.get_by_email(db, collab_in.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == workflow.owner_id:
        raise HTTPException(status_code=400, detail="Cannot add owner as collaborator")
    
    collab = await workflow_repository.add_collaborator(
        db, workflow_id, user.id, collab_in.role
    )
    
    return CollaboratorOut(
        id=collab.id,
        user_id=collab.user_id,
        role=collab.role,
        user_email=user.email,
        user_name=user.full_name,
        created_at=collab.created_at
    )


@router.get("/{workflow_id}/collaborators", response_model=List[CollaboratorOut])
async def list_collaborators(
    workflow_id: int,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """List workflow collaborators."""
    has_access = await workflow_repository.check_access(
        db, workflow_id, int(current_user["sub"])
    )
    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")
    
    collaborators = await workflow_repository.get_collaborators(db, workflow_id)
    
    return [
        CollaboratorOut(
            id=c.id,
            user_id=c.user_id,
            role=c.role,
            user_email=c.user.email if c.user else None,
            user_name=c.user.full_name if c.user else None,
            created_at=c.created_at
        )
        for c in collaborators
    ]


@router.put("/{workflow_id}/collaborators/{user_id}", response_model=CollaboratorOut)
async def update_collaborator(
    workflow_id: int,
    user_id: int,
    collab_in: CollaboratorUpdate,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """Update collaborator role."""
    workflow = await workflow_repository.get(db, workflow_id)
    if not workflow or workflow.owner_id != int(current_user["sub"]):
        raise HTTPException(status_code=403, detail="Only owner can update collaborators")
    
    collab = await workflow_repository.update_collaborator_role(
        db, workflow_id, user_id, collab_in.role
    )
    if not collab:
        raise HTTPException(status_code=404, detail="Collaborator not found")
    
    user = await user_repo.get(db, user_id)
    return CollaboratorOut(
        id=collab.id,
        user_id=collab.user_id,
        role=collab.role,
        user_email=user.email if user else None,
        user_name=user.full_name if user else None,
        created_at=collab.created_at
    )


@router.delete("/{workflow_id}/collaborators/{user_id}")
async def remove_collaborator(
    workflow_id: int,
    user_id: int,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """Remove a collaborator."""
    workflow = await workflow_repository.get(db, workflow_id)
    if not workflow or workflow.owner_id != int(current_user["sub"]):
        raise HTTPException(status_code=403, detail="Only owner can remove collaborators")
    
    removed = await workflow_repository.remove_collaborator(db, workflow_id, user_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Collaborator not found")
    
    return {"message": "Collaborator removed"}


# ============== Share Endpoints ==============

@router.post("/{workflow_id}/shares", response_model=ShareOut)
async def create_share(
    workflow_id: int,
    share_in: ShareCreate,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """Create a shareable link for workflow."""
    has_access = await workflow_repository.check_access(
        db, workflow_id, int(current_user["sub"]), CollaboratorRole.ADMIN
    )
    workflow = await workflow_repository.get(db, workflow_id)
    if not workflow or (workflow.owner_id != int(current_user["sub"]) and not has_access):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    expires_at = None
    if share_in.expires_in_days:
        expires_at = datetime.utcnow() + timedelta(days=share_in.expires_in_days)
    
    share = await workflow_repository.create_share(
        db,
        workflow_id=workflow_id,
        user_id=int(current_user["sub"]),
        allow_edit=share_in.allow_edit,
        allow_execute=share_in.allow_execute,
        allow_duplicate=share_in.allow_duplicate,
        expires_at=expires_at,
        max_uses=share_in.max_uses
    )
    
    share_url = f"{settings.frontend_url}/workflow/shared/{share.share_token}"
    
    return ShareOut(
        id=share.id,
        share_token=share.share_token,
        share_url=share_url,
        allow_edit=share.allow_edit,
        allow_execute=share.allow_execute,
        allow_duplicate=share.allow_duplicate,
        expires_at=share.expires_at,
        max_uses=share.max_uses,
        use_count=share.use_count,
        created_at=share.created_at
    )


@router.get("/{workflow_id}/shares", response_model=List[ShareOut])
async def list_shares(
    workflow_id: int,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """List share links for workflow."""
    workflow = await workflow_repository.get(db, workflow_id)
    if not workflow or workflow.owner_id != int(current_user["sub"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    shares = await workflow_repository.get_shares(db, workflow_id)
    
    return [
        ShareOut(
            id=s.id,
            share_token=s.share_token,
            share_url=f"{settings.frontend_url}/workflow/shared/{s.share_token}",
            allow_edit=s.allow_edit,
            allow_execute=s.allow_execute,
            allow_duplicate=s.allow_duplicate,
            expires_at=s.expires_at,
            max_uses=s.max_uses,
            use_count=s.use_count,
            created_at=s.created_at
        )
        for s in shares
    ]


@router.delete("/{workflow_id}/shares/{share_id}")
async def delete_share(
    workflow_id: int,
    share_id: int,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """Delete a share link."""
    workflow = await workflow_repository.get(db, workflow_id)
    if not workflow or workflow.owner_id != int(current_user["sub"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    deleted = await workflow_repository.delete_share(db, share_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Share not found")
    
    return {"message": "Share link deleted"}


@router.get("/shared/{token}", response_model=WorkflowOut)
async def get_shared_workflow(
    token: str,
    db: AsyncSession = Depends(deps.get_session)
):
    """Access a workflow via share token."""
    share = await workflow_repository.get_share_by_token(db, token)
    if not share:
        raise HTTPException(status_code=404, detail="Share link not found")
    
    # Check expiration
    if share.expires_at and share.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Share link expired")
    
    # Check max uses
    if share.max_uses and share.use_count >= share.max_uses:
        raise HTTPException(status_code=410, detail="Share link usage limit reached")
    
    # Increment usage
    await workflow_repository.increment_share_usage(db, share.id)
    
    return share.workflow


# ============== Execution Endpoints ==============

@router.post("/{workflow_id}/execute", response_model=WorkflowExecuteResponse)
async def execute_workflow(
    workflow_id: int,
    request: WorkflowExecuteRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """Execute a workflow."""
    workflow = await workflow_repository.get(db, workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Check execute access
    has_access = await workflow_repository.check_access(
        db, workflow_id, int(current_user["sub"])
    )
    if not has_access and not workflow.is_public:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Execute workflow
    payload = {
        "query": request.query,
        "prompt": request.prompt,
        "web_search": request.web_search,
        **request.variables
    }
    
    result = await executor.execute(
        definition=workflow.definition,
        payload=payload,
        user_id=str(current_user["sub"]),
        workflow_id=str(workflow.uuid)
    )
    
    # Increment execution count
    await workflow_repository.increment_execution_count(db, workflow_id)
    
    # Store execution log
    execution_id = result.get("_execution", {}).get("execution_id", "")
    await execution_log_repository.create_execution(
        db,
        execution_id=execution_id,
        workflow_id=workflow_id,
        user_id=int(current_user["sub"]),
        workflow_version=workflow.current_version,
        input_data=payload
    )
    
    await execution_log_repository.complete_execution(
        db,
        execution_id=execution_id,
        status=result.get("_execution", {}).get("status", "completed"),
        output_data=result,
        duration_seconds=result.get("_execution", {}).get("duration_seconds")
    )
    
    # Trigger webhooks in background
    background_tasks.add_task(
        webhook_service.trigger_event,
        db,
        workflow_id,
        "workflow.completed" if not result.get("error") else "workflow.failed",
        result
    )
    
    return WorkflowExecuteResponse(
        execution_id=execution_id,
        workflow_id=workflow.uuid,
        status=result.get("_execution", {}).get("status", "completed"),
        result=result,
        duration_seconds=result.get("_execution", {}).get("duration_seconds")
    )


@router.get("/{workflow_id}/executions")
async def list_executions(
    workflow_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """List workflow executions."""
    has_access = await workflow_repository.check_access(
        db, workflow_id, int(current_user["sub"])
    )
    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")
    
    executions = await execution_log_repository.get_workflow_executions(
        db, workflow_id, skip=skip, limit=limit
    )
    return executions


# Legacy execution endpoint for backward compatibility
@router.post("/validate")
async def validate_workflow(body: dict):
    if "definition" not in body:
        return {"valid": False, "reason": "Missing definition"}
    if "nodes" not in body.get("definition", {}):
        return {"valid": False, "reason": "Missing nodes"}
    return {"valid": True}


@router.post("/execute")
async def execute_workflow_legacy(
    body: dict,
    db: AsyncSession = Depends(deps.get_session),
    current_user: Optional[dict] = Depends(deps.get_current_user_optional)
):
    """Legacy execute endpoint for backward compatibility."""
    definition = body.get("definition", {})
    query = body.get("query", "")
    prompt = body.get("prompt")
    web_search = body.get("web_search", False)
    
    payload = {
        "query": query,
        "prompt": prompt,
        "web_search": web_search
    }
    
    user_id = current_user["sub"] if current_user else None
    
    result = await executor.execute(
        definition=definition,
        payload=payload,
        user_id=user_id
    )
    
    return {"result": result}