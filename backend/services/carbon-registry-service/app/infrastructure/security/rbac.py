"""Role-Based Access Control (RBAC) implementation for ZAI-CTS.

This module provides comprehensive permission checking based on user roles.
All sensitive operations must use the require_permission decorator or check_permission function.
"""

from dataclasses import dataclass
from enum import Enum
from functools import wraps
from typing import Callable, Optional, ParamSpec, TypeVar
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.session import get_session
from app.infrastructure.security.current_user import CurrentUser, get_current_user

# HTTP Bearer token security scheme
security = HTTPBearer(auto_error=False)


class Permission(str, Enum):
    """Granular permissions for the ZAI-CTS platform."""
    # System administration
    SYSTEM_ADMIN = "system.admin"
    SYSTEM_CONFIGURE = "system.configure"
    
    # User management
    USERS_MANAGE = "users.manage"
    USERS_APPROVE = "users.approve"
    USERS_SUSPEND = "users.suspend"
    ROLES_MANAGE = "roles.manage"
    
    # Organization management
    ORGANIZATIONS_REVIEW = "organizations.review"
    ORGANIZATIONS_APPROVE = "organizations.approve"
    ORGANIZATIONS_MANAGE = "organizations.manage"
    
    # Project management
    PROJECTS_CREATE = "projects.create"
    PROJECTS_REVIEW = "projects.review"
    PROJECTS_APPROVE = "projects.approve"
    PROJECTS_SUSPEND = "projects.suspend"
    PROJECTS_DELETE = "projects.delete"
    
    # Verification
    VERIFICATION_START = "verification.start"
    VERIFICATION_REVIEW = "verification.review"
    VERIFICATION_DECIDE = "verification.decide"
    VERIFICATION_SIGN = "verification.sign"
    EVIDENCE_UPLOAD = "evidence.upload"
    
    # Credit issuance
    CREDITS_ISSUE = "credits.issue"
    CREDITS_MANAGE = "credits.manage"
    CREDITS_TRANSFER = "credits.transfer"
    CREDITS_RETIRE = "credits.retire"
    CREDITS_FREEZE = "credits.freeze"
    
    # GIS
    GIS_REVIEW = "gis.review"
    GIS_LINEAGE_RECORD = "gis.lineage.record"
    GIS_BULK_PROCESS = "gis.bulk.process"
    
    # MRV
    MRV_REVIEW = "mrv.review"
    MONITORING_SUBMIT = "monitoring.submit"
    MONITORING_INSPECT = "monitoring.inspect"
    
    # AI
    AI_REVIEW = "ai.review"
    AI_OVERRIDE = "ai.override"
    AI_RUN_MODEL = "ai.run_model"
    
    # Compliance
    COMPLIANCE_CASE_OPEN = "compliance.case.open"
    COMPLIANCE_ENFORCE = "compliance.enforce"
    APPEALS_REVIEW = "appeals.review"
    
    # Marketplace
    MARKETPLACE_LIST = "marketplace.list"
    MARKETPLACE_TRADE = "marketplace.trade"
    SETTLEMENT_RECORD = "settlement.record"
    
    # Article 6
    ARTICLE6_AUTHORIZE = "article6.authorize"
    ARTICLE6_APPROVE = "article6.approve"
    
    # National registry
    REGISTRY_ADMIN = "registry.admin"
    REGISTRY_MANAGE = "registry.manage"
    RULES_ADOPT = "rules.adopt"
    STAGE_DECISION = "stage.decision"
    
    # Audit
    AUDIT_VIEW = "audit.view"
    REPORTS_EXPORT = "reports.export"
    REPORTS_APPROVE = "reports.approve"
    
    # Finance
    INVOICES_ISSUE = "invoices.issue"
    PAYMENTS_RECONCILE = "payments.reconcile"
    FEES_CONFIGURE = "fees.configure"
    
    # Public
    PUBLIC_VIEW = "public.view"
    CERTIFICATE_VERIFY = "certificate.verify"    
    # Additional marketplace permissions
    PORTFOLIO_VIEW = "portfolio.view"
    CREDITS_BUY = "credits.buy"
    CREDITS_SELL = "credits.sell"
    
    # Community
    CONSULTATION_RECORD = "consultation.record"
    SAFEGUARDS_REVIEW = "safeguards.review"
    
    # Additional registry
    REGISTRY_REVIEW = "registry.review"
    REPORTS_VIEW = "reports.view"

