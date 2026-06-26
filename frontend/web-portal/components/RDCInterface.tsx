"use client";

import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
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
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tooltip,
  TextField,
} from "@mui/material";
import {
  ExpandMore,
  AccountBalance,
  Forest,
  People,
  TrendingUp,
  Warning,
  CheckCircle,
  Map,
  Receipt,
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

// Mock data for RDCs and communities
const mockRDCs = [
  {
    id: "rdc-kariba",
    name: "Kariba Rural District Council",
    district: "Kariba",
    province: "Mashonaland West",
    communities: ["Nyamhunga", "Mlibizi", "Negande"],
    totalLandArea: 45000,
    forestCoverPercent: 68,
    activeProjects: 2,
  },
  {
    id: "rdc-hwange",
    name: "Hwange Rural District Council",
    district: "Hwange",
    province: "Matabeleland North",
    communities: ["Lupote", "Sidinda", "Chidobe"],
    totalLandArea: 38000,
    forestCoverPercent: 45,
    activeProjects: 1,
  },
  {
    id: "rdc-chipinge",
    name: "Chipinge Rural District Council",
    district: "Chipinge",
    province: "Manicaland",
    communities: ["Chisumbanje", "Checheche", "Birchenough Bridge"],
    totalLandArea: 52000,
    forestCoverPercent: 72,
    activeProjects: 1,
  },
];

const mockRevenueData = [
  {
    id: "rev-001",
    rdcId: "rdc-kariba",
    projectName: "Kariba REDD+ Forest Conservation",
    period: "Q2 2026",
    totalRevenue: 125000,
    communityShare: 43750,
    rdcShare: 18750,
    projectDeveloperShare: 50000,
    verificationCosts: 12500,
    beneficiaries: 2450,
    paymentDate: "2026-06-15",
    status: "distributed",
  },
  {
    id: "rev-002",
    rdcId: "rdc-kariba",
    projectName: "Kariba REDD+ Forest Conservation",
    period: "Q1 2026",
    totalRevenue: 98000,
    communityShare: 34300,
    rdcShare: 14700,
    projectDeveloperShare: 39200,
    verificationCosts: 9800,
    beneficiaries: 2450,
    paymentDate: "2026-03-15",
    status: "distributed",
  },
  {
    id: "rev-003",
    rdcId: "rdc-hwange",
    projectName: "Hwange Solar Farm Phase 1",
    period: "Q2 2026",
    totalRevenue: 45000,
    communityShare: 13500,
    rdcShare: 6750,
    projectDeveloperShare: 20250,
    verificationCosts: 4500,
    beneficiaries: 890,
    paymentDate: "2026-06-20",
    status: "pending",
  },
];

const mockCommunityBenefits = [
  {
    id: "ben-001",
    rdcId: "rdc-kariba",
    community: "Nyamhunga",
    projectId: "proj-001",
    benefitType: "School Infrastructure",
    description: "Construction of 2 classroom blocks",
    amount: 15000,
    status: "completed",
    completionDate: "2026-05-15",
  },
  {
    id: "ben-002",
    rdcId: "rdc-kariba",
    community: "Mlibizi",
    projectId: "proj-001",
    benefitType: "Healthcare",
    description: "Mobile clinic services - 6 months",
    amount: 8000,
    status: "in_progress",
    completionDate: null,
  },
  {
    id: "ben-003",
    rdcId: "rdc-kariba",
    community: "Negande",
    projectId: "proj-001",
    benefitType: "Road Maintenance",
    description: "Grading of 15km access road",
    amount: 12000,
    status: "planned",
    completionDate: null,
  },
  {
    id: "ben-004",
    rdcId: "rdc-hwange",
    community: "Lupote",
    projectId: "proj-002",
    benefitType: "Water Supply",
    description: "Borehole drilling and solar pumps",
    amount: 18000,
    status: "in_progress",
    completionDate: null,
  },
];

const mockGrievances = [
  {
    id: "grv-001",
    rdcId: "rdc-kariba",
    community: "Nyamhunga",
    category: "benefit_sharing",
    description: "Concerns about equitable distribution of funds",
    submittedDate: "2026-06-10",
    status: "under_review",
    resolution: null,
  },
  {
    id: "grv-002",
    rdcId: "rdc-kariba",
    community: "Mlibizi",
    category: "project_boundary",
    description: "Dispute over project area boundaries",
    submittedDate: "2026-05-20",
    status: "resolved",
    resolution: "Boundary survey completed and agreed by all parties",
  },
];

export default function RDCInterface() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedRDC, setSelectedRDC] = useState(mockRDCs[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Grievance dialog state
  const [grievanceDialogOpen, setGrievanceDialogOpen] = useState(false);
  const [grievanceCommunity, setGrievanceCommunity] = useState("");
  const [grievanceCategory, setGrievanceCategory] = useState("");
  const [grievanceDescription, setGrievanceDescription] = useState("");

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError(null);
    setSuccess(null);
  };

  const handleSubmitGrievance = async () => {
    setLoading(true);
    setTimeout(() => {
      setSuccess("Grievance submitted successfully. Reference: GRZ-2026-0042");
      setGrievanceDialogOpen(false);
      setLoading(false);
      setGrievanceCommunity("");
      setGrievanceCategory("");
      setGrievanceDescription("");
    }, 1500);
  };

  const getStatusChip = (status: string) => {
    const colors: Record<string, any> = {
      distributed: "success",
      pending: "warning",
      completed: "success",
      in_progress: "info",
      planned: "default",
      under_review: "warning",
      resolved: "success",
    };
    return (
      <Chip
        label={status.replace("_", " ").toUpperCase()}
        color={colors[status] || "default"}
        size="small"
      />
    );
  };

  const rdcRevenue = mockRevenueData.filter((r) => r.rdcId === selectedRDC.id);
  const rdcBenefits = mockCommunityBenefits.filter((b) => b.rdcId === selectedRDC.id);
  const rdcGrievances = mockGrievances.filter((g) => g.rdcId === selectedRDC.id);

  const totalRevenue = rdcRevenue.reduce((sum, r) => sum + r.totalRevenue, 0);
  const totalCommunityShare = rdcRevenue.reduce((sum, r) => sum + r.communityShare, 0);
  const totalBeneficiaries = selectedRDC.communities.length * 800; // Estimated

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h4" gutterBottom>
        Rural District Council Portal
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Community interface for tracking revenue accruals, benefit sharing, and project impacts on traditional lands.
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

      {/* RDC Selector */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Select Rural District Council
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {mockRDCs.map((rdc) => (
            <Button
              key={rdc.id}
              variant={selectedRDC.id === rdc.id ? "contained" : "outlined"}
              onClick={() => setSelectedRDC(rdc)}
            >
              {rdc.name}
            </Button>
          ))}
        </Box>
      </Paper>

      {/* RDC Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6">{selectedRDC.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedRDC.district} District, {selectedRDC.province}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Communities:</strong> {selectedRDC.communities.join(", ")}
                </Typography>
                <Typography variant="body2">
                  <strong>Land Area:</strong> {selectedRDC.totalLandArea.toLocaleString()} ha
                </Typography>
                <Typography variant="body2">
                  <strong>Forest Cover:</strong> {selectedRDC.forestCoverPercent}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: "center" }}>
                      <Typography variant="h4" color="success.main">
                        ${(totalRevenue / 1000).toFixed(0)}k
                      </Typography>
                      <Typography variant="caption">Total Revenue</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: "center" }}>
                      <Typography variant="h4" color="primary.main">
                        ${(totalCommunityShare / 1000).toFixed(0)}k
                      </Typography>
                      <Typography variant="caption">Community Share</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: "center" }}>
                      <Typography variant="h4">{totalBeneficiaries.toLocaleString()}</Typography>
                      <Typography variant="caption">Beneficiaries</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: "center" }}>
                      <Typography variant="h4">{selectedRDC.activeProjects}</Typography>
                      <Typography variant="caption">Active Projects</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Revenue Accruals" icon={<AccountBalance />} iconPosition="start" />
          <Tab label="Community Benefits" icon={<People />} iconPosition="start" />
          <Tab label="Grievances" icon={<Warning />} iconPosition="start" />
          <Tab label="Project Impact" icon={<Forest />} iconPosition="start" />
        </Tabs>

        {/* Revenue Accruals Tab */}
        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" gutterBottom>
            Revenue Distribution History
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Transparent tracking of carbon credit revenue sharing as per the agreed benefit-sharing mechanism.
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell align="right">Total Revenue</TableCell>
                  <TableCell align="right">Community (35%)</TableCell>
                  <TableCell align="right">RDC (15%)</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rdcRevenue.map((rev) => (
                  <TableRow key={rev.id}>
                    <TableCell>
                      <Typography fontWeight="medium">{rev.projectName}</Typography>
                    </TableCell>
                    <TableCell>{rev.period}</TableCell>
                    <TableCell align="right">${rev.totalRevenue.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ color: "success.main" }}>
                      ${rev.communityShare.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">${rev.rdcShare.toLocaleString()}</TableCell>
                    <TableCell>{getStatusChip(rev.status)}</TableCell>
                    <TableCell>{rev.paymentDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Alert severity="info" sx={{ mt: 3 }}>
            <strong>Benefit Sharing Formula:</strong> Community (35%), RDC (15%), Project Developer (40%), 
            Verification & Admin (10%)
          </Alert>
        </TabPanel>

        {/* Community Benefits Tab */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Community Benefit Projects
          </Typography>

          <Grid container spacing={3}>
            {rdcBenefits.map((benefit) => (
              <Grid item xs={12} md={6} key={benefit.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                      <Typography variant="h6">{benefit.benefitType}</Typography>
                      {getStatusChip(benefit.status)}
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {benefit.description}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Community
                        </Typography>
                        <Typography variant="body2">{benefit.community}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Investment
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          ${benefit.amount.toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                    {benefit.completionDate && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                        Completed: {benefit.completionDate}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Grievances Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6">Community Grievances</Typography>
            <Button
              variant="contained"
              onClick={() => setGrievanceDialogOpen(true)}
            >
              Submit Grievance
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Community</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Resolution</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rdcGrievances.map((grievance) => (
                  <TableRow key={grievance.id}>
                    <TableCell>{grievance.id}</TableCell>
                    <TableCell>{grievance.community}</TableCell>
                    <TableCell>
                      <Chip
                        label={grievance.category.replace("_", " ")}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{grievance.description}</TableCell>
                    <TableCell>{grievance.submittedDate}</TableCell>
                    <TableCell>{getStatusChip(grievance.status)}</TableCell>
                    <TableCell>
                      {grievance.resolution || (
                        <Typography variant="caption" color="text.secondary">
                          Pending
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Alert severity="info" sx={{ mt: 3 }}>
            Grievances are reviewed by the Community Grievance Redress Committee within 21 days of submission.
          </Alert>
        </TabPanel>

        {/* Project Impact Tab */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" gutterBottom>
            Environmental & Social Impact
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Forest Conservation
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Current Forest Cover: {selectedRDC.forestCoverPercent}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={selectedRDC.forestCoverPercent}
                      color="success"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Baseline (2020): 62% | Change: +6%
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2">
                    <strong>CO₂ Sequestered:</strong> 125,000 tCO2e
                  </Typography>
                  <Typography variant="body2">
                    <strong>Deforestation Alerts:</strong> 0 (last 90 days)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Livelihood Improvements
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Direct Employment"
                        secondary="45 community members employed as forest monitors"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Alternative Livelihoods"
                        secondary="Beekeeping (120 hives), Ecotourism (3 sites)"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Capacity Building"
                        secondary="85 people trained in sustainable agriculture"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Revenue Utilization (2026)
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={6} md={3}>
                      <Typography variant="h6" color="primary">35%</Typography>
                      <Typography variant="body2">Education</Typography>
                      <Typography variant="caption" color="text.secondary">
                        School infrastructure, scholarships
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="h6" color="primary">25%</Typography>
                      <Typography variant="body2">Healthcare</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Clinic services, medical supplies
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="h6" color="primary">20%</Typography>
                      <Typography variant="body2">Infrastructure</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Roads, water supply, energy
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="h6" color="primary">20%</Typography>
                      <Typography variant="body2">Administration</Typography>
                      <Typography variant="caption" color="text.secondary">
                        RDC operations, grievance handling
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Submit Grievance Dialog */}
      <Dialog
        open={grievanceDialogOpen}
        onClose={() => setGrievanceDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Submit Community Grievance</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            label="Community"
            value={grievanceCommunity}
            onChange={(e) => setGrievanceCommunity(e.target.value)}
            SelectProps={{ native: true }}
            sx={{ mb: 2, mt: 1 }}
          >
            <option value="">Select community...</option>
            {selectedRDC.communities.map((comm) => (
              <option key={comm} value={comm}>
                {comm}
              </option>
            ))}
          </TextField>
          <TextField
            fullWidth
            select
            label="Category"
            value={grievanceCategory}
            onChange={(e) => setGrievanceCategory(e.target.value)}
            SelectProps={{ native: true }}
            sx={{ mb: 2 }}
          >
            <option value="">Select category...</option>
            <option value="benefit_sharing">Benefit Sharing</option>
            <option value="project_boundary">Project Boundary</option>
            <option value="environmental_impact">Environmental Impact</option>
            <option value="community_participation">Community Participation</option>
            <option value="revenue_distribution">Revenue Distribution</option>
            <option value="other">Other</option>
          </TextField>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Description"
            value={grievanceDescription}
            onChange={(e) => setGrievanceDescription(e.target.value)}
            placeholder="Please describe your concern in detail..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGrievanceDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitGrievance}
            disabled={loading || !grievanceCommunity || !grievanceCategory || !grievanceDescription}
          >
            {loading ? "Submitting..." : "Submit Grievance"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
