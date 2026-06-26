"use client";

import { ReactNode, useState } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  useTheme,
  useMediaQuery,
  Badge,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard,
  Shield,
  AccountTree,
  Verified,
  FactCheck,
  AssignmentTurnedIn,
  SatelliteAlt,
  Map,
  Analytics,
  UploadFile,
  Payments,
  Summarize,
  Article,
  Policy,
  Gavel,
  ExpandLess,
  ExpandMore,
  Notifications,
  Settings,
  Logout,
  AccountCircle,
  Security,
} from "@mui/icons-material";
import { AuthSession } from "@/services/carbonRegistry";
import { hasAnyPermission, Permission, filterNavByRole, UserRole } from "@/lib/rbac";

const DRAWER_WIDTH = 280;

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  requiredPermissions?: Permission[];
  children?: Omit<NavItem, "children">[];
}

const navigationItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: <Dashboard />, requiredPermissions: [] },
  {
    key: "identity",
    label: "Identity & Access",
    icon: <Shield />,
    requiredPermissions: [Permission.USERS_MANAGE, Permission.ROLES_MANAGE],
    children: [
      { key: "identity-users", label: "Users", icon: <AccountCircle />, requiredPermissions: [Permission.USERS_MANAGE] },
      { key: "identity-roles", label: "Roles & Permissions", icon: <Security />, requiredPermissions: [Permission.ROLES_MANAGE] },
    ],
  },
  { key: "organizations", label: "Organizations", icon: <AccountTree />, requiredPermissions: [Permission.ORGANIZATIONS_REVIEW] },
  { key: "carbon-registry", label: "Carbon Registry", icon: <Verified />, requiredPermissions: [Permission.PROJECTS_CREATE, Permission.PROJECTS_REVIEW] },
  { key: "project-lifecycle", label: "Project Lifecycle", icon: <FactCheck />, requiredPermissions: [Permission.PROJECTS_CREATE, Permission.PROJECTS_REVIEW] },
  { key: "validation", label: "Validation", icon: <AssignmentTurnedIn />, requiredPermissions: [Permission.VERIFICATION_REVIEW, Permission.VERIFICATION_DECIDE] },
  { key: "monitoring", label: "Monitoring", icon: <SatelliteAlt />, requiredPermissions: [Permission.MONITORING_SUBMIT, Permission.MONITORING_INSPECT] },
  { key: "verification", label: "Verification", icon: <Verified />, requiredPermissions: [Permission.VERIFICATION_REVIEW, Permission.VERIFICATION_SIGN] },
  { key: "gis", label: "GIS Intelligence", icon: <Map />, requiredPermissions: [Permission.GIS_REVIEW] },
  { key: "ai-validation", label: "AI Validation & MRV", icon: <Analytics />, requiredPermissions: [Permission.AI_REVIEW, Permission.AI_RUN_MODEL] },
  { key: "marketplace", label: "Marketplace", icon: <Payments />, requiredPermissions: [Permission.MARKETPLACE_TRADE, Permission.MARKETPLACE_LIST] },
  { key: "compliance", label: "Compliance", icon: <Policy />, requiredPermissions: [Permission.CREDITS_RETIRE, Permission.COMPLIANCE_CASE_OPEN] },
  { key: "ai-reports", label: "AI Reports & Marketing", icon: <Article />, requiredPermissions: [Permission.AI_REVIEW] },
  { key: "itmo-workflow", label: "ITMO Issuance", icon: <AccountTree />, requiredPermissions: [Permission.PROJECTS_CREATE] },
  {
    key: "stakeholder-portals",
    label: "Stakeholder Portals",
    icon: <AccountCircle />,
    requiredPermissions: [Permission.REGISTRY_ADMIN],
    children: [
      { key: "developer-portal", label: "Project Developer", icon: <UploadFile />, requiredPermissions: [Permission.PROJECTS_CREATE] },
      { key: "buyer-portal", label: "Corporate Buyer", icon: <Payments />, requiredPermissions: [Permission.MARKETPLACE_TRADE] },
      { key: "rdc-portal", label: "RDC Communities", icon: <Map />, requiredPermissions: [Permission.REGISTRY_ADMIN] },
      { key: "zicma-dashboard", label: "ZiCMA Regulator", icon: <Gavel />, requiredPermissions: [Permission.ARTICLE6_APPROVE] },
    ],
  },
  { key: "ai", label: "AI Intelligence", icon: <Analytics />, requiredPermissions: [Permission.AI_REVIEW, Permission.AI_OVERRIDE] },
  { key: "mrv", label: "MRV", icon: <UploadFile />, requiredPermissions: [Permission.MRV_REVIEW] },
  { key: "credit-registry", label: "Credit Registry", icon: <Verified />, requiredPermissions: [Permission.CREDITS_ISSUE, Permission.CREDITS_MANAGE] },
  { key: "marketplace", label: "Marketplace", icon: <Payments />, requiredPermissions: [Permission.MARKETPLACE_TRADE, Permission.MARKETPLACE_LIST] },
  { key: "article6", label: "Article 6 Ops", icon: <Summarize />, requiredPermissions: [Permission.ARTICLE6_APPROVE] },
  { key: "compliance", label: "Compliance", icon: <Policy />, requiredPermissions: [Permission.COMPLIANCE_CASE_OPEN, Permission.COMPLIANCE_ENFORCE] },
  { key: "appeals", label: "Appeals", icon: <Gavel />, requiredPermissions: [Permission.APPEALS_REVIEW] },
  { key: "reporting", label: "Reporting", icon: <Summarize />, requiredPermissions: [Permission.REPORTS_VIEW, Permission.REPORTS_EXPORT] },
  { key: "national", label: "National Stages", icon: <Policy />, requiredPermissions: [Permission.REGISTRY_ADMIN] },
];

