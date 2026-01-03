"""
Execution Log Service for Real-time Workflow Logging
Askyia - No-Code AI Workflow Builder
"""

import asyncio
import json
from datetime import datetime
from typing import Optional, Dict, Any, List, AsyncGenerator
from enum import Enum
from dataclasses import dataclass, field, asdict
from collections import defaultdict
import uuid
import structlog

from app.core.metrics import ACTIVE_WORKFLOWS

logger = structlog.get_logger()


class LogLevel(str, Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class ExecutionStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class ExecutionLogEntry:
    """Single log entry for workflow execution."""
    id: str
    timestamp: str
    level: LogLevel
    message: str
    workflow_id: str
    execution_id: str
    node_id: Optional[str] = None
    node_type: Optional[str] = None
    step: Optional[int] = None
    total_steps: Optional[int] = None
    progress: Optional[float] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['level'] = self.level.value if isinstance(self.level, LogLevel) else self.level
        return data
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict())


@dataclass
class WorkflowExecutionContext:
    """Context for a workflow execution."""
    workflow_id: str
    execution_id: str
    user_id: Optional[str]
    status: ExecutionStatus
    started_at: datetime
    ended_at: Optional[datetime] = None
    total_nodes: int = 0
    completed_nodes: int = 0
    current_node: Optional[str] = None
    logs: List[ExecutionLogEntry] = field(default_factory=list)
    error: Optional[str] = None


