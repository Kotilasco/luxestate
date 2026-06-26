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
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  ExpandMore,
  Assessment,
  Gavel,
  Settings,
  TrendingUp,
  CheckCircle,
  Warning,
  Error,
  Visibility,
  PlayArrow,
  Pause,
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

// Mock data
const mockPendingProjects = [
  {
    id: "proj-004",
    name: "Matabeleland South Wind Farm",
    developer: "Green Energy Africa Ltd",
    type: "Renewable Energy",
    submissionDate: "2026-06-15",
    aiScore: 87,
    aiStatus: "passed",
    status: "pending_review",
    location: "Gwanda",
    estimatedAnnualCredits: 45000,
  },
  {
    id: "proj-005",
    name: "Guruve Improved Cookstoves",
    developer: "Community Carbon Solutions",
    type: "Energy Efficiency",
    submissionDate: "2026-06-18",
    aiScore: 78,
    aiStatus: "passed",
    status: "pending_review",
    location: "Guruve",
    estimatedAnnualCredits: 12000,
  },
  {
    id: "proj-006",
    name: "Manicaland Bamboo Plantation",
    developer: "EcoForestry Zimbabwe",
    type: "Forestry",
    submissionDate: "2026-06-20",
    aiScore: 65,
    aiStatus: "flagged",
    status: "pending_review",
    location: "Mutare",
    estimatedAnnualCredits: 28000,
  },
];

const mockLoAApplications = [
  {
    id: "loa-001",
    projectId: "proj-001",
    projectName: "Kariba REDD+ Forest Conservation",
    applicant: "CarbonFinancier GmbH",
    buyerCountry: "Germany",
    quantity: 25000,
    purpose: "NDC Compliance",
    submissionDate: "2026-06-10",
    status: "under_review",
  },
  {
    id: "loa-002",
    projectId: "proj-002",
    projectName: "Hwange Solar Farm Phase 1",
    applicant: "Swiss Climate AG",
    buyerCountry: "Switzerland",
    quantity: 15000,
    purpose: "Voluntary Market",
    submissionDate: "2026-06-12",
    status: "approved",
  },
  {
    id: "loa-003",
    projectId: "proj-003",
    projectName: "Chipinge Smallholder Agroforestry",
    applicant: "Nordic Carbon AS",
    buyerCountry: "Norway",
    quantity: 8000,
    purpose: "CORSIA",
    submissionDate: "2026-06-14",
    status: "pending",
  },
];

const mockAIDecisions = [
  {
    id: "ai-001",
    projectId: "proj-006",
    type: "Additionality",
    decision: "FLAGGED",
    confidence: 72,
    reasoning: "Baseline scenario unclear. Financial analysis suggests project may be viable without carbon revenue.",
    reviewerOverride: null,
    timestamp: "2026-06-20T10:30:00Z",
  },
  {
    id: "ai-002",
    projectId: "proj-001",
    type: "Monitoring Plan",
    decision: "APPROVED",
    confidence: 94,
    reasoning: "Comprehensive monitoring protocol with appropriate sampling strategy and QA/QC measures.",
    reviewerOverride: null,
    timestamp: "2026-06-15T14:20:00Z",
  },
  {
    id: "ai-003",
    projectId: "proj-005",
    type: "Permanence",
    decision: "WARNING",
    confidence: 81,
    reasoning: "Risk assessment adequate but buffer pool contribution should be increased to 20% given fire risk.",
    reviewerOverride: "ACCEPTED",
    timestamp: "2026-06-18T09:15:00Z",
  },
];

const mockBaselineParams = {
  forestry: {
    deforestationRate: 2.3,
    carbonStock: 185,
    bufferPercentage: 15,
    creditingPeriod: 30,
  },
  renewable: {
    gridEmissionFactor: 0.85,
    capacityFactor: 28,
    bufferPercentage: 10,
    creditingPeriod: 21,
  },
  agriculture: {
    adoptionRate: 65,
    sequestrationRate: 3.2,
    bufferPercentage: 20,
    creditingPeriod: 20,
  },
};

