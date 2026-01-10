#!/bin/bash

set -e

echo "📋 Deploying Askyia Logging Stack (ELK + Filebeat)"
echo "============================================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}kubectl is not installed. Please install it first.${NC}"
    exit 1
fi

# Check cluster connection
echo -e "${YELLOW}Checking cluster connection...${NC}"
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}Cannot connect to Kubernetes cluster. Please check your kubeconfig.${NC}"
    exit 1
fi

# Deploy logging stack
echo -e "${YELLOW}Deploying logging stack...${NC}"
kubectl apply -k "$SCRIPT_DIR/logging/"

# Wait for pods to be ready
echo -e "${YELLOW}Waiting for Elasticsearch to be ready (this may take a few minutes)...${NC}"
kubectl wait --for=condition=ready pod -l app=elasticsearch -n logging --timeout=300s || true

echo -e "${YELLOW}Waiting for Logstash to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=logstash -n logging --timeout=180s || true

echo -e "${YELLOW}Waiting for Kibana to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=kibana -n logging --timeout=180s || true

echo -e "${YELLOW}Waiting for Filebeat to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=filebeat -n logging --timeout=120s || true

# Show status
echo ""
echo -e "${GREEN}============================================================"
echo "🎉 Logging Stack Deployed Successfully!"
echo "============================================================${NC}"
echo ""

# Get access information
if command -v minikube &> /dev/null && minikube status | grep -q "Running"; then
    MINIKUBE_IP=$(minikube ip)
    echo "Access URLs (Minikube):"
    echo "  Kibana: http://${MINIKUBE_IP}:30561"
else
    echo "Access URLs (Port-Forward):"
    echo "  kubectl port-forward svc/elasticsearch 9200:9200 -n logging"
    echo "  kubectl port-forward svc/kibana 5601:5601 -n logging"
fi

echo ""
echo "Kibana Index Patterns to create:"
echo "  - askyia-logs-*"
echo "  - askyia-workflows-*"
echo "  - askyia-errors-*"
echo "  - askyia-http-*"
echo ""
echo "Check status:"
echo "  kubectl get pods -n logging"
echo ""