# Role-to-permissions mapping
ROLE_PERMISSIONS: dict[str, list[str]] = {
    "Super Administrator": ["*"],  # Wildcard grants all permissions
    
    "ZiCMA Administrator": [
        Permission.REGISTRY_ADMIN,
        Permission.REGISTRY_MANAGE,
        Permission.ARTICLE6_APPROVE,
        Permission.COMPLIANCE_ENFORCE,
        Permission.STAGE_DECISION,
        Permission.USERS_MANAGE,
        Permission.ORGANIZATIONS_MANAGE,
        Permission.REPORTS_APPROVE,
        Permission.RULES_ADOPT,
        Permission.PROJECTS_APPROVE,
        Permission.VERIFICATION_DECIDE,
        Permission.ARTICLE6_AUTHORIZE,
        Permission.CREDITS_ISSUE,
    ],
    
    "Registry Officer": [
        Permission.ORGANIZATIONS_REVIEW,
        Permission.PROJECTS_REVIEW,
        Permission.CREDITS_ISSUE,
        Permission.VERIFICATION_REVIEW,
        Permission.MRV_REVIEW,
        Permission.AUDIT_VIEW,
    ],
    
    "Registry Manager": [
        Permission.REGISTRY_MANAGE,
        Permission.CREDITS_MANAGE,
        Permission.REPORTS_APPROVE,
        Permission.ORGANIZATIONS_APPROVE,
        Permission.PROJECTS_APPROVE,
    ],
    
    "Project Developer": [
        Permission.PROJECTS_CREATE,
        Permission.EVIDENCE_UPLOAD,
        Permission.MONITORING_SUBMIT,
        Permission.MARKETPLACE_TRADE,
        Permission.PORTFOLIO_VIEW,
        Permission.VERIFICATION_START,
    ],
    
    "Accredited Validator": [
        Permission.VERIFICATION_REVIEW,
        Permission.VERIFICATION_DECIDE,
    ],
    
    "Accredited Verifier": [
        Permission.VERIFICATION_REVIEW,
        Permission.VERIFICATION_SIGN,
        Permission.MRV_REVIEW,
        Permission.VERIFICATION_DECIDE,
    ],
    
    "GIS Analyst": [
        Permission.GIS_REVIEW,
        Permission.GIS_LINEAGE_RECORD,
        Permission.GIS_BULK_PROCESS,
    ],
    
    "MRV Officer": [
        Permission.MRV_REVIEW,
        Permission.MONITORING_INSPECT,
    ],
    
    "AI Review Officer": [
        Permission.AI_REVIEW,
        Permission.AI_OVERRIDE,
        Permission.AI_RUN_MODEL,
    ],
    
    "Compliance Officer": [
        Permission.COMPLIANCE_CASE_OPEN,
        Permission.CREDITS_FREEZE,
        Permission.AUDIT_VIEW,
    ],
    
    "Legal Officer": [
        Permission.APPEALS_REVIEW,
        Permission.RULES_ADOPT,
        Permission.COMPLIANCE_ENFORCE,
    ],
    
    "Marketplace Operator": [
        Permission.MARKETPLACE_LIST,
        Permission.SETTLEMENT_RECORD,
        Permission.MARKETPLACE_TRADE,
    ],
    
    "Finance Officer": [
        Permission.INVOICES_ISSUE,
        Permission.PAYMENTS_RECONCILE,
        Permission.FEES_CONFIGURE,
    ],
    
    "Community Officer": [
        Permission.CONSULTATION_RECORD,
        Permission.SAFEGUARDS_REVIEW,
    ],
    
    "Buyer": [
        Permission.PORTFOLIO_VIEW,
        Permission.CREDITS_BUY,
        Permission.CREDITS_RETIRE,
        Permission.MARKETPLACE_TRADE,
    ],
    
    "Seller": [
        Permission.PORTFOLIO_VIEW,
        Permission.CREDITS_SELL,
        Permission.MARKETPLACE_TRADE,
    ],
    
    "Auditor": [
        Permission.AUDIT_VIEW,
        Permission.REPORTS_EXPORT,
    ],
    
    "Public User": [
        Permission.PUBLIC_VIEW,
        Permission.CERTIFICATE_VERIFY,
    ],
    
    "Government Officer": [
        Permission.REGISTRY_REVIEW,
        Permission.ORGANIZATIONS_REVIEW,
        Permission.REPORTS_VIEW,
    ],
    
    "Administrator": [
        Permission.USERS_MANAGE,
        Permission.ROLES_MANAGE,
        Permission.SYSTEM_CONFIGURE,
    ],
}


