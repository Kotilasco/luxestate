"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  LinearProgress,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  Forest,
  People,
  AccountBalance,
  Verified,
  Speed,
} from "@mui/icons-material";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const stats = [
  {
    title: "Total Credits Issued",
    value: "125,450",
    unit: "tCO2e",
    change: "+12.5%",
    trend: "up",
    icon: Verified,
    color: "#4CAF50",
    bgGradient: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
  },
  {
    title: "Active Projects",
    value: "24",
    unit: "projects",
    change: "+3",
    trend: "up",
    icon: Forest,
    color: "#2E7D32",
    bgGradient: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)",
  },
  {
    title: "Market Volume",
    value: "$2.4M",
    unit: "USD",
    change: "+8.2%",
    trend: "up",
    icon: AccountBalance,
    color: "#1565C0",
    bgGradient: "linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)",
  },
  {
    title: "Communities",
    value: "12,450",
    unit: "people",
    change: "+450",
    trend: "up",
    icon: People,
    color: "#6A1B9A",
    bgGradient: "linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)",
  },
];

const recentActivity = [
  { id: 1, action: "Credits Minted", project: "Kariba REDD+", amount: "5,000 tCO2e", time: "2 min ago", type: "success" },
  { id: 2, action: "ITMO Authorized", project: "Hwange Solar", amount: "2,500 tCO2e", time: "15 min ago", type: "info" },
  { id: 3, action: "Trade Executed", project: "Chipinge Agroforestry", amount: "$45,000", time: "1 hour ago", type: "success" },
  { id: 4, action: "AI Validation", project: "Matabeleland Wind", amount: "Score: 87/100", time: "2 hours ago", type: "warning" },
];

export default function AnimatedDashboard() {
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            mb: 1,
            background: "linear-gradient(135deg, #0D47A1 0%, #42A5F5 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Real-time overview of Zimbabwe's Carbon Trading System
        </Typography>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <motion.div variants={itemVariants}>
                <Card
                  sx={{
                    background: stat.bgGradient,
                    borderRadius: 4,
                    overflow: "hidden",
                    position: "relative",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px) scale(1.02)",
                      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: stat.color,
                          width: 48,
                          height: 48,
                        }}
                      >
                        <stat.icon />
                      </Avatar>
                      <Chip
                        icon={stat.trend === "up" ? <TrendingUp /> : <TrendingDown />}
                        label={stat.change}
                        color={stat.trend === "up" ? "success" : "error"}
                        size="small"
                        sx={{
                          bgcolor: stat.trend === "up" ? "rgba(76, 175, 80, 0.15)" : "rgba(244, 67, 54, 0.15)",
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                    <Typography variant="h3" fontWeight="800" color={stat.color}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.unit}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                      {stat.title}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* System Health */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card
              sx={{
                borderRadius: 4,
                background: "linear-gradient(135deg, #1a237e 0%, #283593 100%)",
                color: "white",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Animated background */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: 0.1,
                  background: "radial-gradient(circle at 50% 50%, #42A5F5 0%, transparent 70%)",
                }}
              />
              <CardContent sx={{ p: 4, position: "relative" }}>
                <Typography variant="h5" fontWeight="600" gutterBottom>
                  System Health
                </Typography>
                <Grid container spacing={3} sx={{ mt: 2 }}>
                  {[
                    { name: "Carbon Registry", status: "Operational", health: 98 },
                    { name: "AI Validation", status: "Operational", health: 99 },
                    { name: "Marketplace", status: "Operational", health: 97 },
                    { name: "Compliance", status: "Operational", health: 100 },
                    { name: "GIS Service", status: "Operational", health: 95 },
                    { name: "Blockchain", status: "Operational", health: 100 },
                  ].map((service, idx) => (
                    <Grid item xs={12} sm={6} key={idx}>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                          <Typography variant="body2">{service.name}</Typography>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            {service.health}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={service.health}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: "rgba(255,255,255,0.2)",
                            "& .MuiLinearProgress-bar": {
                              bgcolor: service.health > 95 ? "#4CAF50" : service.health > 90 ? "#FF9800" : "#F44336",
                              borderRadius: 4,
                            },
                          }}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card sx={{ borderRadius: 4, height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  Recent Activity
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {recentActivity.map((activity, idx) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + idx * 0.1 }}
                    >
                      <Box
                        sx={{
                          p: 2,
                          mb: 1,
                          borderRadius: 2,
                          background: "rgba(0,0,0,0.02)",
                          borderLeft: `4px solid ${
                            activity.type === "success" ? "#4CAF50" :
                            activity.type === "info" ? "#2196F3" : "#FF9800"
                          }`,
                          transition: "all 0.3s",
                          "&:hover": {
                            background: "rgba(0,0,0,0.04)",
                            transform: "translateX(4px)",
                          },
                        }}
                      >
                        <Typography variant="body2" fontWeight="600">
                          {activity.action}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {activity.project}
                        </Typography>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                          <Chip
                            label={activity.amount}
                            size="small"
                            sx={{ fontWeight: 500 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {activity.time}
                          </Typography>
                        </Box>
                      </Box>
                    </motion.div>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
}
