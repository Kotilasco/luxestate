"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  Paper,
  Tabs,
  Tab,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Map,
  Satellite,
  Forest,
  Warning,
  TrendingDown,
  TrendingUp,
  Layers,
  Download,
  PlayArrow,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      <AnimatePresence mode="wait">
        {value === index && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ p: 3 }}>{children}</Box>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Mock data for GIS visualization
const mockProjects = [
  {
    id: "proj-001",
    name: "Kariba REDD+",
    area_ha: 45000,
    forest_cover_pct: 67.3,
    lat: -16.75,
    lon: 28.25,
    type: "Forest Conservation",
  },
  {
    id: "proj-002",
    name: "Hwange Solar",
    area_ha: 1200,
    forest_cover_pct: 0,
    lat: -18.65,
    lon: 26.95,
    type: "Renewable Energy",
  },
  {
    id: "proj-003",
    name: "Chipinge Agroforestry",
    area_ha: 8500,
    forest_cover_pct: 72.5,
    lat: -20.15,
    lon: 32.65,
    type: "Agroforestry",
  },
];

const mockSatelliteScenes = [
  {
    id: "s2-20240615",
    satellite: "Sentinel-2",
    date: "2026-06-15",
    cloud_cover: 8.5,
    resolution: 10,
    bands: ["RGB", "NDVI", "NIR"],
    status: "available",
  },
  {
    id: "s2-20240601",
    satellite: "Sentinel-2",
    date: "2026-06-01",
    cloud_cover: 15.2,
    resolution: 10,
    bands: ["RGB", "NDVI"],
    status: "available",
  },
  {
    id: "l8-20240520",
    satellite: "Landsat-8",
    date: "2026-05-20",
    cloud_cover: 22.0,
    resolution: 30,
    bands: ["RGB", "SWIR"],
    status: "processing",
  },
];

const mockForestChange = {
  baseline_year: 2020,
  current_year: 2026,
  baseline_cover: 68.5,
  current_cover: 67.2,
  change_pct: -1.3,
  change_ha: -585,
  hotspots: [
    { lat: -16.72, lon: 28.28, area_ha: 125, severity: "high" },
    { lat: -16.78, lon: 28.22, area_ha: 85, severity: "medium" },
    { lat: -16.68, lon: 28.32, area_ha: 45, severity: "low" },
  ],
};

const mockLeakageZones = [
  { distance_km: 5, direction: "N", forest_cover: 65.2, risk: "medium", color: "#FFA726" },
  { distance_km: 5, direction: "NE", forest_cover: 63.8, risk: "medium", color: "#FFA726" },
  { distance_km: 5, direction: "E", forest_cover: 62.5, risk: "high", color: "#EF5350" },
  { distance_km: 5, direction: "SE", forest_cover: 64.1, risk: "medium", color: "#FFA726" },
  { distance_km: 5, direction: "S", forest_cover: 66.8, risk: "low", color: "#66BB6A" },
  { distance_km: 5, direction: "SW", forest_cover: 67.2, risk: "low", color: "#66BB6A" },
  { distance_km: 5, direction: "W", forest_cover: 66.5, risk: "low", color: "#66BB6A" },
  { distance_km: 5, direction: "NW", forest_cover: 65.9, risk: "low", color: "#66BB6A" },
];

