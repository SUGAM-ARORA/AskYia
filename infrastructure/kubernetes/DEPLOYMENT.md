# Kubernetes Deployment Guide for Askyia

This guide covers deploying Askyia on Kubernetes using either raw manifests or Helm charts.

## Prerequisites

- Docker installed and running
- kubectl installed and configured
- Helm v3+ installed (for Helm deployment)
- A Kubernetes cluster (minikube, Docker Desktop, or cloud provider)

## Option 1: Local Development with Minikube

### Step 1: Start Minikube

```bash
# Start minikube with sufficient resources
minikube start --cpus=4 --memory=8192 --driver=docker

# Enable ingress addon
minikube addons enable ingress

# Enable metrics-server (optional, for monitoring)
minikube addons enable metrics-server

### Step 2 : Build Docker Images

# Point docker to minikube's docker daemon
eval $(minikube docker-env)

# Build backend image
cd backend
docker build -t askyia-backend:latest .
cd ..

# Build frontend image
cd frontend
docker build -t askyia-frontend:latest .
cd ..

# Verify images
docker images | grep askyia


### Step 3: Deploy Using Kustomize (Raw Manifests)

# Apply the base manifests
kubectl apply -k infrastructure/kubernetes/base/

# Watch the deployment
kubectl get pods -n askyia -w

# Check all resources
kubectl get all -n askyia


## Step 4: Deploy Using Helm (Recommended)

# Install the chart
helm install askyia infrastructure/helm/workflow-builder \
  --namespace askyia \
  --create-namespace

# Or with custom values
helm install askyia infrastructure/helm/workflow-builder \
  --namespace askyia \
  --create-namespace \
  --set secrets.openaiApiKey="your-api-key" \
  --set secrets.geminiApiKey="your-api-key"

# Check the deployment
helm status askyia -n askyia
kubectl get pods -n askyia


### Step 5: Access the Application

# Option A: Using NodePort
# Get minikube IP
minikube ip

# Access frontend at: http://<minikube-ip>:30080
# Access backend at: http://<minikube-ip>:30081

# Option B: Using Ingress
# Add to /etc/hosts (Linux/Mac) or C:\Windows\System32\drivers\etc\hosts (Windows)
echo "$(minikube ip) askyia.local" | sudo tee -a /etc/hosts

# Access at: http://askyia.local

# Option C: Using port-forward
kubectl port-forward svc/frontend 8080:80 -n askyia &
kubectl port-forward svc/backend 8000:8000 -n askyia &

# Access frontend at: http://localhost:8080
# Access backend at: http://localhost:8000


### Step 6: View Logs

# Backend logs
kubectl logs -f deployment/backend -n askyia

# Frontend logs
kubectl logs -f deployment/frontend -n askyia

# All pods
kubectl logs -f -l app.kubernetes.io/part-of=askyia -n askyia


### Step 7: Clean Up

# Using Helm
helm uninstall askyia -n askyia

# Using Kustomize
kubectl delete -k infrastructure/kubernetes/base/

# Delete namespace
kubectl delete namespace askyia

# Stop minikube
minikube stop


## Option 2: Cloud Deployment (AWS EKS)

Step 1: Create EKS Cluster
bash
# Using eksctl
eksctl create cluster \
  --name askyia-cluster \
  --version 1.28 \
  --region us-west-2 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 1 \
  --nodes-max 4 \
  --managed

# Configure kubectl
aws eks update-kubeconfig --region us-west-2 --name askyia-cluster
Step 2: Install NGINX Ingress Controller
bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/aws/deploy.yaml

# Wait for the load balancer
kubectl get svc -n ingress-nginx
Step 3: Build and Push Images to ECR
bash
# Create ECR repositories
aws ecr create-repository --repository-name askyia-backend
aws ecr create-repository --repository-name askyia-frontend

# Login to ECR
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-west-2.amazonaws.com

# Build and push backend
docker build -t askyia-backend:latest ./backend
docker tag askyia-backend:latest <account-id>.dkr.ecr.us-west-2.amazonaws.com/askyia-backend:latest
docker push <account-id>.dkr.ecr.us-west-2.amazonaws.com/askyia-backend:latest

# Build and push frontend
docker build -t askyia-frontend:latest ./frontend
docker tag askyia-frontend:latest <account-id>.dkr.ecr.us-west-2.amazonaws.com/askyia-frontend:latest
docker push <account-id>.dkr.ecr.us-west-2.amazonaws.com/askyia-frontend:latest
Step 4: Deploy with Helm
bash
# Create values file for production
cat > values-prod.yaml << EOF
global:
  namespace: askyia

frontend:
  image:
    repository: <account-id>.dkr.ecr.us-west-2.amazonaws.com/askyia-frontend
    tag: latest

backend:
  image:
    repository: <account-id>.dkr.ecr.us-west-2.amazonaws.com/askyia-backend
    tag: latest

postgres:
  persistence:
    storageClass: gp2

chromadb:
  persistence:
    storageClass: gp2

secrets:
  jwtSecret: "your-production-secret-key"
  openaiApiKey: "your-openai-api-key"
  geminiApiKey: "your-gemini-api-key"

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: askyia.yourdomain.com
      paths:
        - path: /api
          pathType: Prefix
          service: backend
          port: 8000
        - path: /
          pathType: Prefix
          service: frontend
          port: 80

nodePort:
  enabled: false
EOF

# Install
helm install askyia infrastructure/helm/workflow-builder \
  --namespace askyia \
  --create-namespace \
  -f values-prod.yaml
Step 5: Configure DNS
bash
# Get the Load Balancer hostname
kubectl get ingress -n askyia

# Create a CNAME record in your DNS provider pointing to the LB hostname
Option 3: Google GKE Deployment
Step 1: Create GKE Cluster
bash
# Create cluster
gcloud container clusters create askyia-cluster \
  --zone us-central1-a \
  --num-nodes 3 \
  --machine-type e2-medium

# Get credentials
gcloud container clusters get-credentials askyia-cluster --zone us-central1-a
Step 2: Build and Push Images to GCR
bash
# Configure docker for GCR
gcloud auth configure-docker

# Build and push
docker build -t gcr.io/<project-id>/askyia-backend:latest ./backend
docker push gcr.io/<project-id>/askyia-backend:latest

docker build -t gcr.io/<project-id>/askyia-frontend:latest ./frontend
docker push gcr.io/<project-id>/askyia-frontend:latest
Step 3: Deploy
bash
# Similar to EKS, create a values-gke.yaml and deploy with Helm
helm install askyia infrastructure/helm/workflow-builder \
  --namespace askyia \
  --create-namespace \
  -f values-gke.yaml
Deploying Monitoring Stack (Optional)
bash
# Apply monitoring manifests
kubectl apply -k infrastructure/kubernetes/monitoring/

# Access Grafana
kubectl port-forward svc/grafana 3000:3000 -n monitoring

# Default credentials: admin / askyia-admin-2024
Deploying Logging Stack (Optional)
bash
# Apply logging manifests
kubectl apply -k infrastructure/kubernetes/logging/

# Access Kibana
kubectl port-forward svc/kibana 5601:5601 -n logging
Troubleshooting
Pods not starting
bash
# Check pod status
kubectl describe pod <pod-name> -n askyia

# Check events
kubectl get events -n askyia --sort-by='.lastTimestamp'
Database connection issues
bash
# Check postgres is running
kubectl get pods -l app=postgres -n askyia

# Check postgres logs
kubectl logs -l app=postgres -n askyia

# Test connection from backend pod
kubectl exec -it deployment/backend -n askyia -- nc -zv postgres 5432
Ingress not working
bash
# Check ingress controller
kubectl get pods -n ingress-nginx

# Check ingress resource
kubectl describe ingress -n askyia

# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx
Image pull errors
bash
# For minikube, ensure you're using minikube's docker daemon
eval $(minikube docker-env)

# For cloud, check image repository permissions
kubectl describe pod <pod-name> -n askyia | grep -A5 "Events"
text

---

## PART 4: Quick Start Script

### 22. `infrastructure/kubernetes/deploy-minikube.sh` (NEW FILE)
```bash
#!/bin/bash

