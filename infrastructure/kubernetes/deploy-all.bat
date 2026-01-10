@echo off
setlocal enabledelayedexpansion

echo 🚀 Deploying Complete Askyia Stack on Kubernetes
echo ==================================================

set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..\..

set DEPLOY_MONITORING=false
set DEPLOY_LOGGING=false
set BUILD_IMAGES=false
set USE_MINIKUBE=false

:: Parse arguments
:parse_args
if "%~1"=="" goto :done_args
if "%~1"=="--monitoring" set DEPLOY_MONITORING=true
if "%~1"=="--logging" set DEPLOY_LOGGING=true
if "%~1"=="--build" set BUILD_IMAGES=true
if "%~1"=="--minikube" set USE_MINIKUBE=true
if "%~1"=="--all" (
    set DEPLOY_MONITORING=true
    set DEPLOY_LOGGING=true
    set BUILD_IMAGES=true
)
if "%~1"=="--help" (
    echo Usage: %0 [OPTIONS]
    echo.
    echo Options:
    echo   --monitoring    Deploy Prometheus and Grafana
    echo   --logging       Deploy ELK stack and Filebeat
    echo   --build         Build Docker images
    echo   --minikube      Use minikube docker daemon
    echo   --all           Deploy everything with image building
    echo   --help          Show this help message
    exit /b 0
)
shift
goto :parse_args
:done_args

:: Check prerequisites
echo Checking prerequisites...

where kubectl >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: kubectl is not installed.
    exit /b 1
)

kubectl cluster-info >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Cannot connect to Kubernetes cluster.
    exit /b 1
)

echo Prerequisites met!

:: Build images if requested
if "%BUILD_IMAGES%"=="true" (
    echo.
    echo Building Docker Images...
    
    if "%USE_MINIKUBE%"=="true" (
        echo Using minikube docker daemon...
        @FOR /f "tokens=*" %%i IN ('minikube docker-env --shell cmd') DO @%%i
    )
    
    echo Building backend image...
    docker build -t askyia-backend:latest "%PROJECT_ROOT%\backend"
    
    echo Building frontend image...
    docker build -t askyia-frontend:latest "%PROJECT_ROOT%\frontend"
    
    echo Images built successfully!
)

:: Deploy base application
echo.
echo Deploying Base Application...
kubectl apply -k "%SCRIPT_DIR%base\"

echo Waiting for pods to be ready...
kubectl wait --for=condition=ready pod -l app=postgres -n askyia --timeout=120s
kubectl wait --for=condition=ready pod -l app=chromadb -n askyia --timeout=120s
kubectl wait --for=condition=ready pod -l app=backend -n askyia --timeout=180s
kubectl wait --for=condition=ready pod -l app=frontend -n askyia --timeout=120s

echo Base application deployed!

:: Deploy monitoring if requested
if "%DEPLOY_MONITORING%"=="true" (
    echo.
    echo Deploying Monitoring Stack...
    kubectl apply -k "%SCRIPT_DIR%monitoring\"
    
    kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=180s
    kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=180s
    
    echo Monitoring stack deployed!
)

:: Deploy logging if requested
if "%DEPLOY_LOGGING%"=="true" (
    echo.
    echo Deploying Logging Stack...
    kubectl apply -k "%SCRIPT_DIR%logging\"
    
    kubectl wait --for=condition=ready pod -l app=elasticsearch -n logging --timeout=300s
    kubectl wait --for=condition=ready pod -l app=logstash -n logging --timeout=180s
    kubectl wait --for=condition=ready pod -l app=kibana -n logging --timeout=180s
    
    echo Logging stack deployed!
)

:: Show summary
echo.
echo ==================================================
echo Deployment Complete!
echo ==================================================
echo.

for /f %%i in ('minikube ip 2^>nul') do set MINIKUBE_IP=%%i

if defined MINIKUBE_IP (
    echo Access URLs:
    echo   Frontend:    http://%MINIKUBE_IP%:30080
    echo   Backend API: http://%MINIKUBE_IP%:30081
    
    if "%DEPLOY_MONITORING%"=="true" (
        echo   Prometheus:  http://%MINIKUBE_IP%:30090
        echo   Grafana:     http://%MINIKUBE_IP%:30030
    )
    
    if "%DEPLOY_LOGGING%"=="true" (
        echo   Kibana:      http://%MINIKUBE_IP%:30561
    )
)

echo.
echo Check Status:
echo   kubectl get pods -n askyia
if "%DEPLOY_MONITORING%"=="true" echo   kubectl get pods -n monitoring
if "%DEPLOY_LOGGING%"=="true" echo   kubectl get pods -n logging

if "%DEPLOY_MONITORING%"=="true" (
    echo.
    echo Grafana Credentials:
    echo   Username: admin
    echo   Password: askyia-admin-2024
)

endlocal