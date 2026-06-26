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
  Stepper,
  Step,
  StepLabel,
  Paper,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Sensors,
  Psychology,
  AccountBalanceWallet,
  Gavel,
  Store,
  CheckCircle,
  Warning,
  Error,
  Visibility,
  PlayArrow,
  Pause,
  Refresh,
} from "@mui/icons-material";

// ITMO Issuance 5-Step Workflow Steps
const WORKFLOW_STEPS = [
  {
    label: "IoT/MRV Input",
    description: "Sensor data enters MRV system",
    icon: Sensors,
  },
  {
    label: "AI Processing",
    description: "AI validates data against SI 48 baseline",
    icon: Psychology,
  },
  {
    label: "Registry Minting",
    description: "ZCR mints serialized credits on blockchain",
    icon: AccountBalanceWallet,
  },
  {
    label: "Authorization",
    description: "ZiCMA e-signature for Article 6",
    icon: Gavel,
  },
  {
    label: "Market Listing",
    description: "Authorized ITMOs appear on marketplace",
    icon: Store,
  },
];

// Mock sensor data
const mockSensorData = [
  {
    id: "iot-001",
    sensorId: "KRB-FOREST-01",
    location: "Kariba North Sector A",
    type: "Forest Cover",
    reading: "67.3% canopy coverage",
    timestamp: "2026-06-21T08:00:00Z",
    status: "valid",
  },
  {
    id: "iot-002",
    sensorId: "KRB-FOREST-02",
    location: "Kariba North Sector B",
    type: "Biomass",
    reading: "142.5 tC/ha",
    timestamp: "2026-06-21T08:15:00Z",
    status: "valid",
  },
  {
    id: "iot-003",
    sensorId: "KRB-FOREST-03",
    location: "Kariba Buffer Zone",
    type: "Deforestation Alert",
    reading: "No change detected",
    timestamp: "2026-06-21T08:30:00Z",
    status: "valid",
  },
];

// Mock AI validation results
const mockAIValidation = {
  baseline_compliance: 94,
  additionality_score: 87,
  permanence_risk: "low",
  leakage_detected: false,
  si_48_compliance: true,
  validation_notes: [
    "Forest cover exceeds baseline by 3.2%",
    "No significant leakage detected in 50km buffer",
    "Community monitoring reports verified",
    "Satellite imagery confirms conservation",
  ],
};

// Mock blockchain minting result
const mockMintingResult = {
  serial_numbers: [
    "ZAI-2024-KRB-A7B3C9D2E1F0",
    "ZAI-2024-KRB-B8C4D0E2F1A9",
    "ZAI-2024-KRB-C9D5E1F3A0B8",
    "ZAI-2024-KRB-D0E6F2A4B9C1",
    "ZAI-2024-KRB-E1F7A3B5C0D2",
  ],
  blockchain_tx: "0x7f8e9d...a1b2c3d4",
  minted_by: "ZCR",
  timestamp: "2026-06-21T09:00:00Z",
  total_credits: 5000,
};

// Mock authorization
const mockAuthorization = {
  authorization_id: "LoA-2026-0042",
  status: "approved",
  authorized_by: "ZiCMA",
  authorized_at: "2026-06-21T10:30:00Z",
  buyer_country: "Germany",
  purpose: "NDC Compliance",
  conditions: [
    "Transfer within 12 months",
    "Annual reporting to ZiCMA",
    "Corresponding adjustment applied",
  ],
  digital_signature: "0x9e8d7c...b4a3f2e1",
};

