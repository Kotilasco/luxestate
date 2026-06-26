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
  Divider,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  ExpandMore,
  ShoppingCart,
  Verified,
  TrendingUp,
  Assessment,
  CheckCircle,
  Warning,
  Public,
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
const mockITMOListings = [
  {
    id: "itmo-001",
    projectName: "Kariba REDD+ Forest Conservation",
    projectType: "Forestry",
    vintage: 2024,
    quantity: 10000,
    pricePerUnit: 12.5,
    verificationStandard: "VCS",
    aiIntegrityScore: 94,
    location: "Kariba, Zimbabwe",
    registryId: "VCS-VCU-1523",
    correspondingAdjustment: true,
  },
  {
    id: "itmo-002",
    projectName: "Hwange Solar Farm Phase 1",
    projectType: "Renewable Energy",
    vintage: 2025,
    quantity: 5000,
    pricePerUnit: 8.75,
    verificationStandard: "Gold Standard",
    aiIntegrityScore: 91,
    location: "Hwange, Zimbabwe",
    registryId: "GS-GS-4521",
    correspondingAdjustment: true,
  },
  {
    id: "itmo-003",
    projectName: "Chipinge Smallholder Agroforestry",
    projectType: "Agriculture",
    vintage: 2024,
    quantity: 3500,
    pricePerUnit: 15.0,
    verificationStandard: "VCS",
    aiIntegrityScore: 88,
    location: "Chipinge, Zimbabwe",
    registryId: "VCS-VCU-1847",
    correspondingAdjustment: true,
  },
];

const mockPurchases = [
  {
    id: "pur-001",
    projectName: "Kariba REDD+ Forest Conservation",
    quantity: 5000,
    pricePerUnit: 12.5,
    totalCost: 62500,
    purchaseDate: "2026-06-10",
    status: "retired",
    retirementPurpose: "NDC Compliance",
    serialNumbers: ["ZAI-2024-A7B3C9D2E1F0", "ZAI-2024-B8C4D0E2F1A9"],
  },
  {
    id: "pur-002",
    projectName: "Hwange Solar Farm Phase 1",
    quantity: 2000,
    pricePerUnit: 8.75,
    totalCost: 17500,
    purchaseDate: "2026-06-15",
    status: "held",
    serialNumbers: ["ZAI-2025-C9D5E1F3A0B8"],
  },
];

const mockAIAnalysis = {
  overallScore: 91,
  categories: [
    { name: "Additionality", score: 94, status: "strong" },
    { name: "Permanence", score: 89, status: "good" },
    { name: "Monitoring", score: 92, status: "strong" },
    { name: "Co-benefits", score: 88, status: "good" },
    { name: "Verification", score: 95, status: "strong" },
  ],
  riskFactors: [
    { factor: "Reversal risk", level: "low", description: "Strong legal protections in place" },
    { factor: "Over-crediting", level: "low", description: "Conservative baseline methodology" },
    { factor: "Leakage", level: "medium", description: "Some activity displacement detected" },
  ],
  satelliteVerification: {
    lastScan: "2026-06-18",
    forestCoverChange: "+2.3%",
    deforestationAlerts: 0,
    confidence: 96,
  },
};

const purchaseSteps = [
  "Browse ITMOs",
  "AI Integrity Check",
  "Request LoA",
  "Purchase & Transfer",
  "Retire Credits",
];

