"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Dashboard,
  Forest,
  AccountBalance,
  Gavel,
  Map,
  Analytics,
  Settings,
  Notifications,
  Person,
  Logout,
} from "@mui/icons-material";

const navItems = [
  { label: "Dashboard", icon: Dashboard, path: "/dashboard" },
  { label: "Projects", icon: Forest, path: "/projects" },
  { label: "Marketplace", icon: AccountBalance, path: "/marketplace" },
  { label: "Regulator", icon: Gavel, path: "/regulator" },
  { label: "GIS", icon: Map, path: "/gis" },
  { label: "Analytics", icon: Analytics, path: "/analytics" },
];

interface GlassNavigationProps {
  userName?: string;
  userRole?: string;
  notificationCount?: number;
}

export default function GlassNavigation({
  userName = "Admin User",
  userRole = "System Administrator",
  notificationCount = 3,
}: GlassNavigationProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeItem, setActiveItem] = useState("Dashboard");

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mr: 4 }}>
            <Avatar
              sx={{
                bgcolor: "primary.main",
                mr: 2,
                width: 40,
                height: 40,
              }}
            >
              <Forest sx={{ color: "white" }} />
            </Avatar>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                background: "linear-gradient(135deg, #0D47A1 0%, #42A5F5 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ZAI-CTS
            </Typography>
          </Box>
        </motion.div>

        {/* Navigation Items */}
        <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" }, gap: 1 }}>
          {navItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                startIcon={<item.icon />}
                onClick={() => setActiveItem(item.label)}
                sx={{
                  color: activeItem === item.label ? "primary.main" : "text.secondary",
                  fontWeight: 600,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  position: "relative",
                  overflow: "hidden",
                  "&:hover": {
                    background: "rgba(13, 71, 161, 0.08)",
                  },
                }}
              >
                {activeItem === item.label && (
                  <motion.div
                    layoutId="activeNav"
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(13, 71, 161, 0.1)",
                      borderRadius: 8,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span style={{ position: "relative", zIndex: 1 }}>{item.label}</span>
              </Button>
            </motion.div>
          ))}
        </Box>

        {/* Right Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            sx={{
              color: "text.secondary",
              "&:hover": { background: "rgba(13, 71, 161, 0.08)" },
            }}
          >
            <Badge badgeContent={notificationCount} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={handleMenuOpen}
              startIcon={
                <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                  <Person sx={{ fontSize: 18 }} />
                </Avatar>
              }
              sx={{
                color: "text.primary",
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 2,
                px: 2,
                "&:hover": {
                  background: "rgba(13, 71, 161, 0.08)",
                },
              }}
            >
              <Box sx={{ textAlign: "left" }}>
                <Typography variant="body2" fontWeight="600">
                  {userName}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: -0.5 }}>
                  {userRole}
                </Typography>
              </Box>
            </Button>
          </motion.div>
        </Box>

        {/* User Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              mt: 1.5,
              minWidth: 200,
              borderRadius: 2,
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem onClick={handleMenuClose}>
            <Person sx={{ mr: 1.5, fontSize: 20 }} />
            Profile
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <Settings sx={{ mr: 1.5, fontSize: 20 }} />
            Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleMenuClose} sx={{ color: "error.main" }}>
            <Logout sx={{ mr: 1.5, fontSize: 20 }} />
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
