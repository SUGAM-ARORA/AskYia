#!/bin/bash

set -e

echo "🔍 Deploying Askyia Monitoring Stack (Prometheus + Grafana)"
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

# Deploy monitoring stack
echo -e "${YELLOW}Deploying monitoring stack...${NC}"
kubectl apply -k "$SCRIPT_DIR/monitoring/"

# Wait for pods to be ready
echo -e "${YELLOW}Waiting for Prometheus to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=180s || true

echo -e "${YELLOW}Waiting for Grafana to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=180s || true

# Show status
echo ""
echo -e "${GREEN}============================================================"
echo "🎉 Monitoring Stack Deployed Successfully!"
echo "============================================================${NC}"
echo ""

# Get access information
if command -v minikube &> /dev/null && minikube status | grep -q "Running"; then
    MINIKUBE_IP=$(minikube ip)
    echo "Access URLs (Minikube):"
    echo "  Prometheus: http://${MINIKUBE_IP}:30090"
    echo "  Grafana:    http://${MINIKUBE_IP}:30030"
else
    echo "Access URLs (Port-Forward):"
    echo "  kubectl port-forward svc/prometheus 9090:9090 -n monitoring"
    echo "  kubectl port-forward svc/grafana 3000:3000 -n monitoring"
fi

echo ""
echo "Grafana Credentials:"
echo "  Username: admin"
echo "  Password: askyia-admin-2024"
echo ""
echo "Check status:"
echo "  kubectl get pods -n monitoring"
echo ""