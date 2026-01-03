"""
Prometheus Metrics Configuration
Askyia - No-Code AI Workflow Builder
"""

from prometheus_client import Counter, Histogram, Gauge, Info, CollectorRegistry, generate_latest
from prometheus_client import CONTENT_TYPE_LATEST

# Create a custom registry
REGISTRY = CollectorRegistry()

# ============== HTTP Request Metrics ==============

HTTP_REQUEST_TOTAL = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code'],
    registry=REGISTRY
)

HTTP_REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint'],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registry=REGISTRY
)

HTTP_REQUESTS_IN_PROGRESS = Gauge(
    'http_requests_in_progress',
    'Number of HTTP requests in progress',
    ['method', 'endpoint'],
    registry=REGISTRY
)

# ============== Workflow Metrics ==============

WORKFLOW_EXECUTIONS_TOTAL = Counter(
    'workflow_executions_total',
    'Total workflow executions',
    ['workflow_id', 'status'],
    registry=REGISTRY
)

WORKFLOW_EXECUTION_DURATION = Histogram(
    'workflow_execution_duration_seconds',
    'Workflow execution duration in seconds',
    ['workflow_id'],
    buckets=[1, 5, 10, 30, 60, 120, 300, 600],
    registry=REGISTRY
)

WORKFLOW_NODE_EXECUTIONS = Counter(
    'workflow_node_executions_total',
    'Total workflow node executions',
    ['workflow_id', 'node_type', 'status'],
    registry=REGISTRY
)

WORKFLOW_NODE_DURATION = Histogram(
    'workflow_node_duration_seconds',
    'Workflow node execution duration',
    ['node_type'],
    buckets=[0.1, 0.5, 1, 2, 5, 10, 30, 60],
    registry=REGISTRY
)

ACTIVE_WORKFLOWS = Gauge(
    'active_workflows',
    'Number of currently executing workflows',
    registry=REGISTRY
)

# ============== LLM Metrics ==============

LLM_REQUESTS_TOTAL = Counter(
    'llm_requests_total',
    'Total LLM API requests',
    ['provider', 'model', 'status'],
    registry=REGISTRY
)

LLM_REQUEST_DURATION = Histogram(
    'llm_request_duration_seconds',
    'LLM API request duration',
    ['provider', 'model'],
    buckets=[0.5, 1, 2, 5, 10, 30, 60],
    registry=REGISTRY
)

LLM_TOKENS_USED = Counter(
    'llm_tokens_total',
    'Total tokens used',
    ['provider', 'model', 'type'],
    registry=REGISTRY
)

# ============== Vector Store Metrics ==============

VECTOR_STORE_OPERATIONS = Counter(
    'vector_store_operations_total',
    'Total vector store operations',
    ['operation', 'status'],
    registry=REGISTRY
)

VECTOR_STORE_QUERY_DURATION = Histogram(
    'vector_store_query_duration_seconds',
    'Vector store query duration',
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1, 2],
    registry=REGISTRY
)

# ============== External Service Metrics ==============

EXTERNAL_SERVICE_REQUESTS = Counter(
    'external_service_requests_total',
    'Total external service requests',
    ['service', 'status'],
    registry=REGISTRY
)

EXTERNAL_SERVICE_DURATION = Histogram(
    'external_service_duration_seconds',
    'External service request duration',
    ['service'],
    buckets=[0.1, 0.5, 1, 2, 5, 10],
    registry=REGISTRY
)

# ============== Database Metrics ==============

DB_CONNECTIONS_ACTIVE = Gauge(
    'db_connections_active',
    'Active database connections',
    registry=REGISTRY
)

DB_QUERY_DURATION = Histogram(
    'db_query_duration_seconds',
    'Database query duration',
    ['operation'],
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
    registry=REGISTRY
)

# ============== Application Info ==============

APP_INFO = Info(
    'app',
    'Application information',
    registry=REGISTRY
)

APP_INFO.info({
    'name': 'askyia',
    'version': '1.0.0',
    'environment': 'production'
})


# ============== Metrics Export Functions ==============

def get_metrics() -> bytes:
    """Get all metrics in Prometheus format."""
    return generate_latest(REGISTRY)


def get_metrics_content_type() -> str:
    """Get Prometheus metrics content type."""
    return CONTENT_TYPE_LATEST