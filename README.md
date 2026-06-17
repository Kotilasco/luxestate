# Zimbabwe AI-Enhanced Carbon Trading Ecosystem

ZAI-CTS is a production-grade national carbon trading platform foundation built from `MASTER_SPECIFICATION.md`.

The repository now contains:

- Enterprise architecture documentation
- PostgreSQL/PostGIS database schema baseline
- FastAPI Carbon Registry service
- Node.js API Gateway
- Next.js TypeScript Web Portal
- Docker Compose baseline
- Kubernetes manifests
- GitHub Actions CI
- Existing Laravel/Bootstrap visual template retained as a reference/landing implementation

## Start the Enterprise Stack

```bash
docker compose -f infrastructure/docker/docker-compose.yml up --build
```

Open:

```text
Web Portal:       http://localhost:3000
API Gateway:      http://localhost:8080/health
Carbon Registry:  http://localhost:8101/health
RabbitMQ Console: http://localhost:15672
```

## Carbon Registry Service

```bash
cd backend/services/carbon-registry-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
pytest
uvicorn app.main:app --reload --port 8101
```

OpenAPI:

```text
http://localhost:8101/docs
```

## API Gateway

```bash
cd api-gateway
npm install
npm run dev
```

## Web Portal

```bash
cd frontend/web-portal
npm install
npm run dev
```

## Legacy Laravel Template

The previous LuxEstate-based Laravel template remains available for visual reference:

```bash
docker run -d --name luxestate-app -p 8001:8000 -v ${PWD}:/app -w /app composer:2 php artisan serve --host=0.0.0.0 --port=8000
```

Open:

```text
http://127.0.0.1:8001
```

## Key Paths

- `MASTER_SPECIFICATION.md` - constitutional specification
- `docs/architecture` - C4, DDD, bounded contexts
- `database` - PostgreSQL/PostGIS schema and migrations
- `backend/services/carbon-registry-service` - FastAPI service
- `api-gateway` - Node.js gateway
- `frontend/web-portal` - Next.js portal
- `infrastructure` - Docker, Kubernetes, operations
