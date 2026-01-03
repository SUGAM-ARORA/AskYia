"""
Main FastAPI Application Entry Point
Askyia - No-Code AI Workflow Builder
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import structlog

from app.core.config import get_settings
from app.core.logging_config import LoggingConfig, get_logger
from app.middleware.logging_middleware import LoggingMiddleware, RequestContextMiddleware
from app.api.v1.router import api_router

# Get settings
settings = get_settings()

# Initialize structured logging
logging_config = LoggingConfig(
    log_level=settings.log_level,
    log_format=settings.log_format,
    log_dir=settings.log_dir,
    app_name=settings.project_name.lower().replace(" ", "-"),
    enable_file_logging=settings.enable_file_logging,
    enable_console_logging=settings.enable_console_logging,
    max_file_size=settings.log_max_file_size,
    backup_count=settings.log_backup_count
)
logging_config.setup()

# Get logger
logger = get_logger(__name__)
struct_logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown events."""
    
    # Startup
    logger.info(
        "Application starting up",
        extra={
            'event': 'startup',
            'app_name': settings.project_name,
            'log_level': settings.log_level,
            'metrics_enabled': settings.enable_metrics
        }
    )
    struct_logger.info(
        "application_startup",
        app_name=settings.project_name,
        log_level=settings.log_level,
        metrics_enabled=settings.enable_metrics
    )
    
    yield
    
    # Shutdown
    logger.info("Application shutting down", extra={'event': 'shutdown'})
    struct_logger.info("application_shutdown")


# Create FastAPI application
app = FastAPI(
    title=settings.project_name,
    description="No-Code AI Workflow Builder - Build intelligent workflows with drag-and-drop simplicity",
    version="1.0.0",
    openapi_url=f"{settings.api_v1_str}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# ============== Middleware Configuration ==============
# Order matters: first added is last executed (outermost)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Correlation-ID"]
)

# Request Context Middleware (extracts user info, etc.)
app.add_middleware(RequestContextMiddleware)

# Logging Middleware (logs requests/responses, adds correlation ID)
app.add_middleware(
    LoggingMiddleware,
    exclude_paths=[
        '/health',
        '/metrics',
        '/docs',
        '/redoc',
        '/openapi.json',
        f'{settings.api_v1_str}/openapi.json'
    ]
)


# ============== Include API Routers ==============
app.include_router(api_router, prefix=settings.api_v1_str)


# ============== Health & Metrics Endpoints ==============
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint returning API information."""
    return {
        "message": f"Welcome to {settings.project_name} API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for Kubernetes probes and load balancers."""
    return {
        "status": "healthy",
        "service": settings.project_name,
        "version": "1.0.0"
    }


@app.get("/ready", tags=["Health"])
async def readiness_check():
    """
    Readiness check endpoint.
    Verifies the application is ready to receive traffic.
    """
    # Add any dependency checks here (database, redis, etc.)
    checks = {
        "api": True,
        # Add more checks as needed:
        # "database": await check_database(),
        # "redis": await check_redis(),
        # "chromadb": await check_chromadb(),
    }
    
    all_ready = all(checks.values())
    
    return {
        "ready": all_ready,
        "checks": checks
    }


# ============== Metrics Endpoint ==============
if settings.enable_metrics:
    from fastapi.responses import Response
    from app.core.metrics import get_metrics, get_metrics_content_type
    
    @app.get("/metrics", tags=["Monitoring"])
    async def metrics():
        """Prometheus metrics endpoint."""
        return Response(
            content=get_metrics(),
            media_type=get_metrics_content_type()
        )


# ============== Exception Handlers ==============
from fastapi import Request
from fastapi.responses import JSONResponse


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled exceptions."""
    
    # Log the exception
    logger.exception(
        f"Unhandled exception: {str(exc)}",
        extra={
            'event': 'unhandled_exception',
            'path': request.url.path,
            'method': request.method,
            'error': str(exc),
            'error_type': type(exc).__name__
        }
    )
    
    struct_logger.error(
        "unhandled_exception",
        path=request.url.path,
        method=request.method,
        error=str(exc),
        error_type=type(exc).__name__
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error_type": type(exc).__name__
        }
    )