"use client";

import { ReactNode } from "react";
import { Button, ButtonProps, Chip, Tooltip, CircularProgress, Box } from "@mui/material";
import { Lock, CheckCircle, Block, Warning } from "@mui/icons-material";
import { Permission, hasPermission, UserRole } from "@/lib/rbac";

export type ActionState = "available" | "loading" | "completed" | "disabled" | "locked" | "unauthorized";

export interface ActionButtonProps extends Omit<ButtonProps, "onClick"> {
  /** Unique key for this action */
  actionKey: string;
  /** Display label */
  label: string;
  /** Required permission to see/use this action */
  requiredPermission: Permission;
  /** Current user role */
  userRole?: UserRole | string;
  /** Current state of the action */
  state?: ActionState;
  /** Whether action has been recorded/completed in backend */
  isRecorded?: boolean;
  /** Custom disable reason tooltip */
  disableReason?: string;
  /** Handler when action is clicked */
  onAction?: () => void | Promise<void>;
  /** Optional icon */
  icon?: ReactNode;
  /** Variant for completed state display */
  completedVariant?: "chip" | "button";
  /** Show tooltip with state info */
  showTooltip?: boolean;
  /** Force enable this action regardless of state (for admin override) */
  forceEnabled?: boolean;
  /** Reason shown when action is force-enabled */
  forceEnabledReason?: string;
}

const stateConfig: Record<ActionState, { color: ButtonProps["color"]; icon: ReactNode; tooltip: string }> = {
  available: { color: "primary", icon: null, tooltip: "Click to execute this action" },
  loading: { color: "primary", icon: <CircularProgress size={16} />, tooltip: "Processing..." },
  completed: { color: "success", icon: <CheckCircle fontSize="small" />, tooltip: "This action has been completed" },
  disabled: { color: "inherit", icon: <Block fontSize="small" />, tooltip: "This action is currently unavailable" },
  locked: { color: "inherit", icon: <Lock fontSize="small" />, tooltip: "This action is locked" },
  unauthorized: { color: "error", icon: <Warning fontSize="small" />, tooltip: "You don't have permission for this action" },
};

export function ActionButton({
  actionKey,
  label,
  requiredPermission,
  userRole,
  state = "available",
  isRecorded = false,
  disableReason,
  onAction,
  icon,
  completedVariant = "chip",
  showTooltip = true,
  variant = "contained",
  size = "medium",
  fullWidth = false,
  forceEnabled = false,
  forceEnabledReason = "Action overridden by administrator",
  sx,
  ...buttonProps
}: ActionButtonProps) {
  // Check permission
  const hasRequiredPermission = hasPermission(userRole, requiredPermission);

  // Determine effective state
  let effectiveState = state;
  if (!hasRequiredPermission) {
    effectiveState = "unauthorized";
  } else if (isRecorded && !forceEnabled) {
    effectiveState = "completed";
  }

  // Allow forceEnabled to override disabled/locked states (but not unauthorized)
  if (forceEnabled && effectiveState !== "unauthorized") {
    effectiveState = "available";
  }

  const config = stateConfig[effectiveState];
  const isDisabled = effectiveState !== "available" && effectiveState !== "loading";
  const isCompleted = isRecorded && !forceEnabled;

  // For completed state, optionally show as chip instead of button
  if (isCompleted && completedVariant === "chip") {
    return (
      <Tooltip title={disableReason || config.tooltip} arrow disableHoverListener={!showTooltip}>
        <Chip
          icon={config.icon as React.ReactElement | undefined}
          label={`${label} - Completed`}
          color="success"
          size={size === "small" ? "small" : "medium"}
          sx={{ fontWeight: 600, ...sx }}
        />
      </Tooltip>
    );
  }

  const buttonContent = (
    <Button
      variant={isCompleted ? "outlined" : variant}
      color={config.color}
      size={size}
      fullWidth={fullWidth}
      disabled={isDisabled}
      onClick={onAction}
      startIcon={config.icon || icon}
      sx={{
        fontWeight: 600,
        ...(isCompleted && {
          borderColor: "success.main",
          color: "success.main",
          "&:hover": {
            borderColor: "success.dark",
            backgroundColor: "success.light",
          },
        }),
        ...sx,
      }}
      {...buttonProps}
    >
      {isCompleted ? `${label} ✓` : label}
    </Button>
  );

  if (!showTooltip) {
    return buttonContent;
  }

  // Show force enabled reason when action is force-enabled
  const tooltipTitle = forceEnabled && effectiveState === "available" && isRecorded
    ? forceEnabledReason
    : (disableReason || config.tooltip);

  return (
    <Tooltip title={tooltipTitle} arrow disableHoverListener={effectiveState === "available" && !forceEnabled}>
      <Box sx={{ display: "inline-flex", width: fullWidth ? "100%" : "auto" }}>{buttonContent}</Box>
    </Tooltip>
  );
}

// Group of action buttons with consistent spacing
export interface ActionGroupProps {
  children: ReactNode;
  spacing?: number;
  direction?: "row" | "column";
  sx?: any;
}

export function ActionGroup({ children, spacing = 1, direction = "row", sx }: ActionGroupProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: direction,
        gap: spacing,
        flexWrap: "wrap",
        alignItems: direction === "row" ? "center" : "stretch",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

// Permission-aware component that only renders if user has permission
export interface PermissionGuardProps {
  permission: Permission;
  userRole?: UserRole | string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({ permission, userRole, children, fallback = null }: PermissionGuardProps) {
  if (!hasPermission(userRole, permission)) {
    return fallback as React.ReactElement;
  }
  return children as React.ReactElement;
}
