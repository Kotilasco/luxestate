"use client";

import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Chip,
  Alert,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import {
  Upload,
  Visibility,
  Assessment,
  TrendingUp,
  CheckCircle,
  Pending,
  Error,
} from "@mui/icons-material";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Mock data for demonstration
const mockProjects = [
  {
    id: "proj-001",
    name: "Kariba REDD+ Forest Conservation",
    status: "validated",
    creditsIssued: 50000,
    creditsPending: 12000,
    lastUpdated: "2026-06-15",
  },
  {
    id: "proj-002",
    name: "Hwange Solar Farm Phase 1",
    status: "under_review",
    creditsIssued: 0,
    creditsPending: 25000,
    lastUpdated: "2026-06-18",
  },
  {
    id: "proj-003",
    name: "Chipinge Smallholder Agroforestry",
    status: "registered",
    creditsIssued: 15000,
    creditsPending: 8000,
    lastUpdated: "2026-06-10",
  },
];

const mockMonitoringReports = [
  {
    id: "mr-001",
    projectId: "proj-001",
    period: "Q2 2026",
    status: "submitted",
    submissionDate: "2026-06-15",
    aiScore: 92,
  },
  {
    id: "mr-002",
    projectId: "proj-001",
    period: "Q1 2026",
    status: "approved",
    submissionDate: "2026-03-15",
    aiScore: 88,
  },
];

const pddSubmissionSteps = [
  "Project Registration",
  "PDD Draft Submission",
  "AI Validation",
  "ZiCMA Review",
  "Validation Complete",
];