set -e

echo "🚀 Askyia Kubernetes Deployment Script for Minikube"
echo "=================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    if ! command -v minikube &> /dev/null; then
        echo -e "${RED}minikube is not installed. Please install it first.${NC}"
        exit 1
    fi
    
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}kubectl is not installed. Please install it first.${NC}"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}docker is not installed. Please install it first.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}All prerequisites met!${NC}"
}

# Start minikube
start_minikube() {
    echo -e "${YELLOW}Starting minikube...${NC}"
    
    if minikube status | grep -q "Running"; then
        echo "Minikube is already running"
    else
        minikube start --cpus=4 --memory=8192 --driver=docker
    fi
    
    echo -e "${YELLOW}Enabling ingress addon...${NC}"
    minikube addons enable ingress
    
    echo -e "${GREEN}Minikube is ready!${NC}"
}

# Build images
build_images() {
    echo -e "${YELLOW}Building Docker images...${NC}"
    
    # Point to minikube's docker daemon
    eval $(minikube docker-env)
    
    # Get the project root directory
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"
    
    echo "Building backend image..."
    docker build -t askyia-backend:latest "$PROJECT_ROOT/backend"
    
    echo "Building frontend image..."
    docker build -t askyia-frontend:latest "$PROJECT_ROOT/frontend"
    
    echo -e "${GREEN}Images built successfully!${NC}"
}