export default function GISDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedProject, setSelectedProject] = useState(mockProjects[0]);
  const [loading, setLoading] = useState(false);
  const [showTimeSeries, setShowTimeSeries] = useState(false);
  const [timeRange, setTimeRange] = useState([2020, 2026]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleProjectChange = (projectId: string) => {
    const project = mockProjects.find((p) => p.id === projectId);
    if (project) setSelectedProject(project);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          GIS Intelligence Center
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Advanced geospatial analytics powered by Google Earth Engine, QGIS, and PostGIS
        </Typography>
      </motion.div>

      {/* Project Selector */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Paper sx={{ mb: 3, p: 2, background: "linear-gradient(135deg, #1a237e 0%, #283593 100%)", color: "white" }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth sx={{ color: "white" }}>
                <InputLabel sx={{ color: "rgba(255,255,255,0.7)" }}>Select Project</InputLabel>
                <Select
                  value={selectedProject.id}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  sx={{ color: "white", ".MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.3)" } }}
                >
                  {mockProjects.map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>Area</Typography>
              <Typography variant="h6">{selectedProject.area_ha.toLocaleString()} ha</Typography>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>Forest Cover</Typography>
              <Typography variant="h6">{selectedProject.forest_cover_pct}%</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button variant="contained" color="secondary" startIcon={<Satellite />}>
                  Latest Imagery
                </Button>
                <Button variant="outlined" sx={{ color: "white", borderColor: "white" }} startIcon={<Download />}>
                  Export
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>

      {/* Main Content Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Satellite Imagery" icon={<Satellite />} iconPosition="start" />
          <Tab label="Forest Analysis" icon={<Forest />} iconPosition="start" />
          <Tab label="Leakage Detection" icon={<Warning />} iconPosition="start" />
          <Tab label="Map Layers" icon={<Layers />} iconPosition="start" />
        </Tabs>

        {/* Satellite Imagery Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card sx={{ height: 500, position: "relative", overflow: "hidden" }}>
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  {/* Simulated Satellite View */}
                  <Box
                    sx={{
                      width: "90%",
                      height: "90%",
                      borderRadius: 2,
                      background: "linear-gradient(135deg, #2E7D32 0%, #66BB6A 30%, #1B5E20 60%, #0D3B00 100%)",
                      position: "relative",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
                    }}
                  >
                    {/* Forest texture pattern */}
                    {Array.from({ length: 20 }).map((_, i) => (
                      <Box
                        key={i}
                        sx={{
                          position: "absolute",
                          width: Math.random() * 100 + 50,
                          height: Math.random() * 100 + 50,
                          borderRadius: "50%",
                          background: `rgba(27, 94, 32, ${Math.random() * 0.3 + 0.2})`,
                          left: `${Math.random() * 80}%`,
                          top: `${Math.random() * 80}%`,
                        }}
                      />
                    ))}
                    {/* Project boundary */}
                    <Box
                      sx={{
                        position: "absolute",
                        width: "60%",
                        height: "50%",
                        border: "3px dashed #FFEB3B",
                        borderRadius: "8px",
                        left: "20%",
                        top: "25%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography variant="caption" sx={{ color: "#FFEB3B", fontWeight: "bold" }}>
                        Project Boundary
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ position: "absolute", bottom: 16, left: 16, right: 16 }}>
                  <Chip label="Sentinel-2" color="primary" size="small" sx={{ mr: 1 }} />
                  <Chip label="10m resolution" size="small" sx={{ mr: 1 }} />
                  <Chip label="8.5% cloud cover" color="success" size="small" />
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Available Imagery</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Cloud %</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {mockSatelliteScenes.map((scene) => (
                          <TableRow key={scene.id} hover>
                            <TableCell>{scene.date}</TableCell>
                            <TableCell>{scene.cloud_cover}%</TableCell>
                            <TableCell>
                              <Chip
                                label={scene.status}
                                color={scene.status === "available" ? "success" : "warning"}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Analysis Tools</Typography>
                  <Button fullWidth variant="outlined" sx={{ mb: 1 }}>
                    Calculate NDVI
                  </Button>
                  <Button fullWidth variant="outlined" sx={{ mb: 1 }}>
                    Detect Changes
                  </Button>
                  <Button fullWidth variant="outlined">
                    Estimate Biomass
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Forest Analysis Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Forest Cover Change</Typography>
                  <Box sx={{ textAlign: "center", py: 3 }}>
                    <Typography variant="h2" color={mockForestChange.change_pct < 0 ? "error" : "success"}>
                      {mockForestChange.change_pct > 0 ? "+" : ""}{mockForestChange.change_pct}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {mockForestChange.change_ha} hectares
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption">Baseline (2020)</Typography>
                    <LinearProgress variant="determinate" value={mockForestChange.baseline_cover} sx={{ mb: 1 }} />
                    <Typography variant="caption">Current (2026)</Typography>
                    <LinearProgress variant="determinate" value={mockForestChange.current_cover} color="success" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Deforestation Hotspots</Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Location (Lat, Lon)</TableCell>
                          <TableCell>Area Affected</TableCell>
                          <TableCell>Severity</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {mockForestChange.hotspots.map((spot, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{spot.lat.toFixed(3)}, {spot.lon.toFixed(3)}</TableCell>
                            <TableCell>{spot.area_ha} ha</TableCell>
                            <TableCell>
                              <Chip
                                label={spot.severity.toUpperCase()}
                                color={
                                  spot.severity === "high" ? "error" :
                                  spot.severity === "medium" ? "warning" : "success"
                                }
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h6">Time Series Analysis</Typography>
                    <Button variant="outlined" onClick={() => setShowTimeSeries(true)}>
                      Configure
                    </Button>
                  </Box>
                  <Box sx={{ height: 200, background: "#f5f5f5", borderRadius: 1, p: 2, position: "relative" }}>
                    {/* Simulated time series chart */}
                    <svg width="100%" height="100%" viewBox="0 0 800 150">
                      <defs>
                        <linearGradient id="forestGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#4CAF50" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,50 Q100,30 200,45 T400,60 T600,40 T800,55"
                        fill="none"
                        stroke="#2E7D32"
                        strokeWidth="3"
                      />
                      <path
                        d="M0,50 Q100,30 200,45 T400,60 T600,40 T800,55 V150 H0 Z"
                        fill="url(#forestGradient)"
                      />
                      {/* Data points */}
                      <circle cx="0" cy="50" r="5" fill="#2E7D32" />
                      <circle cx="200" cy="45" r="5" fill="#2E7D32" />
                      <circle cx="400" cy="60" r="5" fill="#2E7D32" />
                      <circle cx="600" cy="40" r="5" fill="#2E7D32" />
                      <circle cx="800" cy="55" r="5" fill="#2E7D32" />
                    </svg>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                      <Typography variant="caption">2020</Typography>
                      <Typography variant="caption">2022</Typography>
                      <Typography variant="caption">2024</Typography>
                      <Typography variant="caption">2026</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Leakage Detection Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: 400 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Leakage Zone Analysis</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    8-directional buffer analysis at 5km radius
                  </Typography>
                  {/* Radar chart simulation */}
                  <Box sx={{ position: "relative", height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="280" height="280" viewBox="0 0 280 280">
                      {/* Background circles */}
                      <circle cx="140" cy="140" r="120" fill="none" stroke="#e0e0e0" strokeWidth="1" />
                      <circle cx="140" cy="140" r="80" fill="none" stroke="#e0e0e0" strokeWidth="1" />
                      <circle cx="140" cy="140" r="40" fill="none" stroke="#e0e0e0" strokeWidth="1" />
                      {/* Direction lines */}
                      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                        const rad = (angle * Math.PI) / 180;
                        const x2 = 140 + 120 * Math.cos(rad - Math.PI / 2);
                        const y2 = 140 + 120 * Math.sin(rad - Math.PI / 2);
                        return (
                          <line
                            key={angle}
                            x1="140"
                            y1="140"
                            x2={x2}
                            y2={y2}
                            stroke="#e0e0e0"
                            strokeWidth="1"
                          />
                        );
                      })}
                      {/* Data polygon */}
                      <polygon
                        points={mockLeakageZones.map((z, i) => {
                          const angle = (i * 45 * Math.PI) / 180;
                          const radius = (z.forest_cover / 70) * 120;
                          const x = 140 + radius * Math.cos(angle - Math.PI / 2);
                          const y = 140 + radius * Math.sin(angle - Math.PI / 2);
                          return `${x},${y}`;
                        }).join(" ")}
                        fill="rgba(46, 125, 50, 0.3)"
                        stroke="#2E7D32"
                        strokeWidth="2"
                      />
                      {/* Center point */}
                      <circle cx="140" cy="140" r="5" fill="#FF5722" />
                      <text x="140" y="145" textAnchor="middle" fontSize="8" fill="white">Project</text>
                    </svg>
                    {/* Direction labels */}
                    {["N", "NE", "E", "SE", "S", "SW", "W", "NW"].map((dir, i) => {
                      const angle = (i * 45 * Math.PI) / 180;
                      const x = 140 + 135 * Math.cos(angle - Math.PI / 2);
                      const y = 140 + 135 * Math.sin(angle - Math.PI / 2);
                      return (
                        <Typography
                          key={dir}
                          variant="caption"
                          sx={{
                            position: "absolute",
                            left: x,
                            top: y,
                            transform: "translate(-50%, -50%)",
                            fontWeight: "bold",
                          }}
                        >
                          {dir}
                        </Typography>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Zone Risk Assessment</Typography>
                  <List>
                    {mockLeakageZones.map((zone, idx) => (
                      <ListItem key={idx} sx={{ px: 0 }}>
                        <Box sx={{ width: "100%" }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                            <Typography variant="body2">{zone.direction} ({zone.distance_km}km)</Typography>
                            <Chip
                              label={zone.risk.toUpperCase()}
                              size="small"
                              sx={{
                                backgroundColor: zone.color,
                                color: "white",
                                fontWeight: "bold",
                              }}
                            />
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={zone.forest_cover}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: "#e0e0e0",
                              "& .MuiLinearProgress-bar": {
                                backgroundColor: zone.color,
                              },
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Forest cover: {zone.forest_cover}%
                          </Typography>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Map Layers Tab */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={2}>
            {[
              { name: "Project Boundary", type: "boundary", color: "#2E7D32" },
              { name: "Forest Cover", type: "forest", color: "#1B5E20" },
              { name: "Communities", type: "communities", color: "#D32F2F" },
              { name: "Water Bodies", type: "water", color: "#1976D2" },
              { name: "Roads", type: "roads", color: "#424242" },
              { name: "Deforestation Alerts", type: "alerts", color: "#F44336" },
            ].map((layer, idx) => (
              <Grid item xs={12} sm={6} md={4} key={layer.type}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card
                    sx={{
                      cursor: "pointer",
                      transition: "all 0.3s",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            backgroundColor: layer.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Layers sx={{ color: "white" }} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {layer.name}
                          </Typography>
                          <Typography variant="caption" color="success.main">
                            Available
                          </Typography>
                        </Box>
                      </Box>
                      <Button fullWidth variant="outlined" size="small" sx={{ mt: 2 }}>
                        View Layer
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Paper>

      {/* Time Series Dialog */}
      <Dialog open={showTimeSeries} onClose={() => setShowTimeSeries(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Time Series Configuration</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>Analysis Period: {timeRange[0]} - {timeRange[1]}</Typography>
          <Slider
            value={timeRange}
            onChange={(e, val) => setTimeRange(val as number[])}
            valueLabelDisplay="auto"
            min={2018}
            max={2026}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTimeSeries(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowTimeSeries(false)}>
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
