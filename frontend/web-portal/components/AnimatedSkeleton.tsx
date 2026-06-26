"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";
import {
  Box,
  Card,
  CardContent,
  Skeleton,
  Grid,
} from "@mui/material";

const pulseAnimation: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const shimmerAnimation: Variants = {
  animate: {
    backgroundPosition: ["-200% 0", "200% 0"],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

export function StatCardSkeleton() {
  return (
    <Card sx={{ borderRadius: 4, overflow: "hidden" }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Skeleton variant="circular" width={48} height={48} />
          <Skeleton variant="rounded" width={60} height={24} />
        </Box>
        <Skeleton variant="text" width="60%" height={48} />
        <Skeleton variant="text" width="40%" height={20} />
        <Skeleton variant="text" width="70%" height={16} sx={{ mt: 1 }} />
      </CardContent>
    </Card>
  );
}

export function ChartSkeleton() {
  return (
    <Card sx={{ borderRadius: 4, overflow: "hidden" }}>
      <CardContent sx={{ p: 3 }}>
        <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
        <Box sx={{ height: 300, position: "relative" }}>
          <motion.div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
              backgroundSize: "200% 100%",
              borderRadius: 8,
            }}
            variants={shimmerAnimation}
            animate="animate"
          />
        </Box>
      </CardContent>
    </Card>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card sx={{ borderRadius: 4, overflow: "hidden" }}>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ p: 3, borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
          <Skeleton variant="text" width="30%" height={32} />
        </Box>
        {Array.from({ length: rows }).map((_, i) => (
          <Box
            key={i}
            sx={{
              p: 2,
              borderBottom: i < rows - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
              display: "flex",
              gap: 2,
              alignItems: "center",
            }}
          >
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ flexGrow: 1 }}>
              <Skeleton variant="text" width="60%" height={20} />
              <Skeleton variant="text" width="40%" height={16} />
            </Box>
            <Skeleton variant="rounded" width={80} height={24} />
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}

export function PageSkeleton() {
  return (
    <Box sx={{ p: 3 }}>
      {/* Header Skeleton */}
      <motion.div variants={pulseAnimation} animate="animate">
        <Skeleton variant="text" width="50%" height={60} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="70%" height={24} sx={{ mb: 4 }} />
      </motion.div>

      {/* Stats Grid Skeleton */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <StatCardSkeleton />
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Content Skeleton */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <ChartSkeleton />
          </motion.div>
        </Grid>
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <TableSkeleton rows={4} />
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
}

export function CardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: count }).map((_, i) => (
        <Grid item xs={12} sm={6} md={4} key={i}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card
              sx={{
                borderRadius: 4,
                overflow: "hidden",
                height: 200,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Skeleton variant="circular" width={48} height={48} sx={{ mb: 2 }} />
                <Skeleton variant="text" width="80%" height={28} />
                <Skeleton variant="text" width="60%" height={20} />
                <Box sx={{ mt: 2 }}>
                  <Skeleton variant="rounded" width="100%" height={40} />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      ))}
    </Grid>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <Card sx={{ borderRadius: 4, overflow: "hidden" }}>
      <CardContent sx={{ p: 4 }}>
        <Skeleton variant="text" width="40%" height={32} sx={{ mb: 3 }} />
        {Array.from({ length: fields }).map((_, i) => (
          <Box key={i} sx={{ mb: 3 }}>
            <Skeleton variant="text" width="30%" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" width="100%" height={56} />
          </Box>
        ))}
        <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
          <Skeleton variant="rounded" width={120} height={40} />
          <Skeleton variant="rounded" width={120} height={40} />
        </Box>
      </CardContent>
    </Card>
  );
}

export default {
  PageSkeleton,
  StatCardSkeleton,
  ChartSkeleton,
  TableSkeleton,
  CardSkeletonGrid,
  FormSkeleton,
};
