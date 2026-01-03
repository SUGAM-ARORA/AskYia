"""
Logging Middleware for Request/Response Logging
Askyia - No-Code AI Workflow Builder
"""

import time
import uuid
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from contextvars import ContextVar
import structlog

from app.core.logging_config import get_logger, generate_correlation_id
from app.core.metrics import (
    HTTP_REQUEST_TOTAL,
    HTTP_REQUEST_DURATION,
    HTTP_REQUESTS_IN_PROGRESS
)

# Context variable for correlation ID
correlation_id_ctx: ContextVar[str] = ContextVar('correlation_id', default='')

logger = get_logger(__name__)
struct_logger = structlog.get_logger()


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for request/response logging and correlation ID tracking."""
    
    def __init__(self, app: ASGIApp, exclude_paths: list = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or ['/health', '/metrics', '/docs', '/openapi.json']
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip logging for excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)
        
        # Generate or get correlation ID
        correlation_id = request.headers.get('X-Correlation-ID', generate_correlation_id())
        correlation_id_ctx.set(correlation_id)
        
        # Get request details
        method = request.method
        path = request.url.path
        query_params = str(request.query_params) if request.query_params else ""
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get('User-Agent', 'unknown')
        
        # Track in-progress requests
        HTTP_REQUESTS_IN_PROGRESS.labels(method=method, endpoint=path).inc()
        
        # Log request start
        struct_logger.info(
            "request_started",
            correlation_id=correlation_id,
            method=method,
            path=path,
            query_params=query_params,
            client_ip=client_ip,
            user_agent=user_agent[:100] if user_agent else ""
        )
        
        # Process request
        start_time = time.time()
        status_code = 500
        
        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
            
        except Exception as e:
            struct_logger.exception(
                "request_exception",
                correlation_id=correlation_id,
                method=method,
                path=path,
                error=str(e)
            )
            raise
            
        finally:
            # Calculate duration
            duration = time.time() - start_time
            
            # Record metrics
            HTTP_REQUEST_TOTAL.labels(
                method=method,
                endpoint=path,
                status_code=status_code
            ).inc()
            
            HTTP_REQUEST_DURATION.labels(
                method=method,
                endpoint=path
            ).observe(duration)
            
            HTTP_REQUESTS_IN_PROGRESS.labels(method=method, endpoint=path).dec()
            
            # Log request completion
            log_level = 'info' if status_code < 400 else 'warning' if status_code < 500 else 'error'
            
            getattr(struct_logger, log_level)(
                "request_completed",
                correlation_id=correlation_id,
                method=method,
                path=path,
                status_code=status_code,
                duration_ms=round(duration * 1000, 2)
            )
        
        # Add correlation ID to response headers
        response.headers['X-Correlation-ID'] = correlation_id
        
        return response


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Middleware to extract and set request context."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Extract user info from token if available
        user_id = None
        if hasattr(request.state, 'user'):
            user_id = getattr(request.state.user, 'id', None)
        
        # You can add more context binding here
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            user_id=user_id,
            request_path=request.url.path
        )
        
        response = await call_next(request)
        
        return response