@dataclass(frozen=True)
class AuthenticatedUser(CurrentUser):
    """Extended user object with permission checking capabilities."""
    
    def has_permission(self, permission: str) -> bool:
        """Check if user has a specific permission."""
        if not self.actor_role:
            return False
        
        # Get permissions for user's role
        permissions = ROLE_PERMISSIONS.get(self.actor_role, [])
        
        # Check for wildcard permission
        if "*" in permissions:
            return True
        
        return permission in permissions
    
    def has_any_permission(self, permissions: list[str]) -> bool:
        """Check if user has any of the specified permissions."""
        return any(self.has_permission(p) for p in permissions)
    
    def has_all_permissions(self, permissions: list[str]) -> bool:
        """Check if user has all specified permissions."""
        return all(self.has_permission(p) for p in permissions)
    
    def get_permissions(self) -> list[str]:
        """Get all permissions for this user's role."""
        if not self.actor_role:
            return []
        permissions = ROLE_PERMISSIONS.get(self.actor_role, [])
        if "*" in permissions:
            return ["*"] + [p.value for p in Permission]
        return permissions


def check_permission(user: CurrentUser, permission: str) -> None:
    """Check if user has permission, raise HTTPException if not.
    
    Args:
        user: The current user
        permission: The required permission
        
    Raises:
        HTTPException: 403 Forbidden if user lacks permission
    """
    if not isinstance(user, AuthenticatedUser):
        auth_user = AuthenticatedUser(actor_id=user.actor_id, actor_role=user.actor_role)
    else:
        auth_user = user
        
    if not auth_user.has_permission(permission):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied. Required: {permission}",
        )


async def get_authenticated_user(
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
    db: AsyncSession = Depends(get_session),
) -> AuthenticatedUser:
    """Get authenticated user with role validation from session.

    SECURITY: The role is retrieved from the session store, NOT from headers.
    This prevents privilege escalation attacks where users could spoof their role.
    """
    from app.infrastructure.security.current_user import require_authenticated_user

    # Get authenticated user from session
    current_user = await require_authenticated_user(authorization, db)

    # Validate role exists in our permission system
    if current_user.actor_role and current_user.actor_role not in ROLE_PERMISSIONS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid role: {current_user.actor_role}",
        )

    return AuthenticatedUser(
        actor_id=current_user.actor_id,
        actor_role=current_user.actor_role
    )


P = ParamSpec('P')
R = TypeVar('R')


def require_permission(permission: str) -> Callable[[Callable[P, R]], Callable[P, R]]:
    """Decorator to require a specific permission for an endpoint.
    
    Usage:
        @router.post("/projects")
        @require_permission(Permission.PROJECTS_CREATE)
        async def create_project(..., user: AuthenticatedUser = Depends(get_authenticated_user)):
            ...
    """
    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        @wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            # Find user in kwargs
            user = kwargs.get('user') or kwargs.get('current_user')
            for arg in args:
                if isinstance(arg, (CurrentUser, AuthenticatedUser)):
                    user = arg
                    break
            
            if user is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required",
                )
            
            check_permission(user, permission)
            return func(*args, **kwargs)
        return wrapper
    return decorator


def require_any_permission(permissions: list[str]) -> Callable[[Callable[P, R]], Callable[P, R]]:
    """Decorator to require any of the specified permissions."""
    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        @wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            user = kwargs.get('user') or kwargs.get('current_user')
            for arg in args:
                if isinstance(arg, (CurrentUser, AuthenticatedUser)):
                    user = arg
                    break
            
            if user is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required",
                )
            
            if not isinstance(user, AuthenticatedUser):
                auth_user = AuthenticatedUser(actor_id=user.actor_id, actor_role=user.actor_role)
            else:
                auth_user = user
                
            if not auth_user.has_any_permission(permissions):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission denied. Required any of: {', '.join(permissions)}",
                )
            return func(*args, **kwargs)
        return wrapper
    return decorator
