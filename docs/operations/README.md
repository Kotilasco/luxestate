# Operations

## Local Docker Startup

```bash
docker compose -f infrastructure/docker/docker-compose.yml up --build
```

Services:

- Web Portal: `http://localhost:3000`
- API Gateway: `http://localhost:8080/health`
- Carbon Registry: `http://localhost:8101/health`
- RabbitMQ Console: `http://localhost:15672`

## Kubernetes

Apply manifests in this order:

```bash
kubectl apply -f infrastructure/kubernetes/configmaps/
kubectl apply -f infrastructure/kubernetes/secrets/zai-cts-secrets.yaml
kubectl apply -f infrastructure/kubernetes/deployments/
kubectl apply -f infrastructure/kubernetes/services/
```

Production clusters must use sealed secrets or an external secrets operator. Never commit real secrets.
