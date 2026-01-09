# backend/app/api/v1/endpoints/chat.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.api import deps
from app.schemas.chat import (
    ChatSessionCreate, ChatSessionUpdate, ChatSessionOut,
    ChatMessageCreate, ChatMessageOut,
    ChatRequest, ChatResponse
)
from app.repositories.chat import chat_session_repository, chat_message_repository
from app.services.llm_service import get_llm_service
from app.services.vector_store import get_vector_store
from app.services.embedding_service import get_embedding_service

router = APIRouter()
llm_service = get_llm_service()
vector_store = get_vector_store()
embedding_service = get_embedding_service()


# ============== Chat Sessions ==============

@router.post("/sessions", response_model=ChatSessionOut)
async def create_session(
    session_in: ChatSessionCreate,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """Create a new chat session."""
    session_data = session_in.model_dump()
    session_data["user_id"] = int(current_user["sub"])
    
    session = await chat_session_repository.create(db, obj_in=session_data)
    message_count = await chat_session_repository.get_message_count(db, session.id)
    
    return ChatSessionOut(
        id=session.id,
        uuid=session.uuid,
        title=session.title,
        workflow_id=session.workflow_id,
        model=session.model,
        is_active=session.is_active,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=message_count
    )


@router.get("/sessions", response_model=List[ChatSessionOut])
async def list_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    active_only: bool = True,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """List user's chat sessions."""
    sessions = await chat_session_repository.get_user_sessions(
        db, int(current_user["sub"]),
        skip=skip, limit=limit, active_only=active_only
    )
    
    result = []
    for s in sessions:
        message_count = await chat_session_repository.get_message_count(db, s.id)
        result.append(ChatSessionOut(
            id=s.id,
            uuid=s.uuid,
            title=s.title,
            workflow_id=s.workflow_id,
            model=s.model,
            is_active=s.is_active,
            created_at=s.created_at,
            updated_at=s.updated_at,
            message_count=message_count
        ))
    
    return result


@router.get("/sessions/{session_uuid}", response_model=ChatSessionOut)
async def get_session(
    session_uuid: str,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """Get chat session by UUID."""
    session = await chat_session_repository.get_by_uuid(db, session_uuid)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.user_id != int(current_user["sub"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    message_count = await chat_session_repository.get_message_count(db, session.id)
    
    return ChatSessionOut(
        id=session.id,
        uuid=session.uuid,
        title=session.title,
        workflow_id=session.workflow_id,
        model=session.model,
        is_active=session.is_active,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=message_count
    )


@router.put("/sessions/{session_uuid}", response_model=ChatSessionOut)
async def update_session(
    session_uuid: str,
    session_in: ChatSessionUpdate,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """Update chat session."""
    session = await chat_session_repository.get_by_uuid(db, session_uuid)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.user_id != int(current_user["sub"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = session_in.model_dump(exclude_unset=True)
    updated = await chat_session_repository.update(db, db_obj=session, obj_in=update_data)
    message_count = await chat_session_repository.get_message_count(db, updated.id)
    
    return ChatSessionOut(
        id=updated.id,
        uuid=updated.uuid,
        title=updated.title,
        workflow_id=updated.workflow_id,
        model=updated.model,
        is_active=updated.is_active,
        created_at=updated.created_at,
        updated_at=updated.updated_at,
        message_count=message_count
    )


@router.delete("/sessions/{session_uuid}")
async def delete_session(
    session_uuid: str,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """Delete chat session."""
    session = await chat_session_repository.get_by_uuid(db, session_uuid)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.user_id != int(current_user["sub"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    await chat_session_repository.delete(db, id=session.id)
    return {"message": "Session deleted"}


# ============== Chat Messages ==============

@router.get("/sessions/{session_uuid}/messages", response_model=List[ChatMessageOut])
async def get_messages(
    session_uuid: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """Get messages for a chat session."""
    session = await chat_session_repository.get_by_uuid(db, session_uuid)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.user_id != int(current_user["sub"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    messages = await chat_message_repository.get_session_messages(
        db, session.id, skip=skip, limit=limit
    )
    return messages


# ============== Chat Endpoint ==============

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(deps.get_session),
    current_user: dict = Depends(deps.get_current_user)
):
    """
    Send a chat message and get AI response.
    Creates a new session if session_id is not provided.
    """
    user_id = int(current_user["sub"])
    
    # Get or create session
    session = None
    if request.session_id:
        session = await chat_session_repository.get_by_uuid(db, request.session_id)
        if session and session.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    if not session:
        # Create new session
        session_data = {
            "user_id": user_id,
            "workflow_id": request.workflow_id,
            "model": request.model,
            "system_prompt": request.system_prompt,
            "title": request.message[:50] + "..." if len(request.message) > 50 else request.message
        }
        session = await chat_session_repository.create(db, obj_in=session_data)
    
    # Save user message
    user_message = await chat_message_repository.add_message(
        db,
        session_id=session.id,
        role="user",
        content=request.message,
        workflow_id=request.workflow_id
    )
    
    # Build context from recent messages
    recent_messages = await chat_message_repository.get_recent_messages(db, session.id, limit=10)
    conversation_history = "\n".join([
        f"{m.role.capitalize()}: {m.content}" 
        for m in recent_messages[:-1]  # Exclude current message
    ])
    
    # Get RAG context if requested
    rag_context = ""
    if request.include_context and vector_store.count() > 0:
        try:
            query_embedding = await embedding_service.embed_query(request.message)
            results = await vector_store.similarity_search(query_embedding, top_k=3)
            if results:
                rag_context = "\n\n".join([r.get("text", "") for r in results])
        except Exception as e:
            pass  # Continue without RAG context
    
    # Build full context
    full_context = ""
    if conversation_history:
        full_context += f"Previous conversation:\n{conversation_history}\n\n"
    if rag_context:
        full_context += f"Relevant documents:\n{rag_context}\n\n"
    
    # Get system prompt
    system_prompt = request.system_prompt or session.system_prompt or "You are a helpful AI assistant."
    
    # Generate response
    try:
        response_text = await llm_service.generate(
            query=request.message,
            context=full_context if full_context else None,
            prompt=system_prompt,
            model=request.model or session.model
        )
    except Exception as e:
        response_text = f"I apologize, but I encountered an error: {str(e)}"
    
    # Save assistant response
    assistant_message = await chat_message_repository.add_message(
        db,
        session_id=session.id,
        role="assistant",
        content=response_text,
        workflow_id=request.workflow_id,
        model_used=request.model or session.model
    )
    
    return ChatResponse(
        session_id=session.uuid,
        message=user_message,
        response=assistant_message
    )


# ============== Legacy Endpoints ==============

@router.post("/send")
async def send_message_legacy(
    body: dict,
    db: AsyncSession = Depends(deps.get_session),
    current_user: Optional[dict] = Depends(deps.get_current_user_optional)
):
    """Legacy chat endpoint for backward compatibility."""
    message = body.get("message", "")
    workflow_id = body.get("workflow_id")
    
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")
    
    # Generate response directly without session management
    try:
        response_text = await llm_service.generate(
            query=message,
            prompt="You are a helpful AI assistant."
        )
    except Exception as e:
        response_text = f"Error: {str(e)}"
    
    return {
        "response": response_text,
        "workflow_id": workflow_id
    }