export default function ProjectDeveloperPortal() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // PDD Submission State
  const [pddDialogOpen, setPddDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [estimatedCredits, setEstimatedCredits] = useState("");
  const [pddDocument, setPddDocument] = useState<File | null>(null);
  const [activeStep, setActiveStep] = useState(1);

  // Monitoring Report State
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [reportingPeriod, setReportingPeriod] = useState("");
  const [monitoringData, setMonitoringData] = useState("");
  const [reportFiles, setReportFiles] = useState<File[]>([]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError(null);
    setSuccess(null);
  };

  const handlePddSubmit = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setSuccess("PDD submitted successfully! AI validation in progress.");
      setPddDialogOpen(false);
      setLoading(false);
      setActiveStep(2);
    }, 1500);
  };

  const handleMonitoringSubmit = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setSuccess("Monitoring report submitted for AI review.");
      setReportDialogOpen(false);
      setLoading(false);
    }, 1500);
  };

  const getStatusChip = (status: string) => {
    const statusConfig: Record<string, { color: any; icon: any }> = {
      validated: { color: "success", icon: CheckCircle },
      registered: { color: "info", icon: CheckCircle },
      under_review: { color: "warning", icon: Pending },
      rejected: { color: "error", icon: Error },
      submitted: { color: "warning", icon: Pending },
      approved: { color: "success", icon: CheckCircle },
    };
    const config = statusConfig[status] || { color: "default", icon: Pending };
    return (
      <Chip
        icon={<config.icon fontSize="small" />}
        label={status.replace("_", " ").toUpperCase()}
        color={config.color}
        size="small"
      />
    );
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h4" gutterBottom>
        Project Developer Portal
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Submit PDDs, track credit issuance, and manage monitoring reports for your carbon projects.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="My Projects" icon={<Assessment />} iconPosition="start" />
          <Tab label="Submit PDD" icon={<Upload />} iconPosition="start" />
          <Tab label="Monitoring Reports" icon={<TrendingUp />} iconPosition="start" />
        </Tabs>

        {/* My Projects Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6">Your Carbon Projects</Typography>
            <Button
              variant="contained"
              startIcon={<Upload />}
              onClick={() => setPddDialogOpen(true)}
            >
              Submit New PDD
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Project Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Credits Issued</TableCell>
                  <TableCell align="right">Pending</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <Typography fontWeight="medium">{project.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {project.id}
                      </Typography>
                    </TableCell>
                    <TableCell>{getStatusChip(project.status)}</TableCell>
                    <TableCell align="right">
                      {project.creditsIssued.toLocaleString()} tCO2e
                    </TableCell>
                    <TableCell align="right">
                      {project.creditsPending.toLocaleString()} tCO2e
                    </TableCell>
                    <TableCell>{project.lastUpdated}</TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Credit Issuance Summary */}
          <Grid container spacing={3} sx={{ mt: 3 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Credits Issued
                  </Typography>
                  <Typography variant="h4">
                    {mockProjects.reduce((sum, p) => sum + p.creditsIssued, 0).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    tCO2e
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Pending Issuance
                  </Typography>
                  <Typography variant="h4">
                    {mockProjects.reduce((sum, p) => sum + p.creditsPending, 0).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="warning.main">
                    tCO2e under review
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Active Projects
                  </Typography>
                  <Typography variant="h4">{mockProjects.length}</Typography>
                  <Typography variant="caption" color="info.main">
                    across 3 regions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Submit PDD Tab */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            PDD Submission Workflow
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {pddSubmissionSteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Card>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Project Name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Project Location"
                    value={projectLocation}
                    onChange={(e) => setProjectLocation(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Estimated Annual Credits (tCO2e)"
                    type="number"
                    value={estimatedCredits}
                    onChange={(e) => setEstimatedCredits(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Project Description"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    Upload PDD Document (PDF)
                    <input
                      type="file"
                      hidden
                      accept=".pdf"
                      onChange={(e) => setPddDocument(e.target.files?.[0] || null)}
                    />
                  </Button>
                  {pddDocument && (
                    <Typography variant="caption" display="block">
                      Selected: {pddDocument.name}
                    </Typography>
                  )}
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handlePddSubmit}
                  disabled={loading || !projectName || !projectDescription}
                >
                  {loading ? "Submitting..." : "Submit PDD"}
                </Button>
                <Button variant="outlined" onClick={() => setActiveStep(0)}>
                  Save as Draft
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Alert severity="info" sx={{ mt: 3 }}>
            Your PDD will be processed by our AI Co-Pilot for SI 48 compliance checking before ZiCMA review.
          </Alert>
        </TabPanel>

        {/* Monitoring Reports Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6">Monitoring Reports</Typography>
            <Button
              variant="contained"
              startIcon={<Upload />}
              onClick={() => setReportDialogOpen(true)}
            >
              Submit New Report
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Report ID</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>AI Score</TableCell>
                  <TableCell>Submission Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockMonitoringReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>{report.id}</TableCell>
                    <TableCell>
                      {mockProjects.find((p) => p.id === report.projectId)?.name}
                    </TableCell>
                    <TableCell>{report.period}</TableCell>
                    <TableCell>{getStatusChip(report.status)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <LinearProgress
                          variant="determinate"
                          value={report.aiScore}
                          sx={{ width: 60, mr: 1 }}
                        />
                        {report.aiScore}%
                      </Box>
                    </TableCell>
                    <TableCell>{report.submissionDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Monitoring Report Dialog */}
      <Dialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Submit Monitoring Report</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Select Project"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                SelectProps={{ native: true }}
              >
                <option value="">Select a project...</option>
                {mockProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Reporting Period"
                value={reportingPeriod}
                onChange={(e) => setReportingPeriod(e.target.value)}
                placeholder="e.g., Q2 2026"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Monitoring Data Summary"
                value={monitoringData}
                onChange={(e) => setMonitoringData(e.target.value)}
                placeholder="Describe monitoring activities, measurements, and findings..."
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" component="label" fullWidth>
                Upload Supporting Documents
                <input
                  type="file"
                  hidden
                  multiple
                  onChange={(e) =>
                    setReportFiles(Array.from(e.target.files || []))
                  }
                />
              </Button>
              {reportFiles.length > 0 && (
                <List dense>
                  {reportFiles.map((file, idx) => (
                    <ListItem key={idx}>
                      <ListItemText primary={file.name} />
                    </ListItem>
                  ))}
                </List>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleMonitoringSubmit}
            variant="contained"
            disabled={loading || !selectedProject || !reportingPeriod}
          >
            {loading ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