# Deploy application
deploy_app() {
    echo -e "${YELLOW}Deploying application...${NC}"
    
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    
    # Apply base manifests
    kubectl apply -k "$SCRIPT_DIR/base/"
    
    echo -e "${YELLOW}Waiting for pods to be ready...${NC}"
    kubectl wait --for=condition=ready pod -l app=postgres -n askyia --timeout=120s
    kubectl wait --for=condition=ready pod -l app=chromadb -n askyia --timeout=120s
    kubectl wait --for=condition=ready pod -l app=backend -n askyia --timeout=180s
    kubectl wait --for=condition=ready pod -l app=frontend -n askyia --timeout=120s
    
    echo -e "${GREEN}Application deployed successfully!${NC}"
}

# Show access info
show_access_info() {
    echo ""
    echo -e "${GREEN}=================================================="
    echo "🎉 Deployment Complete!"
    echo "==================================================${NC}"
    echo ""
    
    MINIKUBE_IP=$(minikube ip)
    
    echo "Access the application:"
    echo ""
    echo "Option 1: NodePort (recommended for development)"
    echo "  Frontend: http://${MINIKUBE_IP}:30080"
    echo "  Backend:  http://${MINIKUBE_IP}:30081"
    echo ""
    echo "Option 2: Ingress"
    echo "  Add this to your /etc/hosts file:"
    echo "    ${MINIKUBE_IP} askyia.local"
    echo "  Then access: http://askyia.local"
    echo ""
    echo "Option 3: Port-forward"
    echo "  kubectl port-forward svc/frontend 8080:80 -n askyia"
    echo "  kubectl port-forward svc/backend 8000:8000 -n askyia"
    echo ""
    echo "Useful commands:"
    echo "  kubectl get pods -n askyia          # View pods"
    echo "  kubectl logs -f deploy/backend -n askyia  # View backend logs"
    echo "  kubectl logs -f deploy/frontend -n askyia # View frontend logs"
    echo ""
}

# Main execution
main() {
    check_prerequisites
    start_minikube
    build_images
    deploy_app
    show_access_info
}

main "$@"