interface AppShellProps {
  children: ReactNode;
  authSession: AuthSession | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  health?: string;
}

export function AppShell({ children, authSession, activeTab, onTabChange, onLogout, health }: AppShellProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>(["identity"]);

  const userRole = authSession?.user?.role as UserRole | undefined;
  const filteredNav = filterNavByRole(
    navigationItems.map((item) => ({
      ...item,
      requiredAnyPermission: true,
    })),
    userRole
  );

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleToggleExpand = (key: string) => {
    setExpandedItems((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.key);
    const isActive = activeTab === item.key || activeTab.startsWith(`${item.key}-`);

    return (
      <Box key={item.key}>
        <ListItem disablePadding sx={{ display: "block", pl: depth * 2 }}>
          <ListItemButton
            selected={isActive}
            onClick={() => {
              if (hasChildren) {
                handleToggleExpand(item.key);
              } else {
                onTabChange(item.key);
                if (isMobile) setMobileOpen(false);
              }
            }}
            sx={{
              minHeight: 48,
              px: 2.5,
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
              "&.Mui-selected": {
                backgroundColor: "rgba(25, 118, 210, 0.08)",
                color: "primary.main",
                "& .MuiListItemIcon-root": {
                  color: "primary.main",
                },
              },
              "&:hover": {
                backgroundColor: "rgba(25, 118, 210, 0.04)",
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: isActive ? "primary.main" : "text.secondary",
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
              }}
            />
            {hasChildren && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </ListItem>
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.map((child) => renderNavItem(child as NavItem, depth + 1))}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Logo Area */}
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          color: "white",
        }}
      >
        <Typography variant="caption" sx={{ opacity: 0.7, letterSpacing: 1.5, fontWeight: 600 }}>
          ZIMBABWE NATIONAL PLATFORM
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
          ZAI-CTS
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.6 }}>
          Carbon Trading Ecosystem
        </Typography>
      </Box>

      {/* User Info */}
      {authSession && (
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40 }}>
              {authSession.user.full_name.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap fontWeight={600}>
                {authSession.user.full_name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {authSession.user.email}
              </Typography>
            </Box>
          </Box>
          <Chip
            size="small"
            label={authSession.user.role}
            color="primary"
            variant="outlined"
            sx={{ fontSize: "0.7rem", height: 24 }}
          />
        </Box>
      )}

      {/* Navigation */}
      <List sx={{ flex: 1, overflow: "auto", py: 1 }}>
        {filteredNav.map((item) => renderNavItem(item))}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
        <Typography variant="caption" color="text.secondary" display="block">
          System Status
        </Typography>
        <Chip
          size="small"
          label={health || "Unknown"}
          color={health?.includes("healthy") ? "success" : "warning"}
          sx={{ mt: 0.5, fontSize: "0.7rem" }}
        />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { lg: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { lg: `${DRAWER_WIDTH}px` },
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          color: "text.primary",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { lg: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flex: 1 }} />

          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Badge badgeContent={4} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Settings />
          </IconButton>

          <IconButton
            onClick={handleProfileMenuOpen}
            sx={{
              p: 0.5,
              border: "2px solid",
              borderColor: "primary.main",
            }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
              {authSession?.user.full_name.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            PaperProps={{
              sx: { minWidth: 200, mt: 1.5 },
            }}
          >
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                Signed in as
              </Typography>
            </MenuItem>
            <MenuItem disabled>
              <Typography variant="body2" fontWeight={600}>
                {authSession?.user.email}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleProfileMenuClose}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleProfileMenuClose}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={onLogout}>
              <ListItemIcon>
                <Logout fontSize="small" color="error" />
              </ListItemIcon>
              <Typography color="error">Logout</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{
          width: { lg: DRAWER_WIDTH },
          flexShrink: { lg: 0 },
        }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", lg: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", lg: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
              borderRight: "1px solid",
              borderColor: "divider",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          bgcolor: "background.default",
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>{children}</Box>
      </Box>
    </Box>
  );
}
