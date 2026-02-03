# Node.js Kubernetes Deployment with Minikube

A simple Node.js application deployed on Kubernetes using Minikube with ConfigMap integration.

## Prerequisites

- Docker installed and running
- Linux/Ubuntu system
- Non-root user

## Quick Start

### 1. Install Minikube
```bash
curl -LO https://github.com/kubernetes/minikube/releases/latest/download/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube && rm minikube-linux-amd64
minikube version
```

### 2. Install kubectl
```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
kubectl version --client
```

### 3. Start Minikube
```bash
minikube start
minikube status
```

### 4. Clone and Deploy
```bash
git clone https://github.com/Nirmalperiyasamy/k8s-nodejs-deployment.git
cd k8s-nodejs-minikube-deployment
kubectl apply -f k8s/
```

### 5. Verify Deployment
```bash
kubectl get all -n nodejs-app
kubectl get pods -n nodejs-app
```

### 6. Access Application

**Option 1: Using NodePort**
```bash
minikube service nodejs-service -n nodejs-app
```

**Option 2: Using Ingress with Domain**
```bash
# Enable ingress addon
minikube addons enable ingress

# Get Minikube IP
minikube ip

# Add domain to /etc/hosts
echo "$(minikube ip) nodejs-demo.local" | sudo tee -a /etc/hosts

# Verify entry added
cat /etc/hosts | grep nodejs-demo

# Access application
curl http://nodejs-demo.local/
```

## Project Structure
```
k8s-nodejs-minikube-deployment/
├── app/
│   ├── server.js
│   ├── package.json
│   ├── Dockerfile
│   └── .dockerignore
├── k8s/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   └── ingress.yaml
└── README.md
```

## Useful Commands
```bash
# View resources
kubectl get all -n nodejs-app

# View logs
kubectl logs -n nodejs-app deployment/nodejs-deployment

# Scale deployment
kubectl scale deployment nodejs-deployment -n nodejs-app --replicas=5

# Update ConfigMap and restart
kubectl edit configmap nodejs-config -n nodejs-app
kubectl rollout restart deployment/nodejs-deployment -n nodejs-app

# Get Minikube IP
minikube ip

# View /etc/hosts file
cat /etc/hosts
```

## Cleanup
```bash
# Delete application
kubectl delete namespace nodejs-app

# Remove domain from /etc/hosts (optional)
sudo sed -i '/nodejs-demo.local/d' /etc/hosts

# Stop Minikube
minikube stop

# Delete Minikube cluster
minikube delete
```

## Technology Stack

- Node.js v22
- Express v4.19.2
- Docker
- Kubernetes
- Minikube

## Resources

- [Minikube Documentation](https://minikube.sigs.k8s.io/docs/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)