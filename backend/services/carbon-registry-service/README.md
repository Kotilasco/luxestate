# Carbon Registry Service

FastAPI service for carbon project registration and carbon credit registry workflows.

## Capabilities

- Register carbon projects
- Read project records
- List project records
- Emit immutable audit events
- Expose health and metrics endpoints
- Publish OpenAPI through FastAPI

## Run Locally

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8101
```

## Environment

```text
DATABASE_URL=postgresql+asyncpg://zai_cts:zai_cts@localhost:5432/zai_cts
SERVICE_NAME=carbon-registry-service
JWT_ISSUER=https://identity.zai-cts.gov.zw
JWT_AUDIENCE=zai-cts-api
```

