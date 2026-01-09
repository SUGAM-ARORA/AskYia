from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime

from app.models.execution_log import ExecutionLog
from app.repositories.base import CRUDBase


class ExecutionLogRepository(CRUDBase[ExecutionLog]):
    def __init__(self):
        super().__init__(ExecutionLog)

    async def create_execution(
        self,
        db: AsyncSession,
        *,
        execution_id: str,
        workflow_id: int,
        user_id: Optional[int] = None,
        workflow_version: Optional[int] = None,
        input_data: Optional[Dict[str, Any]] = None
    ) -> ExecutionLog:
        log = ExecutionLog(
            execution_id=execution_id,
            workflow_id=workflow_id,
            user_id=user_id,
            workflow_version=workflow_version,
            status="running",
            input_data=input_data
        )
        db.add(log)
        await db.commit()
        await db.refresh(log)
        return log

    async def get_by_execution_id(
        self,
        db: AsyncSession,
        execution_id: str
    ) -> Optional[ExecutionLog]:
        result = await db.execute(
            select(ExecutionLog).where(ExecutionLog.execution_id == execution_id)
        )
        return result.scalar_one_or_none()

    async def complete_execution(
        self,
        db: AsyncSession,
        execution_id: str,
        *,
        status: str,
        output_data: Optional[Dict[str, Any]] = None,
        logs: Optional[List[Dict]] = None,
        node_results: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None,
        error_node_id: Optional[str] = None,
        duration_seconds: Optional[float] = None,
        tokens_used: Optional[int] = None
    ) -> Optional[ExecutionLog]:
        await db.execute(
            update(ExecutionLog)
            .where(ExecutionLog.execution_id == execution_id)
            .values(
                status=status,
                output_data=output_data,
                logs=logs,
                node_results=node_results,
                error_message=error_message,
                error_node_id=error_node_id,
                duration_seconds=duration_seconds,
                tokens_used=tokens_used,
                completed_at=datetime.utcnow()
            )
        )
        await db.commit()
        return await self.get_by_execution_id(db, execution_id)

    async def get_workflow_executions(
        self,
        db: AsyncSession,
        workflow_id: int,
        *,
        skip: int = 0,
        limit: int = 50,
        status: Optional[str] = None
    ) -> List[ExecutionLog]:
        query = select(ExecutionLog).where(ExecutionLog.workflow_id == workflow_id)
        
        if status:
            query = query.where(ExecutionLog.status == status)
        
        query = query.order_by(ExecutionLog.started_at.desc()).offset(skip).limit(limit)
        
        result = await db.execute(query)
        return list(result.scalars().all())

    async def get_user_executions(
        self,
        db: AsyncSession,
        user_id: int,
        *,
        skip: int = 0,
        limit: int = 50
    ) -> List[ExecutionLog]:
        result = await db.execute(
            select(ExecutionLog)
            .where(ExecutionLog.user_id == user_id)
            .order_by(ExecutionLog.started_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())


execution_log_repository = ExecutionLogRepository()