export default function CorporateBuyerPortal() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Purchase flow state
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedITMO, setSelectedITMO] = useState<any>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState("");
  const [activeStep, setActiveStep] = useState(0);

  // Retirement state
  const [retireDialogOpen, setRetireDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [retirementPurpose, setRetirementPurpose] = useState("ndc_compliance");
  const [complianceYear, setComplianceYear] = useState("2026");

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError(null);
    setSuccess(null);
  };

  const handlePurchase = async () => {
    setLoading(true);
    setTimeout(() => {
      setSuccess(`Successfully purchased ${purchaseQuantity} ITMOs from ${selectedITMO.projectName}`);
      setPurchaseDialogOpen(false);
      setLoading(false);
      setActiveStep(0);
    }, 1500);
  };

  const handleRetire = async () => {
    setLoading(true);
    setTimeout(() => {
      setSuccess(`Credits retired successfully for ${retirementPurpose}`);
      setRetireDialogOpen(false);
      setLoading(false);
    }, 1500);
  };

  const getStatusChip = (status: string) => {
    const colors: Record<string, any> = {
      held: "info",
      retired: "success",
      transferred: "warning",
      pending: "default",
    };
    return (
      <Chip
        label={status.toUpperCase()}
        color={colors[status] || "default"}
        size="small"
      />
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "success";
    if (score >= 75) return "warning";
    return "error";
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h4" gutterBottom>
        Corporate Buyer Portal
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Purchase ITMOs (Internationally Transferred Mitigation Outcomes) with AI-verified environmental integrity.
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
          <Tab label="Browse ITMOs" icon={<Public />} iconPosition="start" />
          <Tab label="AI Integrity Dashboard" icon={<Verified />} iconPosition="start" />
          <Tab label="My Portfolio" icon={<Assessment />} iconPosition="start" />
        </Tabs>

        {/* Browse ITMOs Tab */}
        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" gutterBottom>
            Available ITMOs for Purchase
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            All credits are verified under Article 6 of the Paris Agreement with corresponding adjustments.
          </Typography>

          <Grid container spacing={3}>
            {mockITMOListings.map((itmo) => (
              <Grid item xs={12} md={6} key={itmo.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                      <Typography variant="h6">{itmo.projectName}</Typography>
                      <Chip
                        label={itmo.verificationStandard}
                        color="primary"
                        size="small"
                      />
                    </Box>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Project Type
                        </Typography>
                        <Typography variant="body2">{itmo.projectType}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Location
                        </Typography>
                        <Typography variant="body2">{itmo.location}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Vintage
                        </Typography>
                        <Typography variant="body2">{itmo.vintage}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Available
                        </Typography>
                        <Typography variant="body2">
                          {itmo.quantity.toLocaleString()} tCO2e
                        </Typography>
                      </Grid>
                    </Grid>

                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Typography variant="caption" sx={{ mr: 1 }}>
                        AI Integrity Score:
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={itmo.aiIntegrityScore}
                        color={getScoreColor(itmo.aiIntegrityScore)}
                        sx={{ width: 100, mr: 1 }}
                      />
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color={`${getScoreColor(itmo.aiIntegrityScore)}.main`}
                      >
                        {itmo.aiIntegrityScore}/100
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="h6" color="primary">
                        ${itmo.pricePerUnit}/tCO2e
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<ShoppingCart />}
                        onClick={() => {
                          setSelectedITMO(itmo);
                          setPurchaseDialogOpen(true);
                        }}
                      >
                        Purchase
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* AI Integrity Dashboard Tab */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            AI Environmental Integrity Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Real-time AI analysis of credit quality across all projects. Powered by satellite monitoring and ML models.
          </Typography>

          <Grid container spacing={3}>
            {/* Overall Score */}
            <Grid item xs={12} md={4}>
              <Card sx={{ textAlign: "center", p: 3 }}>
                <Typography variant="h2" color="success.main">
                  {mockAIAnalysis.overallScore}
                </Typography>
                <Typography variant="h6">Overall Integrity Score</Typography>
                <Typography variant="caption" color="text.secondary">
                  Average across all projects
                </Typography>
              </Card>
            </Grid>

            {/* Category Scores */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quality Categories
                  </Typography>
                  {mockAIAnalysis.categories.map((cat) => (
                    <Box key={cat.name} sx={{ mb: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2">{cat.name}</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {cat.score}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={cat.score}
                        color={getScoreColor(cat.score)}
                      />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>

            {/* Risk Factors */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Risk Assessment
                  </Typography>
                  <List>
                    {mockAIAnalysis.riskFactors.map((risk) => (
                      <ListItem key={risk.factor}>
                        <ListItemText
                          primary={risk.factor}
                          secondary={risk.description}
                        />
                        <Chip
                          label={risk.level.toUpperCase()}
                          color={
                            risk.level === "low"
                              ? "success"
                              : risk.level === "medium"
                              ? "warning"
                              : "error"
                          }
                          size="small"
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Satellite Verification */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Satellite Verification
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Last Scan
                      </Typography>
                      <Typography variant="body1">
                        {mockAIAnalysis.satelliteVerification.lastScan}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Forest Cover Change
                      </Typography>
                      <Typography variant="body1" color="success.main">
                        {mockAIAnalysis.satelliteVerification.forestCoverChange}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Deforestation Alerts
                      </Typography>
                      <Typography variant="body1" color="success.main">
                        {mockAIAnalysis.satelliteVerification.deforestationAlerts}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        AI Confidence
                      </Typography>
                      <Typography variant="body1">
                        {mockAIAnalysis.satelliteVerification.confidence}%
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* My Portfolio Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            My ITMO Portfolio
          </Typography>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">Total Holdings</Typography>
                  <Typography variant="h4">
                    {mockPurchases.reduce((sum, p) => sum + p.quantity, 0).toLocaleString()}
                  </Typography>
                  <Typography variant="caption">tCO2e</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">Total Invested</Typography>
                  <Typography variant="h4">
                    ${mockPurchases.reduce((sum, p) => sum + p.totalCost, 0).toLocaleString()}
                  </Typography>
                  <Typography variant="caption">USD</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">Retired</Typography>
                  <Typography variant="h4">
                    {mockPurchases
                      .filter((p) => p.status === "retired")
                      .reduce((sum, p) => sum + p.quantity, 0)
                      .toLocaleString()}
                  </Typography>
                  <Typography variant="caption">tCO2e</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">Available</Typography>
                  <Typography variant="h4">
                    {mockPurchases
                      .filter((p) => p.status === "held")
                      .reduce((sum, p) => sum + p.quantity, 0)
                      .toLocaleString()}
                  </Typography>
                  <Typography variant="caption">tCO2e</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Price/Unit</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockPurchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      <Typography fontWeight="medium">{purchase.projectName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {purchase.id}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {purchase.quantity.toLocaleString()} tCO2e
                    </TableCell>
                    <TableCell align="right">${purchase.pricePerUnit}</TableCell>
                    <TableCell align="right">${purchase.totalCost.toLocaleString()}</TableCell>
                    <TableCell>{getStatusChip(purchase.status)}</TableCell>
                    <TableCell>
                      {purchase.status === "held" && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setSelectedPurchase(purchase);
                            setRetireDialogOpen(true);
                          }}
                        >
                          Retire
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Purchase Dialog */}
      <Dialog
        open={purchaseDialogOpen}
        onClose={() => setPurchaseDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Purchase ITMOs</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {purchaseSteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {selectedITMO && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6">{selectedITMO.projectName}</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {selectedITMO.registryId} • {selectedITMO.verificationStandard}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Location:</strong> {selectedITMO.location}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Vintage:</strong> {selectedITMO.vintage}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Available:</strong> {selectedITMO.quantity.toLocaleString()} tCO2e
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Quantity to Purchase (tCO2e)"
                  value={purchaseQuantity}
                  onChange={(e) => setPurchaseQuantity(e.target.value)}
                  sx={{ mb: 2 }}
                />
                {purchaseQuantity && (
                  <>
                    <Typography variant="body2">
                      <strong>Price:</strong> ${selectedITMO.pricePerUnit}/tCO2e
                    </Typography>
                    <Typography variant="h6" color="primary">
                      Total: ${(Number(purchaseQuantity) * selectedITMO.pricePerUnit).toLocaleString()}
                    </Typography>
                  </>
                )}
              </Grid>
            </Grid>
          )}

          <Alert severity="info" sx={{ mt: 3 }}>
            This purchase requires a Letter of Authorization (LoA) under Article 6. 
            The application will be submitted to ZiCMA automatically.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPurchaseDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handlePurchase}
            disabled={loading || !purchaseQuantity}
          >
            {loading ? "Processing..." : "Proceed to Payment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Retirement Dialog */}
      <Dialog open={retireDialogOpen} onClose={() => setRetireDialogOpen(false)}>
        <DialogTitle>Retire Credits</DialogTitle>
        <DialogContent>
          {selectedPurchase && (
            <>
              <Typography gutterBottom>
                Retiring {selectedPurchase.quantity.toLocaleString()} tCO2e from{" "}
                {selectedPurchase.projectName}
              </Typography>
              <TextField
                fullWidth
                select
                label="Retirement Purpose"
                value={retirementPurpose}
                onChange={(e) => setRetirementPurpose(e.target.value)}
                SelectProps={{ native: true }}
                sx={{ mb: 2 }}
              >
                <option value="ndc_compliance">NDC Compliance</option>
                <option value="corsia">CORSIA Compliance</option>
                <option value="net_zero">Net Zero Claim</option>
                <option value="carbon_neutral">Carbon Neutral Claim</option>
              </TextField>
              <TextField
                fullWidth
                label="Compliance Year"
                value={complianceYear}
                onChange={(e) => setComplianceYear(e.target.value)}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRetireDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleRetire}
            disabled={loading}
          >
            {loading ? "Processing..." : "Confirm Retirement"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
