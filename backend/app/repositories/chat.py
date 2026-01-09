from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from sqlalchemy.orm import selectinload
import uuid as uuid_lib

from app.models.chat import ChatSession, ChatMessage
from app.repositories.base import CRUDBase


class ChatSessionRepository(CRUDBase[ChatSession]):
    def __init__(self):
        super().__init__(ChatSession)

    async def create(self, db: AsyncSession, *, obj_in: Dict[str, Any]) -> ChatSession:
        if 'uuid' not in obj_in:
            obj_in['uuid'] = str(uuid_lib.uuid4())
        return await super().create(db, obj_in=obj_in)

    async def get_by_uuid(self, db: AsyncSession, uuid: str) -> Optional[ChatSession]:
        result = await db.execute(
            select(ChatSession)
            .options(selectinload(ChatSession.messages))
            .where(ChatSession.uuid == uuid)
        )
        return result.scalar_one_or_none()

    async def get_user_sessions(
        self,
        db: AsyncSession,
        user_id: int,
        *,
        skip: int = 0,
        limit: int = 50,
        active_only: bool = True
    ) -> List[ChatSession]:
        query = select(ChatSession).where(ChatSession.user_id == user_id)
        
        if active_only:
            query = query.where(ChatSession.is_active == True)
        
        query = query.order_by(ChatSession.updated_at.desc()).offset(skip).limit(limit)
        
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_with_messages(
        self,
        db: AsyncSession,
        session_id: int,
        *,
        message_limit: int = 100
    ) -> Optional[ChatSession]:
        result = await db.execute(
            select(ChatSession)
            .options(selectinload(ChatSession.messages))
            .where(ChatSession.id == session_id)
        )
        session = result.scalar_one_or_none()
        
        if session and len(session.messages) > message_limit:
            session.messages = session.messages[-message_limit:]
        
        return session

    async def get_message_count(self, db: AsyncSession, session_id: int) -> int:
        result = await db.execute(
            select(func.count(ChatMessage.id))
            .where(ChatMessage.session_id == session_id)
        )
        return result.scalar() or 0


class ChatMessageRepository(CRUDBase[ChatMessage]):
    def __init__(self):
        super().__init__(ChatMessage)

    async def get_session_messages(
        self,
        db: AsyncSession,
        session_id: int,
        *,
        skip: int = 0,
        limit: int = 100
    ) -> List[ChatMessage]:
        result = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_recent_messages(
        self,
        db: AsyncSession,
        session_id: int,
        limit: int = 20
    ) -> List[ChatMessage]:
        """Get most recent messages for context."""
        result = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(limit)
        )
        messages = list(result.scalars().all())
        messages.reverse()  # Return in chronological order
        return messages

    async def add_message(
        self,
        db: AsyncSession,
        session_id: int,
        role: str,
        content: str,
        *,
        workflow_id: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
        tokens_used: Optional[int] = None,
        model_used: Optional[str] = None
    ) -> ChatMessage:
        message = ChatMessage(
            session_id=session_id,
            workflow_id=workflow_id,
            role=role,
            content=content,
            metadata=metadata,
            tokens_used=tokens_used,
            model_used=model_used
        )
        db.add(message)
        
        # Update session's updated_at
        await db.execute(
            update(ChatSession)
            .where(ChatSession.id == session_id)
            .values(updated_at=func.now())
        )
        
        await db.commit()
        await db.refresh(message)
        return message


# Singleton instances
chat_session_repository = ChatSessionRepository()
chat_message_repository = ChatMessageRepository()