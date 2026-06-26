/**
 * Role-Based Access Control (RBAC) for ZAI-CTS Frontend
 * 
 * This module provides client-side permission checking to control UI visibility
 * and enable/disable actions based on user roles.
 */

export type UserRole =
  | "Super Administrator"
  | "ZiCMA Administrator"
  | "Registry Officer"
  | "Registry Manager"
  | "Project Developer"
  | "Accredited Validator"
  | "Accredited Verifier"
  | "GIS Analyst"
  | "MRV Officer"
  | "AI Review Officer"
  | "Compliance Officer"
  | "Legal Officer"
  | "Marketplace Operator"
  | "Finance Officer"
  | "Community Officer"
  | "Buyer"
  | "Seller"
  | "Auditor"
  | "Public User"
  | "Government Officer"
  | "Administrator";

export enum Permission {
  // System administration
  SYSTEM_ADMIN = "system.admin",
  SYSTEM_CONFIGURE = "system.configure",
  
  // User management
  USERS_MANAGE = "users.manage",
  USERS_APPROVE = "users.approve",
  USERS_SUSPEND = "users.suspend",
  ROLES_MANAGE = "roles.manage",
  
  // Organization management
  ORGANIZATIONS_REVIEW = "organizations.review",
  ORGANIZATIONS_APPROVE = "organizations.approve",
  ORGANIZATIONS_MANAGE = "organizations.manage",
  
  // Project management
  PROJECTS_CREATE = "projects.create",
  PROJECTS_REVIEW = "projects.review",
  PROJECTS_APPROVE = "projects.approve",
  PROJECTS_SUSPEND = "projects.suspend",
  PROJECTS_DELETE = "projects.delete",
  
  // Verification
  VERIFICATION_START = "verification.start",
  VERIFICATION_REVIEW = "verification.review",
  VERIFICATION_DECIDE = "verification.decide",
  VERIFICATION_SIGN = "verification.sign",
  EVIDENCE_UPLOAD = "evidence.upload",
  
  // Credit issuance
  CREDITS_ISSUE = "credits.issue",
  CREDITS_MANAGE = "credits.manage",
  CREDITS_TRANSFER = "credits.transfer",
  CREDITS_RETIRE = "credits.retire",
  CREDITS_FREEZE = "credits.freeze",
  CREDITS_BUY = "credits.buy",
  CREDITS_SELL = "credits.sell",
  
  // GIS
  GIS_REVIEW = "gis.review",
  GIS_LINEAGE_RECORD = "gis.lineage.record",
  GIS_BULK_PROCESS = "gis.bulk.process",
  
  // MRV
  MRV_REVIEW = "mrv.review",
  MONITORING_SUBMIT = "monitoring.submit",
  MONITORING_INSPECT = "monitoring.inspect",
  
  // AI
  AI_REVIEW = "ai.review",
  AI_OVERRIDE = "ai.override",
  AI_RUN_MODEL = "ai.run_model",
  
  // Compliance
  COMPLIANCE_CASE_OPEN = "compliance.case.open",
  COMPLIANCE_ENFORCE = "compliance.enforce",
  APPEALS_REVIEW = "appeals.review",
  
  // Marketplace
  MARKETPLACE_LIST = "marketplace.list",
  MARKETPLACE_TRADE = "marketplace.trade",
  SETTLEMENT_RECORD = "settlement.record",
  PORTFOLIO_VIEW = "portfolio.view",
  
  // Article 6
  ARTICLE6_AUTHORIZE = "article6.authorize",
  ARTICLE6_APPROVE = "article6.approve",
  
  // National registry
  REGISTRY_ADMIN = "registry.admin",
  REGISTRY_MANAGE = "registry.manage",
  REGISTRY_REVIEW = "registry.review",
  RULES_ADOPT = "rules.adopt",
  STAGE_DECISION = "stage.decision",
  
  // Audit
  AUDIT_VIEW = "audit.view",
  REPORTS_EXPORT = "reports.export",
  REPORTS_APPROVE = "reports.approve",
  REPORTS_VIEW = "reports.view",
  
  // Finance
  INVOICES_ISSUE = "invoices.issue",
  PAYMENTS_RECONCILE = "payments.reconcile",
  FEES_CONFIGURE = "fees.configure",
  
  // Public
  PUBLIC_VIEW = "public.view",
  CERTIFICATE_VERIFY = "certificate.verify",
  
  // Community
  CONSULTATION_RECORD = "consultation.record",
  SAFEGUARDS_REVIEW = "safeguards.review",
}

// Role to permissions mapping (must match backend)
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  "Super Administrator": ["*" as Permission],
  
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
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole | string | undefined, permission: Permission): boolean {
  if (!role) return false;
  
  const permissions = ROLE_PERMISSIONS[role as UserRole] || [];
  
  // Check for wildcard permission (Super Administrator)
  if (permissions.includes("*" as Permission)) return true;
  
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole | string | undefined, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole | string | undefined, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole | string | undefined): Permission[] {
  if (!role) return [];
  const permissions = ROLE_PERMISSIONS[role as UserRole] || [];
  if (permissions.includes("*" as Permission)) {
    return Object.values(Permission);
  }
  return permissions;
}

/**
 * Navigation item with permission requirements
 */
export interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  requiredPermissions?: Permission[];
  requiredAnyPermission?: boolean;
  children?: NavItem[];
}

/**
 * Filter navigation items based on user role
 */
export function filterNavByRole(items: NavItem[], role: UserRole | string | undefined): NavItem[] {
  return items.filter(item => {
    if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
      return true;
    }
    
    if (item.requiredAnyPermission) {
      return hasAnyPermission(role, item.requiredPermissions);
    }
    
    return hasAllPermissions(role, item.requiredPermissions);
  }).map(item => ({
    ...item,
    children: item.children ? filterNavByRole(item.children, role) : undefined,
  }));
}

/**
 * Action button configuration with permission requirements
 */
export interface ActionConfig {
  key: string;
  label: string;
  requiredPermission: Permission;
  disabled?: boolean;
  completed?: boolean;
  onClick?: () => void;
}

/**
 * Check if an action is allowed for a role
 */
export function isActionAllowed(role: UserRole | string | undefined, action: ActionConfig): boolean {
  return hasPermission(role, action.requiredPermission) && !action.disabled;
}
