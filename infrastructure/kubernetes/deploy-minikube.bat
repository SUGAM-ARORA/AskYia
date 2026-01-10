@echo off
setlocal enabledelayedexpansion

echo 🚀 Askyia Kubernetes Deployment Script for Minikube
echo ==================================================

:: Check prerequisites
echo Checking prerequisites...

where minikube >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: minikube is not installed. Please install it first.
    exit /b 1
)

where kubectl >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: kubectl is not installed. Please install it first.
    exit /b 1
)

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: docker is not installed. Please install it first.
    exit /b 1
)

echo All prerequisites met!

:: Start minikube
echo Starting minikube...
minikube status | findstr "Running" >nul
if %errorlevel% neq 0 (
    minikube start --cpus=4 --memory=8192 --driver=docker
)

echo Enabling ingress addon...
minikube addons enable ingress

:: Set docker environment
echo Setting Docker environment...
@FOR /f "tokens=*" %%i IN ('minikube docker-env --shell cmd') DO @%%i

:: Build images
echo Building Docker images...

set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..\..

echo Building backend image...
docker build -t askyia-backend:latest "%PROJECT_ROOT%\backend"

echo Building frontend image...
docker build -t askyia-frontend:latest "%PROJECT_ROOT%\frontend"

echo Images built successfully!

:: Deploy application
echo Deploying application...
kubectl apply -k "%SCRIPT_DIR%base\"

echo Waiting for pods to be ready...
kubectl wait --for=condition=ready pod -l app=postgres -n askyia --timeout=120s
kubectl wait --for=condition=ready pod -l app=chromadb -n askyia --timeout=120s
kubectl wait --for=condition=ready pod -l app=backend -n askyia --timeout=180s
kubectl wait --for=condition=ready pod -l app=frontend -n askyia --timeout=120s

:: Show access info
echo.
echo ==================================================
echo 🎉 Deployment Complete!
echo ==================================================
echo.

for /f %%i in ('minikube ip') do set MINIKUBE_IP=%%i

echo Access the application:
echo.
echo Option 1: NodePort
echo   Frontend: http://%MINIKUBE_IP%:30080
echo   Backend:  http://%MINIKUBE_IP%:30081
echo.
echo Option 2: Ingress
echo   Add this to C:\Windows\System32\drivers\etc\hosts:
echo     %MINIKUBE_IP% askyia.local
echo   Then access: http://askyia.local
echo.

endlocal