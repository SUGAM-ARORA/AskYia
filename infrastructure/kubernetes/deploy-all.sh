#!/bin/bash

set -e

echo "🚀 Deploying Complete Askyia Stack on Kubernetes"
echo "=================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

# Parse arguments
DEPLOY_MONITORING=false
DEPLOY_LOGGING=false
BUILD_IMAGES=false
USE_MINIKUBE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --monitoring)
            DEPLOY_MONITORING=true
            shift
            ;;
        --logging)
            DEPLOY_LOGGING=true
            shift
            ;;
        --build)
            BUILD_IMAGES=true
            shift
            ;;
        --minikube)
            USE_MINIKUBE=true
            shift
            ;;
        --all)
            DEPLOY_MONITORING=true
            DEPLOY_LOGGING=true
            BUILD_IMAGES=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --monitoring    Deploy Prometheus and Grafana"
            echo "  --logging       Deploy ELK stack and Filebeat"
            echo "  --build         Build Docker images"
            echo "  --minikube      Use minikube docker daemon"
            echo "  --all           Deploy everything with image building"
            echo "  --help          Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}kubectl is not installed. Please install it first.${NC}"
    exit 1
fi

if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}Cannot connect to Kubernetes cluster.${NC}"
    exit 1
fi

echo -e "${GREEN}Prerequisites met!${NC}"

# Build images if requested
if [ "$BUILD_IMAGES" = true ]; then
    echo ""
    echo -e "${BLUE}📦 Building Docker Images${NC}"
    echo "----------------------------"
    
    if [ "$USE_MINIKUBE" = true ]; then
        echo "Using minikube docker daemon..."
        eval $(minikube docker-env)
    fi
    
    echo "Building backend image..."
    docker build -t askyia-backend:latest "$PROJECT_ROOT/backend"
    
    echo "Building frontend image..."
    docker build -t askyia-frontend:latest "$PROJECT_ROOT/frontend"
    
    echo -e "${GREEN}Images built successfully!${NC}"
fi

# Deploy base application
echo ""
echo -e "${BLUE}🏗️  Deploying Base Application${NC}"
echo "--------------------------------"
kubectl apply -k "$SCRIPT_DIR/base/"

echo -e "${YELLOW}Waiting for PostgreSQL...${NC}"
kubectl wait --for=condition=ready pod -l app=postgres -n askyia --timeout=120s

echo -e "${YELLOW}Waiting for ChromaDB...${NC}"
kubectl wait --for=condition=ready pod -l app=chromadb -n askyia --timeout=120s

echo -e "${YELLOW}Waiting for Backend...${NC}"
kubectl wait --for=condition=ready pod -l app=backend -n askyia --timeout=180s

echo -e "${YELLOW}Waiting for Frontend...${NC}"
kubectl wait --for=condition=ready pod -l app=frontend -n askyia --timeout=120s

echo -e "${GREEN}Base application deployed!${NC}"

# Deploy monitoring if requested
if [ "$DEPLOY_MONITORING" = true ]; then
    echo ""
    echo -e "${BLUE}📊 Deploying Monitoring Stack${NC}"
    echo "-------------------------------"
    kubectl apply -k "$SCRIPT_DIR/monitoring/"
    
    echo -e "${YELLOW}Waiting for Prometheus...${NC}"
    kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=180s || true
    
    echo -e "${YELLOW}Waiting for Grafana...${NC}"
    kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=180s || true
    
    echo -e "${GREEN}Monitoring stack deployed!${NC}"
fi

# Deploy logging if requested
if [ "$DEPLOY_LOGGING" = true ]; then
    echo ""
    echo -e "${BLUE}📋 Deploying Logging Stack${NC}"
    echo "----------------------------"
    kubectl apply -k "$SCRIPT_DIR/logging/"
    
    echo -e "${YELLOW}Waiting for Elasticsearch (this may take a while)...${NC}"
    kubectl wait --for=condition=ready pod -l app=elasticsearch -n logging --timeout=300s || true
    
    echo -e "${YELLOW}Waiting for Logstash...${NC}"
    kubectl wait --for=condition=ready pod -l app=logstash -n logging --timeout=180s || true
    
    echo -e "${YELLOW}Waiting for Kibana...${NC}"
    kubectl wait --for=condition=ready pod -l app=kibana -n logging --timeout=180s || true
    
    echo -e "${GREEN}Logging stack deployed!${NC}"
fi

# Show summary
echo ""
echo -e "${GREEN}=================================================="
echo "🎉 Deployment Complete!"
echo "==================================================${NC}"
echo ""

# Get access information
if command -v minikube &> /dev/null && minikube status 2>/dev/null | grep -q "Running"; then
    MINIKUBE_IP=$(minikube ip)
    echo "📍 Access URLs (Minikube NodePort):"
    echo "   Frontend:    http://${MINIKUBE_IP}:30080"
    echo "   Backend API: http://${MINIKUBE_IP}:30081"
    
    if [ "$DEPLOY_MONITORING" = true ]; then
        echo "   Prometheus:  http://${MINIKUBE_IP}:30090"
        echo "   Grafana:     http://${MINIKUBE_IP}:30030"
    fi
    
    if [ "$DEPLOY_LOGGING" = true ]; then
        echo "   Kibana:      http://${MINIKUBE_IP}:30561"
    fi
else
    echo "📍 Access via Port-Forward:"
    echo "   kubectl port-forward svc/frontend 8080:80 -n askyia"
    echo "   kubectl port-forward svc/backend 8000:8000 -n askyia"
    
    if [ "$DEPLOY_MONITORING" = true ]; then
        echo "   kubectl port-forward svc/prometheus 9090:9090 -n monitoring"
        echo "   kubectl port-forward svc/grafana 3000:3000 -n monitoring"
    fi
    
    if [ "$DEPLOY_LOGGING" = true ]; then
        echo "   kubectl port-forward svc/kibana 5601:5601 -n logging"
    fi
fi

echo ""
echo "📋 Check Status:"
echo "   kubectl get pods -n askyia"
if [ "$DEPLOY_MONITORING" = true ]; then
    echo "   kubectl get pods -n monitoring"
fi
if [ "$DEPLOY_LOGGING" = true ]; then
    echo "   kubectl get pods -n logging"
fi

if [ "$DEPLOY_MONITORING" = true ]; then
    echo ""
    echo "🔐 Grafana Credentials:"
    echo "   Username: admin"
    echo "   Password: askyia-admin-2024"
fi

echo ""