class ExecutionLogService:
    """Service for managing workflow execution logs and real-time streaming."""
    
    def __init__(self):
        self._executions: Dict[str, WorkflowExecutionContext] = {}
        self._subscribers: Dict[str, List[asyncio.Queue]] = defaultdict(list)
        self._lock = asyncio.Lock()
    
    async def start_execution(
        self,
        workflow_id: str,
        user_id: Optional[str] = None,
        total_nodes: int = 0
    ) -> str:
        """Start a new workflow execution and return execution ID."""
        execution_id = str(uuid.uuid4())
        
        context = WorkflowExecutionContext(
            workflow_id=workflow_id,
            execution_id=execution_id,
            user_id=user_id,
            status=ExecutionStatus.RUNNING,
            started_at=datetime.utcnow(),
            total_nodes=total_nodes
        )
        
        async with self._lock:
            self._executions[execution_id] = context
        
        # Update metrics
        ACTIVE_WORKFLOWS.inc()
        
        # Log start
        await self.log(
            execution_id=execution_id,
            level=LogLevel.INFO,
            message=f"Workflow execution started",
            metadata={
                'total_nodes': total_nodes,
                'user_id': user_id
            }
        )
        
        logger.info(
            "workflow_execution_started",
            workflow_id=workflow_id,
            execution_id=execution_id,
            total_nodes=total_nodes
        )
        
        return execution_id
    
    async def log(
        self,
        execution_id: str,
        level: LogLevel,
        message: str,
        node_id: Optional[str] = None,
        node_type: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> ExecutionLogEntry:
        """Add a log entry to the execution."""
        context = self._executions.get(execution_id)
        if not context:
            raise ValueError(f"Execution {execution_id} not found")
        
        # Calculate progress
        progress = None
        if context.total_nodes > 0:
            progress = (context.completed_nodes / context.total_nodes) * 100
        
        entry = ExecutionLogEntry(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow().isoformat() + 'Z',
            level=level,
            message=message,
            workflow_id=context.workflow_id,
            execution_id=execution_id,
            node_id=node_id,
            node_type=node_type,
            step=context.completed_nodes,
            total_steps=context.total_nodes,
            progress=progress,
            metadata=metadata or {}
        )
        
        async with self._lock:
            context.logs.append(entry)
            if node_id:
                context.current_node = node_id
        
        # Notify subscribers
        await self._notify_subscribers(execution_id, entry)
        
        return entry
    
    async def log_node_start(
        self,
        execution_id: str,
        node_id: str,
        node_type: str,
        node_name: Optional[str] = None
    ):
        """Log the start of a node execution."""
        await self.log(
            execution_id=execution_id,
            level=LogLevel.INFO,
            message=f"Starting node: {node_name or node_id}",
            node_id=node_id,
            node_type=node_type,
            metadata={'event': 'node_started', 'node_name': node_name}
        )
    
    async def log_node_complete(
        self,
        execution_id: str,
        node_id: str,
        node_type: str,
        duration_ms: float,
        output_summary: Optional[str] = None
    ):
        """Log the completion of a node execution."""
        context = self._executions.get(execution_id)
        if context:
            async with self._lock:
                context.completed_nodes += 1
        
        await self.log(
            execution_id=execution_id,
            level=LogLevel.INFO,
            message=f"Node completed successfully",
            node_id=node_id,
            node_type=node_type,
            metadata={
                'event': 'node_completed',
                'duration_ms': round(duration_ms, 2),
                'output_summary': output_summary
            }
        )
    
    async def log_node_error(
        self,
        execution_id: str,
        node_id: str,
        node_type: str,
        error: str
    ):
        """Log a node execution error."""
        await self.log(
            execution_id=execution_id,
            level=LogLevel.ERROR,
            message=f"Node execution failed: {error}",
            node_id=node_id,
            node_type=node_type,
            metadata={'event': 'node_error', 'error': error}
        )
    
    async def complete_execution(
        self,
        execution_id: str,
        status: ExecutionStatus = ExecutionStatus.COMPLETED,
        error: Optional[str] = None
    ):
        """Mark execution as completed."""
        context = self._executions.get(execution_id)
        if not context:
            return
        
        async with self._lock:
            context.status = status
            context.ended_at = datetime.utcnow()
            context.error = error
        
        # Calculate duration
        duration = (context.ended_at - context.started_at).total_seconds()
        
        # Update metrics
        ACTIVE_WORKFLOWS.dec()
        
        # Log completion
        level = LogLevel.INFO if status == ExecutionStatus.COMPLETED else LogLevel.ERROR
        message = f"Workflow execution {status.value}"
        if error:
            message += f": {error}"
        
        await self.log(
            execution_id=execution_id,
            level=level,
            message=message,
            metadata={
                'event': 'execution_completed',
                'status': status.value,
                'duration_seconds': round(duration, 3),
                'completed_nodes': context.completed_nodes,
                'total_nodes': context.total_nodes
            }
        )
        
        # Close all subscriber queues
        await self._close_subscribers(execution_id)
    
    async def subscribe(self, execution_id: str) -> AsyncGenerator[ExecutionLogEntry, None]:
        """Subscribe to real-time log updates for an execution."""
        queue: asyncio.Queue = asyncio.Queue()
        
        async with self._lock:
            self._subscribers[execution_id].append(queue)
            
            # Send existing logs first
            context = self._executions.get(execution_id)
            if context:
                for log_entry in context.logs:
                    await queue.put(log_entry)
        
        try:
            while True:
                try:
                    entry = await asyncio.wait_for(queue.get(), timeout=30.0)
                    if entry is None:  # Sentinel value for end of stream
                        break
                    yield entry
                except asyncio.TimeoutError:
                    # Send heartbeat
                    yield ExecutionLogEntry(
                        id=str(uuid.uuid4()),
                        timestamp=datetime.utcnow().isoformat() + 'Z',
                        level=LogLevel.DEBUG,
                        message="heartbeat",
                        workflow_id="",
                        execution_id=execution_id,
                        metadata={'type': 'heartbeat'}
                    )
        finally:
            async with self._lock:
                if queue in self._subscribers[execution_id]:
                    self._subscribers[execution_id].remove(queue)
    
    async def _notify_subscribers(self, execution_id: str, entry: ExecutionLogEntry):
        """Notify all subscribers of a new log entry."""
        subscribers = self._subscribers.get(execution_id, [])
        for queue in subscribers:
            try:
                await queue.put(entry)
            except Exception as e:
                logger.warning(f"Failed to notify subscriber: {e}")
    
    async def _close_subscribers(self, execution_id: str):
        """Close all subscriber queues for an execution."""
        subscribers = self._subscribers.get(execution_id, [])
        for queue in subscribers:
            try:
                await queue.put(None)  # Sentinel value
            except Exception:
                pass
        self._subscribers.pop(execution_id, None)
    
    def get_execution_context(self, execution_id: str) -> Optional[WorkflowExecutionContext]:
        """Get execution context."""
        return self._executions.get(execution_id)
    
    def get_execution_logs(self, execution_id: str) -> List[ExecutionLogEntry]:
        """Get all logs for an execution."""
        context = self._executions.get(execution_id)
        return context.logs if context else []


# Global singleton instance
execution_log_service = ExecutionLogService()