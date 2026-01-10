#!/bin/bash

echo "🧹 Cleaning up Askyia Kubernetes Deployment"
echo "============================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Parse arguments
DELETE_PVC=false
DELETE_ALL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --pvc)
            DELETE_PVC=true
            shift
            ;;
        --all)
            DELETE_ALL=true
            DELETE_PVC=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --pvc     Also delete PersistentVolumeClaims (data will be lost)"
            echo "  --all     Delete everything including namespaces"
            echo "  --help    Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${YELLOW}Deleting deployments...${NC}"

# Delete base application
echo "Deleting base application..."
kubectl delete -k "$SCRIPT_DIR/base/" --ignore-not-found=true

# Delete monitoring
echo "Deleting monitoring stack..."
kubectl delete -k "$SCRIPT_DIR/monitoring/" --ignore-not-found=true

# Delete logging
echo "Deleting logging stack..."
kubectl delete -k "$SCRIPT_DIR/logging/" --ignore-not-found=true

# Delete PVCs if requested
if [ "$DELETE_PVC" = true ]; then
    echo -e "${YELLOW}Deleting PersistentVolumeClaims...${NC}"
    kubectl delete pvc --all -n askyia --ignore-not-found=true
    kubectl delete pvc --all -n monitoring --ignore-not-found=true
    kubectl delete pvc --all -n logging --ignore-not-found=true
fi

# Delete namespaces if --all
if [ "$DELETE_ALL" = true ]; then
    echo -e "${YELLOW}Deleting namespaces...${NC}"
    kubectl delete namespace askyia --ignore-not-found=true
    kubectl delete namespace monitoring --ignore-not-found=true
    kubectl delete namespace logging --ignore-not-found=true
    
    # Delete cluster-wide resources
    echo "Deleting cluster-wide resources..."
    kubectl delete clusterrole prometheus filebeat --ignore-not-found=true
    kubectl delete clusterrolebinding prometheus filebeat --ignore-not-found=true
fi

echo ""
echo -e "${GREEN}✅ Cleanup complete!${NC}"