export default function ZiCMARegulatorDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Approval dialog state
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [approvalDecision, setApprovalDecision] = useState<"approve" | "reject" | "">("");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [conditions, setConditions] = useState("");

  // LoA dialog state
  const [loaDialogOpen, setLoaDialogOpen] = useState(false);
  const [selectedLoA, setSelectedLoA] = useState<any>(null);
  const [loaDecision, setLoaDecision] = useState<"approve" | "reject" | "">("");
  const [loaConditions, setLoaConditions] = useState("");

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError(null);
    setSuccess(null);
  };

  const handleApproveProject = async () => {
    setLoading(true);
    setTimeout(() => {
      setSuccess(
        `Project ${selectedProject.name} ${approvalDecision === "approve" ? "approved" : "rejected"} successfully`
      );
      setApprovalDialogOpen(false);
      setLoading(false);
      setSelectedProject(null);
    }, 1500);
  };

  const handleLoADecision = async () => {
    setLoading(true);
    setTimeout(() => {
      setSuccess(
        `LoA application ${loaDecision === "approve" ? "approved" : "rejected"} for ${selectedLoA.projectName}`
      );
      setLoaDialogOpen(false);
      setLoading(false);
      setSelectedLoA(null);
    }, 1500);
  };

  const getStatusChip = (status: string) => {
    const colors: Record<string, any> = {
      approved: "success",
      rejected: "error",
      pending: "warning",
      pending_review: "warning",
      under_review: "info",
      passed: "success",
      flagged: "error",
    };
    return (
      <Chip
        label={status.replace("_", " ").toUpperCase()}
        color={colors[status] || "default"}
        size="small"
      />
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "error";
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h4" gutterBottom>
        ZiCMA Regulator Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Zimbabwe Carbon Market Authority oversight portal for project approvals, baseline parameter setting, and AI auditing.
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

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Pending Review</Typography>
              <Typography variant="h4">{mockPendingProjects.length}</Typography>
              <Typography variant="caption">projects awaiting approval</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">LoA Applications</Typography>
              <Typography variant="h4">
                {mockLoAApplications.filter((a) => a.status === "pending" || a.status === "under_review").length}
              </Typography>
              <Typography variant="caption">awaiting decision</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">AI Flags</Typography>
              <Typography variant="h4" color="warning.main">
                {mockAIDecisions.filter((d) => d.decision === "FLAGGED" || d.decision === "WARNING").length}
              </Typography>
              <Typography variant="caption">require review</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Total Credits</Typography>
              <Typography variant="h4">
                {mockPendingProjects.reduce((sum, p) => sum + p.estimatedAnnualCredits, 0).toLocaleString()}
              </Typography>
              <Typography variant="caption">tCO2e pending</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Project Approvals" icon={<Assessment />} iconPosition="start" />
          <Tab label="LoA Applications" icon={<Gavel />} iconPosition="start" />
          <Tab label="AI Audit Trail" icon={<Visibility />} iconPosition="start" />
          <Tab label="Baseline Parameters" icon={<Settings />} iconPosition="start" />
        </Tabs>

        {/* Project Approvals Tab */}
        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" gutterBottom>
            Pending Project Approvals
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  <TableCell>Developer</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>AI Score</TableCell>
                  <TableCell>Est. Credits</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockPendingProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <Typography fontWeight="medium">{project.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {project.id} • {project.location}
                      </Typography>
                    </TableCell>
                    <TableCell>{project.developer}</TableCell>
                    <TableCell>{project.type}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <LinearProgress
                          variant="determinate"
                          value={project.aiScore}
                          color={getScoreColor(project.aiScore)}
                          sx={{ width: 60, mr: 1 }}
                        />
                        <Typography variant="body2">{project.aiScore}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{project.estimatedAnnualCredits.toLocaleString()} tCO2e/yr</TableCell>
                    <TableCell>
                      {getStatusChip(project.aiStatus)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedProject(project);
                          setApprovalDialogOpen(true);
                        }}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Alert severity="info" sx={{ mt: 3 }}>
            <strong>AI Integration:</strong> All projects undergo automated validation before manual review. 
            Flagged items require additional scrutiny.
          </Alert>
        </TabPanel>

        {/* LoA Applications Tab */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Article 6 Authorization Applications
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Application ID</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Applicant</TableCell>
                  <TableCell>Buyer Country</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell>Purpose</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockLoAApplications.map((loa) => (
                  <TableRow key={loa.id}>
                    <TableCell>{loa.id}</TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">{loa.projectName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {loa.projectId}
                      </Typography>
                    </TableCell>
                    <TableCell>{loa.applicant}</TableCell>
                    <TableCell>{loa.buyerCountry}</TableCell>
                    <TableCell align="right">{loa.quantity.toLocaleString()} tCO2e</TableCell>
                    <TableCell>{loa.purpose}</TableCell>
                    <TableCell>{getStatusChip(loa.status)}</TableCell>
                    <TableCell>
                      {(loa.status === "pending" || loa.status === "under_review") && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setSelectedLoA(loa);
                            setLoaDialogOpen(true);
                          }}
                        >
                          Decide
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* AI Audit Trail Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            AI Decision Audit Trail
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Review and override AI-generated decisions with full reasoning transparency.
          </Typography>

          <Grid container spacing={3}>
            {mockAIDecisions.map((decision) => (
              <Grid item xs={12} key={decision.id}>
                <Accordion defaultExpanded={decision.decision === "FLAGGED"}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                      <Typography sx={{ width: "20%", fontWeight: "medium" }}>
                        {decision.projectId}
                      </Typography>
                      <Typography sx={{ width: "20%" }}>{decision.type}</Typography>
                      <Chip
                        label={decision.decision}
                        color={
                          decision.decision === "APPROVED"
                            ? "success"
                            : decision.decision === "FLAGGED"
                            ? "error"
                            : "warning"
                        }
                        size="small"
                        sx={{ mr: 2 }}
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={decision.confidence}
                          sx={{ width: 100 }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ ml: 2 }}>
                        {decision.confidence}% confidence
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={8}>
                        <Typography variant="subtitle2">AI Reasoning:</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {decision.reasoning}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2">Reviewer Override:</Typography>
                        {decision.reviewerOverride ? (
                          <Chip
                            label={decision.reviewerOverride}
                            color="info"
                            size="small"
                          />
                        ) : (
                          <Box sx={{ mt: 1 }}>
                            <Button size="small" variant="outlined" sx={{ mr: 1 }}>
                              Accept
                            </Button>
                            <Button size="small" variant="outlined" color="error">
                              Override
                            </Button>
                          </Box>
                        )}
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          {new Date(decision.timestamp).toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Baseline Parameters Tab */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" gutterBottom>
            Baseline Parameter Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Set national baseline parameters for carbon credit calculations by project type.
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Forestry Projects
                  </Typography>
                  <TextField
                    fullWidth
                    label="Deforestation Rate (%)"
                    defaultValue={mockBaselineParams.forestry.deforestationRate}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Carbon Stock (tC/ha)"
                    defaultValue={mockBaselineParams.forestry.carbonStock}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Buffer Pool (%)"
                    defaultValue={mockBaselineParams.forestry.bufferPercentage}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Crediting Period (years)"
                    defaultValue={mockBaselineParams.forestry.creditingPeriod}
                  />
                  <Button variant="contained" sx={{ mt: 2 }} fullWidth>
                    Save Forestry Params
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Renewable Energy
                  </Typography>
                  <TextField
                    fullWidth
                    label="Grid Emission Factor (tCO2/MWh)"
                    defaultValue={mockBaselineParams.renewable.gridEmissionFactor}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Capacity Factor (%)"
                    defaultValue={mockBaselineParams.renewable.capacityFactor}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Buffer Pool (%)"
                    defaultValue={mockBaselineParams.renewable.bufferPercentage}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Crediting Period (years)"
                    defaultValue={mockBaselineParams.renewable.creditingPeriod}
                  />
                  <Button variant="contained" sx={{ mt: 2 }} fullWidth>
                    Save Renewable Params
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Agriculture
                  </Typography>
                  <TextField
                    fullWidth
                    label="Adoption Rate (%)"
                    defaultValue={mockBaselineParams.agriculture.adoptionRate}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Sequestration Rate (tCO2/ha/yr)"
                    defaultValue={mockBaselineParams.agriculture.sequestrationRate}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Buffer Pool (%)"
                    defaultValue={mockBaselineParams.agriculture.bufferPercentage}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Crediting Period (years)"
                    defaultValue={mockBaselineParams.agriculture.creditingPeriod}
                  />
                  <Button variant="contained" sx={{ mt: 2 }} fullWidth>
                    Save Agriculture Params
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Alert severity="warning" sx={{ mt: 3 }}>
            <strong>Important:</strong> Changes to baseline parameters affect all future credit calculations. 
            Historical issuances are not retroactively adjusted.
          </Alert>
        </TabPanel>
      </Paper>

      {/* Project Approval Dialog */}
      <Dialog
        open={approvalDialogOpen}
        onClose={() => setApprovalDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Review Project Approval</DialogTitle>
        <DialogContent>
          {selectedProject && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6">{selectedProject.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedProject.developer}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Type:</strong> {selectedProject.type}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Location:</strong> {selectedProject.location}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Est. Annual Credits:</strong>{" "}
                    {selectedProject.estimatedAnnualCredits.toLocaleString()} tCO2e
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">AI Validation Results:</Typography>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Typography sx={{ mr: 2 }}>Overall Score:</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={selectedProject.aiScore}
                    color={getScoreColor(selectedProject.aiScore)}
                    sx={{ width: 100, mr: 1 }}
                  />
                  <Typography>{selectedProject.aiScore}%</Typography>
                </Box>
                {getStatusChip(selectedProject.aiStatus)}
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Decision"
                  value={approvalDecision}
                  onChange={(e) => setApprovalDecision(e.target.value as any)}
                  SelectProps={{ native: true }}
                  sx={{ mb: 2 }}
                >
                  <option value="">Select decision...</option>
                  <option value="approve">Approve</option>
                  <option value="reject">Reject</option>
                </TextField>
                <TextField
                  fullWidth
                  label="Conditions (if approved)"
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Review Notes"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleApproveProject}
            disabled={loading || !approvalDecision}
            color={approvalDecision === "approve" ? "success" : "error"}
          >
            {loading ? "Processing..." : "Submit Decision"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* LoA Decision Dialog */}
      <Dialog
        open={loaDialogOpen}
        onClose={() => setLoaDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Letter of Authorization Decision</DialogTitle>
        <DialogContent>
          {selectedLoA && (
            <>
              <Typography gutterBottom>
                <strong>Project:</strong> {selectedLoA.projectName}
              </Typography>
              <Typography gutterBottom>
                <strong>Applicant:</strong> {selectedLoA.applicant}
              </Typography>
              <Typography gutterBottom>
                <strong>Buyer Country:</strong> {selectedLoA.buyerCountry}
              </Typography>
              <Typography gutterBottom>
                <strong>Quantity:</strong> {selectedLoA.quantity.toLocaleString()} tCO2e
              </Typography>
              <Typography gutterBottom>
                <strong>Purpose:</strong> {selectedLoA.purpose}
              </Typography>

              <TextField
                fullWidth
                select
                label="Decision"
                value={loaDecision}
                onChange={(e) => setLoaDecision(e.target.value as any)}
                SelectProps={{ native: true }}
                sx={{ mb: 2, mt: 2 }}
              >
                <option value="">Select decision...</option>
                <option value="approve">Approve</option>
                <option value="reject">Reject</option>
              </TextField>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Conditions / Notes"
                value={loaConditions}
                onChange={(e) => setLoaConditions(e.target.value)}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoaDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleLoADecision}
            disabled={loading || !loaDecision}
            color={loaDecision === "approve" ? "success" : "error"}
          >
            {loading ? "Processing..." : "Submit Decision"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