export default function ITMOIssuanceWorkflow() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Workflow data states
  const [sensorData] = useState(mockSensorData);
  const [aiValidation] = useState(mockAIValidation);
  const [mintingResult] = useState(mockMintingResult);
  const [authorization] = useState(mockAuthorization);

  // Dialog states
  const [showLeakageReport, setShowLeakageReport] = useState(false);
  const [showPriceForecast, setShowPriceForecast] = useState(false);
  const [showLegalAudit, setShowLegalAudit] = useState(false);

  const handleNext = () => {
    setLoading(true);
    setTimeout(() => {
      setActiveStep((prev) => Math.min(prev + 1, 4));
      setLoading(false);
      setSuccess(`Step ${activeStep + 1} completed successfully`);
    }, 1500);
  };

  const handleReset = () => {
    setActiveStep(0);
    setError(null);
    setSuccess(null);
  };

  const getStepStatus = (step: number) => {
    if (step < activeStep) return "completed";
    if (step === activeStep) return "active";
    return "pending";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "valid":
      case "approved":
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "rejected":
      case "error":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h4" gutterBottom>
        ITMO Issuance Workflow
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        End-to-end process for issuing Internationally Transferred Mitigation Outcomes
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

      {/* AI Tools Quick Access */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Advanced AI Tools
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Visibility />}
            onClick={() => setShowLeakageReport(true)}
          >
            Leakage Detection
          </Button>
          <Button
            variant="outlined"
            startIcon={<TrendingUpIcon />}
            onClick={() => setShowPriceForecast(true)}
          >
            Price Forecast
          </Button>
          <Button
            variant="outlined"
            startIcon={<Gavel />}
            onClick={() => setShowLegalAudit(true)}
          >
            Legal Audit
          </Button>
        </Box>
      </Paper>

      {/* Main Stepper */}
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {WORKFLOW_STEPS.map((step, index) => (
          <Step key={step.label}>
            <StepLabel
              StepIconComponent={() => (
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor:
                      index <= activeStep ? "primary.main" : "grey.300",
                    color: index <= activeStep ? "white" : "grey.600",
                  }}
                >
                  <step.icon fontSize="small" />
                </Box>
              )}
            >
              <Typography variant="caption" display="block">
                {step.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {step.description}
              </Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step Content */}
      <Paper sx={{ mb: 3 }}>
        {/* Step 1: IoT/MRV Input */}
        {activeStep === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Step 1: IoT/MRV Data Input
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Sensor data from project sites is automatically ingested into the MRV system.
            </Typography>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Sensor ID</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Reading</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sensorData.map((sensor) => (
                    <TableRow key={sensor.id}>
                      <TableCell>{sensor.sensorId}</TableCell>
                      <TableCell>{sensor.location}</TableCell>
                      <TableCell>{sensor.type}</TableCell>
                      <TableCell>{sensor.reading}</TableCell>
                      <TableCell>
                        <Chip
                          label={sensor.status.toUpperCase()}
                          color={getStatusColor(sensor.status) as any}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Alert severity="info" sx={{ mt: 2 }}>
              All sensor readings validated and within expected parameters. Ready for AI processing.
            </Alert>
          </Box>
        )}

        {/* Step 2: AI Processing */}
        {activeStep === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Step 2: AI Validation & Processing
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              AI validates MRV data against SI 48 baseline and checks for leakage.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Validation Scores
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption">Baseline Compliance</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={aiValidation.baseline_compliance}
                        color="success"
                      />
                      <Typography variant="caption">{aiValidation.baseline_compliance}%</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption">Additionality Score</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={aiValidation.additionality_score}
                        color="success"
                      />
                      <Typography variant="caption">{aiValidation.additionality_score}%</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption">SI 48 Compliance</Typography>
                      <Chip
                        label={aiValidation.si_48_compliance ? "COMPLIANT" : "NON-COMPLIANT"}
                        color={aiValidation.si_48_compliance ? "success" : "error"}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      AI Validation Notes
                    </Typography>
                    <List dense>
                      {aiValidation.validation_notes.map((note, idx) => (
                        <ListItem key={idx}>
                          <CheckCircle color="success" fontSize="small" sx={{ mr: 1 }} />
                          <ListItemText primary={note} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Alert severity="success" sx={{ mt: 2 }}>
              AI validation passed! Credits ready for minting on blockchain.
            </Alert>
          </Box>
        )}

        {/* Step 3: Registry Minting */}
        {activeStep === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Step 3: ZCR Registry Minting
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Zimbabwe Carbon Registry mints serialized credits on Hyperledger Fabric blockchain.
            </Typography>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Blockchain Transaction
                    </Typography>
                    <Typography variant="body2" fontFamily="monospace">
                      {mintingResult.blockchain_tx}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Total Credits Minted
                    </Typography>
                    <Typography variant="h6">
                      {mintingResult.total_credits.toLocaleString()} tCO2e
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Minted By
                    </Typography>
                    <Typography variant="body2">{mintingResult.minted_by}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Timestamp
                    </Typography>
                    <Typography variant="body2">
                      {new Date(mintingResult.timestamp).toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Typography variant="subtitle2" gutterBottom>
              Generated Serial Numbers
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Serial Number</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mintingResult.serial_numbers.map((sn, idx) => (
                    <TableRow key={sn}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace" }}>{sn}</TableCell>
                      <TableCell>
                        <Chip label="MINTED" color="success" size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Step 4: Authorization */}
        {activeStep === 3 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Step 4: Article 6 Authorization (ZiCMA)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              ZiCMA reviews and authorizes ITMO transfer with digital signature.
            </Typography>

            <Card>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">
                      Authorization ID
                    </Typography>
                    <Typography variant="h6">{authorization.authorization_id}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={authorization.status.toUpperCase()}
                      color="success"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">
                      Authorized By
                    </Typography>
                    <Typography variant="body2">{authorization.authorized_by}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">
                      Buyer Country
                    </Typography>
                    <Typography variant="body2">{authorization.buyer_country}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Digital Signature
                    </Typography>
                    <Typography variant="body2" fontFamily="monospace">
                      {authorization.digital_signature}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Authorization Conditions
                </Typography>
                <List dense>
                  {authorization.conditions.map((condition, idx) => (
                    <ListItem key={idx}>
                      <ListItemText primary={`${idx + 1}. ${condition}`} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            <Alert severity="success" sx={{ mt: 2 }}>
              ITMO authorized! Credits ready for marketplace listing.
            </Alert>
          </Box>
        )}

        {/* Step 5: Market Listing */}
        {activeStep === 4 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Step 5: Marketplace Listing
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Authorized ITMOs are now listed on the marketplace for international buyers.
            </Typography>

            <Card>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="caption" color="text.secondary">
                      Listed Credits
                    </Typography>
                    <Typography variant="h4">5,000</Typography>
                    <Typography variant="caption">tCO2e</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="caption" color="text.secondary">
                      Listing Price
                    </Typography>
                    <Typography variant="h4">$14.50</Typography>
                    <Typography variant="caption">per tCO2e</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="caption" color="text.secondary">
                      Market Status
                    </Typography>
                    <Chip label="ACTIVE" color="success" />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  ITMO Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Project:</strong> Kariba REDD+ Forest Conservation
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Vintage:</strong> 2024
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Standard:</strong> VCS + CCB
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>ITMO Status:</strong> Authorized for Germany
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Alert severity="success" sx={{ mt: 2 }}>
              ITMO issuance workflow complete! Credits are now available for international transfer.
            </Alert>
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ p: 3, display: "flex", justifyContent: "space-between" }}>
          <Button
            variant="outlined"
            onClick={handleReset}
            disabled={loading || activeStep === 0}
          >
            Reset Workflow
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading || activeStep === 4}
            endIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
          >
            {activeStep === 4 ? "Complete" : "Next Step"}
          </Button>
        </Box>
      </Paper>

      {/* AI Tool Dialogs */}
      <Dialog
        open={showLeakageReport}
        onClose={() => setShowLeakageReport(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Leakage Detection Report</DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            No significant leakage detected in 50km buffer zone around project.
          </Alert>
          <Typography variant="body2">
            AI analysis of land use data shows stable forest cover in surrounding areas.
            Risk level: LOW. Continue standard monitoring.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLeakageReport(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showPriceForecast}
        onClose={() => setShowPriceForecast(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Price Forecast (ML Model)</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Fair Value Estimate
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption">Current Market</Typography>
              <Typography variant="h5">$18.75/tCO2e</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption">Fair Value</Typography>
              <Typography variant="h5" color="success.main">$19.20/tCO2e</Typography>
            </Grid>
          </Grid>
          <Alert severity="info" sx={{ mt: 2 }}>
            Recommendation: HOLD - Fair value aligned with market. Monitor for opportunities.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPriceForecast(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showLegalAudit}
        onClose={() => setShowLegalAudit(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Legal Audit - Article 6.2 Agreement</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Compliance Score: 75/100
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Recommendation: APPROVE WITH REVISIONS
          </Alert>
          <Typography variant="body2">
            Key findings: Clause 4 (Dispute Resolution) requires revision to align with
            Zimbabwe court jurisdiction requirements. All other clauses compliant with SI 48 of 2025.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLegalAudit(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Helper icon component
function TrendingUpIcon(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24">
      <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
    </svg>
  );
}

// CircularProgress component for loading state
function CircularProgress(props: { size: number }) {
  return (
    <Box
      sx={{
        width: props.size,
        height: props.size,
        borderRadius: "50%",
        border: "2px solid",
        borderColor: "primary.main",
        borderTopColor: "transparent",
        animation: "spin 1s linear infinite",
        "@keyframes spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      }}
    />
  );
}
