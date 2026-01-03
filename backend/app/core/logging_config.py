"""
Centralized Logging Configuration
Askyia - No-Code AI Workflow Builder
"""

import logging
import sys
import json
from datetime import datetime
from typing import Any, Dict, Optional
from pathlib import Path
from logging.handlers import RotatingFileHandler
import uuid
import structlog
from pythonjsonlogger import jsonlogger


class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter for structured logging."""
    
    def add_fields(
        self,
        log_record: Dict[str, Any],
        record: logging.LogRecord,
        message_dict: Dict[str, Any]
    ) -> None:
        super().add_fields(log_record, record, message_dict)
        
        # Add timestamp in ISO format
        log_record['timestamp'] = datetime.utcnow().isoformat() + 'Z'
        log_record['level'] = record.levelname.upper()
        log_record['logger'] = record.name
        log_record['service'] = 'askyia-api'
        
        # Add source location
        log_record['source'] = {
            'file': record.pathname,
            'line': record.lineno,
            'function': record.funcName
        }
        
        # Add correlation ID if available
        if hasattr(record, 'correlation_id'):
            log_record['correlation_id'] = record.correlation_id
        
        # Add user ID if available
        if hasattr(record, 'user_id'):
            log_record['user_id'] = record.user_id
        
        # Add workflow ID if available
        if hasattr(record, 'workflow_id'):
            log_record['workflow_id'] = record.workflow_id


class LoggingConfig:
    """Centralized logging configuration."""
    
    def __init__(
        self,
        log_level: str = "INFO",
        log_format: str = "json",
        log_dir: str = "logs",
        app_name: str = "askyia",
        enable_file_logging: bool = True,
        enable_console_logging: bool = True,
        max_file_size: int = 10 * 1024 * 1024,  # 10MB
        backup_count: int = 5
    ):
        self.log_level = getattr(logging, log_level.upper(), logging.INFO)
        self.log_format = log_format
        self.log_dir = Path(log_dir)
        self.app_name = app_name
        self.enable_file_logging = enable_file_logging
        self.enable_console_logging = enable_console_logging
        self.max_file_size = max_file_size
        self.backup_count = backup_count
        
        # Create log directory
        if self.enable_file_logging:
            self.log_dir.mkdir(parents=True, exist_ok=True)
    
    def setup(self) -> logging.Logger:
        """Setup and return the root logger."""
        
        # Get root logger
        root_logger = logging.getLogger()
        root_logger.setLevel(self.log_level)
        
        # Clear existing handlers
        root_logger.handlers.clear()
        
        # Create formatters
        if self.log_format == "json":
            formatter = CustomJsonFormatter(
                '%(timestamp)s %(level)s %(name)s %(message)s'
            )
        else:
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
        
        # Console handler
        if self.enable_console_logging:
            console_handler = logging.StreamHandler(sys.stdout)
            console_handler.setLevel(self.log_level)
            console_handler.setFormatter(formatter)
            root_logger.addHandler(console_handler)
        
        # File handlers
        if self.enable_file_logging:
            # Main application log
            app_log_file = self.log_dir / f"{self.app_name}.log"
            app_handler = RotatingFileHandler(
                app_log_file,
                maxBytes=self.max_file_size,
                backupCount=self.backup_count
            )
            app_handler.setLevel(self.log_level)
            app_handler.setFormatter(formatter)
            root_logger.addHandler(app_handler)
            
            # Error log (errors only)
            error_log_file = self.log_dir / f"{self.app_name}-error.log"
            error_handler = RotatingFileHandler(
                error_log_file,
                maxBytes=self.max_file_size,
                backupCount=self.backup_count
            )
            error_handler.setLevel(logging.ERROR)
            error_handler.setFormatter(formatter)
            root_logger.addHandler(error_handler)
            
            # Workflow execution log
            workflow_log_file = self.log_dir / f"{self.app_name}-workflow.log"
            workflow_handler = RotatingFileHandler(
                workflow_log_file,
                maxBytes=self.max_file_size,
                backupCount=self.backup_count
            )
            workflow_handler.setLevel(logging.DEBUG)
            workflow_handler.setFormatter(formatter)
            workflow_logger = logging.getLogger('workflow')
            workflow_logger.addHandler(workflow_handler)
        
        # Configure structlog
        structlog.configure(
            processors=[
                structlog.contextvars.merge_contextvars,
                structlog.processors.add_log_level,
                structlog.processors.StackInfoRenderer(),
                structlog.dev.set_exc_info,
                structlog.processors.TimeStamper(fmt="iso"),
                structlog.processors.JSONRenderer()
            ],
            wrapper_class=structlog.make_filtering_bound_logger(self.log_level),
            context_class=dict,
            logger_factory=structlog.PrintLoggerFactory(),
            cache_logger_on_first_use=True,
        )
        
        return root_logger


class ContextLogger:
    """Logger that maintains context across log calls."""
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self._context: Dict[str, Any] = {}
    
    def bind(self, **kwargs) -> 'ContextLogger':
        """Add context to all subsequent log calls."""
        self._context.update(kwargs)
        return self
    
    def unbind(self, *keys) -> 'ContextLogger':
        """Remove context keys."""
        for key in keys:
            self._context.pop(key, None)
        return self
    
    def clear_context(self) -> 'ContextLogger':
        """Clear all context."""
        self._context.clear()
        return self
    
    def _log(self, level: int, msg: str, *args, **kwargs):
        """Internal log method."""
        extra = kwargs.pop('extra', {})
        extra.update(self._context)
        kwargs['extra'] = extra
        self.logger.log(level, msg, *args, **kwargs)
    
    def debug(self, msg: str, *args, **kwargs):
        self._log(logging.DEBUG, msg, *args, **kwargs)
    
    def info(self, msg: str, *args, **kwargs):
        self._log(logging.INFO, msg, *args, **kwargs)
    
    def warning(self, msg: str, *args, **kwargs):
        self._log(logging.WARNING, msg, *args, **kwargs)
    
    def error(self, msg: str, *args, **kwargs):
        self._log(logging.ERROR, msg, *args, **kwargs)
    
    def critical(self, msg: str, *args, **kwargs):
        self._log(logging.CRITICAL, msg, *args, **kwargs)
    
    def exception(self, msg: str, *args, **kwargs):
        kwargs['exc_info'] = True
        self._log(logging.ERROR, msg, *args, **kwargs)


def get_logger(name: str) -> ContextLogger:
    """Get a context-aware logger."""
    return ContextLogger(name)


def generate_correlation_id() -> str:
    """Generate a unique correlation ID."""
    return str(uuid.uuid4())