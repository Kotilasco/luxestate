from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.infrastructure.security.current_user import SESSIONS
from app.main import create_app


@pytest.mark.asyncio
async def test_auth_registration_approval_login_and_logout() -> None:
    app = create_app()

    # Create admin session for approval
    from app.api.v1.auth import USERS
    admin_token = "test_admin_token"
    USERS["admin@test.com"] = {
        "id": uuid4(),
        "full_name": "Test Admin",
        "email": "admin@test.com",
        "role": "Super Administrator",
        "status": "approved",
        "salt": "test_salt",
        "password_hash": "test_hash",
        "email_verified": True,
        "mfa_enabled": False,
        "organization": None,
        "digital_signature": "SIG-ADMIN",
        "created_at": datetime.now(tz=UTC),
    }
    SESSIONS[admin_token] = {
        "user_email": "admin@test.com",
        "expires_at": datetime.now(tz=UTC) + timedelta(hours=8),
        "created_at": datetime.now(tz=UTC),
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        register_response = await client.post(
            "/api/v1/auth/register",
            json={
                "full_name": "Test Project Developer",
                "email": "developer@example.com",
                "password": "Developer@12345",
                "role": "Project Developer",
                "organization": {
                    "name": "Example Carbon Developer",
                    "organization_type": "Carbon Developer",
                    "country": "Zimbabwe",
                    "registration_number": "ORG-TEST-001",
                },
            },
        )
        assert register_response.status_code == 201
        user = register_response.json()
        assert user["status"] == "pending_approval"
        assert user["organization"]["kyb_status"] == "pending"

        blocked_login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": "developer@example.com", "password": "Developer@12345"},
        )
        assert blocked_login_response.status_code == 403

        # Now approval requires authentication
        approval_response = await client.post(
            f"/api/v1/auth/users/{user['id']}/approval",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"status": "approved", "reason": "Integration test approval."},
        )
        assert approval_response.status_code == 200
        assert approval_response.json()["status"] == "approved"
        assert approval_response.json()["email_verified"] is True

        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": "developer@example.com", "password": "Developer@12345"},
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        me_response = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_response.status_code == 200
        assert me_response.json()["role"] == "Project Developer"

        logout_response = await client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
        assert logout_response.status_code == 200

        expired_me_response = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert expired_me_response.status_code == 401
