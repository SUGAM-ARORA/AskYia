# Make scripts executable
chmod +x infrastructure/kubernetes/*.sh

# Option 1: Deploy only base application on minikube
./infrastructure/kubernetes/deploy-minikube.sh

# Option 2: Deploy everything (base + monitoring + logging)
./infrastructure/kubernetes/deploy-all.sh --all --minikube

# Option 3: Deploy with Helm
helm install askyia infrastructure/helm/workflow-builder \
  --namespace askyia \
  --create-namespace

# Clean up
./infrastructure/kubernetes/cleanup.sh --all