from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from datetime import datetime
import uuid as uuid_lib

from app.models.webhook import Webhook, WebhookLog
from app.repositories.base import CRUDBase


class WebhookRepository(CRUDBase[Webhook]):
    def __init__(self):
        super().__init__(Webhook)

    async def create(self, db: AsyncSession, *, obj_in: Dict[str, Any]) -> Webhook:
        if 'uuid' not in obj_in:
            obj_in['uuid'] = str(uuid_lib.uuid4())
        return await super().create(db, obj_in=obj_in)

    async def get_by_uuid(self, db: AsyncSession, uuid: str) -> Optional[Webhook]:
        result = await db.execute(
            select(Webhook).where(Webhook.uuid == uuid)
        )
        return result.scalar_one_or_none()

    async def get_by_trigger_path(self, db: AsyncSession, path: str) -> Optional[Webhook]:
        result = await db.execute(
            select(Webhook)
            .options(selectinload(Webhook.workflow))
            .where(Webhook.trigger_path == path, Webhook.is_active == True)
        )
        return result.scalar_one_or_none()

    async def get_workflow_webhooks(
        self,
        db: AsyncSession,
        workflow_id: int
    ) -> List[Webhook]:
        result = await db.execute(
            select(Webhook)
            .where(Webhook.workflow_id == workflow_id)
            .order_by(Webhook.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_user_webhooks(
        self,
        db: AsyncSession,
        user_id: int,
        *,
        skip: int = 0,
        limit: int = 50
    ) -> List[Webhook]:
        result = await db.execute(
            select(Webhook)
            .where(Webhook.owner_id == user_id)
            .order_by(Webhook.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_webhooks_for_event(
        self,
        db: AsyncSession,
        workflow_id: int,
        event: str
    ) -> List[Webhook]:
        """Get active webhooks that should be triggered for an event."""
        result = await db.execute(
            select(Webhook).where(
                Webhook.workflow_id == workflow_id,
                Webhook.is_active == True,
                Webhook.is_trigger == False  # Outgoing webhooks only
            )
        )
        webhooks = list(result.scalars().all())
        
        # Filter by event
        return [w for w in webhooks if event in (w.events or [])]

    async def update_stats(
        self,
        db: AsyncSession,
        webhook_id: int,
        success: bool
    ) -> None:
        """Update webhook call statistics."""
        updates = {
            "total_calls": Webhook.total_calls + 1,
            "last_triggered_at": datetime.utcnow()
        }
        if success:
            updates["successful_calls"] = Webhook.successful_calls + 1
        else:
            updates["failed_calls"] = Webhook.failed_calls + 1
        
        await db.execute(
            update(Webhook)
            .where(Webhook.id == webhook_id)
            .values(**updates)
        )
        await db.commit()

    async def log_call(
        self,
        db: AsyncSession,
        webhook_id: int,
        *,
        event: Optional[str] = None,
        method: Optional[str] = None,
        request_headers: Optional[Dict] = None,
        request_body: Optional[str] = None,
        response_status: Optional[int] = None,
        response_body: Optional[str] = None,
        response_time_ms: Optional[int] = None,
        success: bool = False,
        error_message: Optional[str] = None
    ) -> WebhookLog:
        """Create a log entry for webhook call."""
        log = WebhookLog(
            webhook_id=webhook_id,
            event=event,
            method=method,
            request_headers=request_headers,
            request_body=request_body,
            response_status=response_status,
            response_body=response_body,
            response_time_ms=response_time_ms,
            success=success,
            error_message=error_message
        )
        db.add(log)
        await db.commit()
        await db.refresh(log)
        return log

    async def get_logs(
        self,
        db: AsyncSession,
        webhook_id: int,
        *,
        skip: int = 0,
        limit: int = 50
    ) -> List[WebhookLog]:
        result = await db.execute(
            select(WebhookLog)
            .where(WebhookLog.webhook_id == webhook_id)
            .order_by(WebhookLog.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())


webhook_repository = WebhookRepository()