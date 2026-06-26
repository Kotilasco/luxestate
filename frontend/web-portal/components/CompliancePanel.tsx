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
  List,
  ListItem,
  ListItemText,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link,
} from "@mui/material";
import {
  serializeCredits,
  retireCredits,
  getRetirementStatus,
  getUNFile,
  applyForAuthorization,
  getAuthorizationStatus,
  getLOADocument,
  zicmaApproveApplication,
  parisSync,
} from "../services/compliance";

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

const retirementSteps = ["Serialize", "List on Marketplace", "Execute Trade", "Retire on Blockchain", "Generate UN File"];

export default function CompliancePanel() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Serialization State
  const [projectId, setProjectId] = useState("test-project-123");
  const [quantity, setQuantity] = useState(100);
  const [vintageYear, setVintageYear] = useState(2024);
  const [serialNumbers, setSerialNumbers] = useState<string[]>([]);
  const [blockchainTx, setBlockchainTx] = useState("");

  // Retirement State
  const [retireSerials, setRetireSerials] = useState("");
  const [buyerId, setBuyerId] = useState("buyer-123");
  const [purpose, setPurpose] = useState<"ndc_compliance" | "voluntary" | "corsia">("ndc_compliance");
  const [retirementResult, setRetirementResult] = useState<any>(null);

  // Authorization State
  const [authProjectId, setAuthProjectId] = useState("test-project-123");
  const [authQuantity, setAuthQuantity] = useState(1000);
  const [buyerCountry, setBuyerCountry] = useState("Germany");
  const [authPurpose, setAuthPurpose] = useState("Article 6.2 bilateral transfer");
  const [applicationResult, setApplicationResult] = useState<any>(null);
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [loaDocument, setLoaDocument] = useState<any>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError(null);
    setSuccess(null);
  };

  const handleSerialize = async () => {
    setLoading(true);
    try {
      const result = await serializeCredits(projectId, quantity, vintageYear);
      setSerialNumbers(result.serial_numbers);
      setBlockchainTx(result.blockchain_tx_hash);
      setSuccess(`Serialized ${quantity} credits with blockchain confirmation`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetire = async () => {
    setLoading(true);
    try {
      const serials = retireSerials.split(",").map((s) => s.trim()).filter(Boolean);
      if (serials.length === 0 && serialNumbers.length > 0) {
        serials.push(serialNumbers[0]);
      }
      const result = await retireCredits(serials, buyerId, purpose, true);
      setRetirementResult(result);
      setSuccess(`Credits retired successfully! ZCR ID: ${result.zcr_retirement_id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyForAuthorization = async () => {
    setLoading(true);
    try {
      const result = await applyForAuthorization(
        authProjectId,
        "applicant-123",
        authQuantity,
        buyerCountry,
        authPurpose
      );
      setApplicationResult(result);
      setSuccess(`Application submitted! ID: ${result.application_id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAuthStatus = async () => {
    if (!applicationResult) return;
    setLoading(true);
    try {
      const status = await getAuthorizationStatus(applicationResult.application_id);
      setAuthStatus(status);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleZiCMADecision = async (decision: "approve" | "reject") => {
    if (!applicationResult) return;
    setLoading(true);
    try {
      const result = await zicmaApproveApplication(
        applicationResult.application_id,
        decision,
        authQuantity,
        ["Transfer within 12 months", "Report annually to ZiCMA"],
        decision === "approve" ? "Application meets all requirements" : "Insufficient documentation"
      );
      setAuthStatus(result);
      setSuccess(`Application ${decision}d successfully!`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGetLOA = async () => {
    if (!applicationResult) return;
    setLoading(true);
    try {
      const loa = await getLOADocument(applicationResult.application_id);
      setLoaDocument(loa);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h5" gutterBottom>
        Regulatory Compliance & Double Counting Prevention
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Serialization & Retirement" />
          <Tab label="Article 6 Authorization" />
          <Tab label="Paris Agreement Sync" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ m: 2 }}>
            {success}
          </Alert>
        )}

        {/* Serialization & Retirement Tab */}
        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" gutterBottom>
            Credit Serialization & Retirement
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Serialize credits with unique identifiers, retire them on blockchain upon sale, and generate UN reporting files.
          </Typography>

          <Stepper activeStep={serialNumbers.length > 0 ? 1 : 0} sx={{ mb: 4 }}>
            {retirementSteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Grid container spacing={3}>
            {/* Serialization */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    1. Serialize Credits
                  </Typography>
                  <TextField
                    fullWidth
                    label="Project ID"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    type="number"
                    label="Quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    type="number"
                    label="Vintage Year"
                    value={vintageYear}
                    onChange={(e) => setVintageYear(Number(e.target.value))}
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSerialize}
                    disabled={loading}
                    fullWidth
                  >
                    Generate Serial Numbers
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Results */}
            <Grid item xs={12} md={6}>
              {serialNumbers.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Generated Serial Numbers
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                      Blockchain TX: {blockchainTx.substring(0, 20)}...
                    </Typography>
                    <List dense sx={{ maxHeight: 200, overflow: "auto" }}>
                      {serialNumbers.slice(0, 10).map((serial, i) => (
                        <ListItem key={i}>
                          <ListItemText primary={serial} />
                        </ListItem>
                      ))}
                      {serialNumbers.length > 10 && (
                        <ListItem>
                          <ListItemText primary={`... and ${serialNumbers.length - 10} more`} />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* Retirement */}
          <Typography variant="h6" gutterBottom>
            4. Retire Credits (Post-Trade)
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Serial Numbers (comma-separated)"
                placeholder={serialNumbers.length > 0 ? serialNumbers[0] : "ZAI-2024-..."}
                value={retireSerials}
                onChange={(e) => setRetireSerials(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Buyer ID"
                value={buyerId}
                onChange={(e) => setBuyerId(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleRetire}
                disabled={loading}
                fullWidth
              >
                Retire Credits
              </Button>
            </Grid>
          </Grid>

          {retirementResult && (
            <Card sx={{ mt: 3, bgcolor: "success.light" }}>
              <CardContent>
                <Typography variant="h6">Retirement Confirmed</Typography>
                <Typography>Retirement ID: {retirementResult.retirement_id}</Typography>
                <Typography>ZCR Reference: {retirementResult.zcr_retirement_id}</Typography>
                <Typography>Blockchain: {retirementResult.blockchain_confirmation.substring(0, 30)}...</Typography>
                <Link href={retirementResult.un_file_url} target="_blank" sx={{ mt: 1, display: "block" }}>
                  Download UN Reporting File
                </Link>
              </CardContent>
            </Card>
          )}
        </TabPanel>

        {/* Authorization Tab */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Article 6 Authorization Workflow
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Apply for Letters of Authorization (LoA) for ITMO transfers under Article 6 of the Paris Agreement.
          </Typography>

          <Grid container spacing={3}>
            {/* Application Form */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Apply for Authorization
                  </Typography>
                  <TextField
                    fullWidth
                    label="Project ID"
                    value={authProjectId}
                    onChange={(e) => setAuthProjectId(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    type="number"
                    label="Quantity Requested (tCO2e)"
                    value={authQuantity}
                    onChange={(e) => setAuthQuantity(Number(e.target.value))}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Intended Buyer Country"
                    value={buyerCountry}
                    onChange={(e) => setBuyerCountry(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Authorization Purpose"
                    value={authPurpose}
                    onChange={(e) => setAuthPurpose(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleApplyForAuthorization}
                    disabled={loading}
                    fullWidth
                  >
                    Submit Application
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Status & Actions */}
            <Grid item xs={12} md={6}>
              {applicationResult && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Application Status
                    </Typography>
                    <Typography>Application ID: {applicationResult.application_id}</Typography>
                    <Typography>Status: {applicationResult.status}</Typography>
                    <Typography>Estimated Review: {applicationResult.estimated_review_days} days</Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={handleCheckAuthStatus}
                        disabled={loading}
                        sx={{ mr: 1 }}
                      >
                        Check Status
                      </Button>
                      <Button
                        variant="outlined"
                        color="success"
                        onClick={() => handleZiCMADecision("approve")}
                        disabled={loading}
                        sx={{ mr: 1 }}
                      >
                        ZiCMA Approve
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleZiCMADecision("reject")}
                        disabled={loading}
                      >
                        Reject
                      </Button>
                    </Box>

                    {authStatus?.loa_issued && (
                      <Button
                        variant="contained"
                        onClick={handleGetLOA}
                        disabled={loading}
                        fullWidth
                        sx={{ mt: 2 }}
                      >
                        Download LoA
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {loaDocument && (
                <Card sx={{ mt: 2, bgcolor: "info.light" }}>
                  <CardContent>
                    <Typography variant="h6">Letter of Authorization</Typography>
                    <Typography>LoA Number: {loaDocument.loa_number}</Typography>
                    <Typography>Issued By: {loaDocument.issued_by}</Typography>
                    <Typography>Valid Until: {new Date(loaDocument.valid_until).toLocaleDateString()}</Typography>
                    <Link href={loaDocument.document_url} target="_blank" sx={{ mt: 1, display: "block" }}>
                      Download Document
                    </Link>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Paris Sync Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Paris Agreement Registry Sync
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Track ITMO (Internationally Transferred Mitigation Outcomes) status in the Paris Agreement Registry.
          </Typography>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ITMO Tracking Dashboard
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, textAlign: "center" }}>
                    <Typography variant="h3" color="primary">0</Typography>
                    <Typography variant="body2" color="text.secondary">
                      ITMOs Authorized
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, textAlign: "center" }}>
                    <Typography variant="h3" color="success.main">0</Typography>
                    <Typography variant="body2" color="text.secondary">
                      ITMOs Transferred
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, textAlign: "center" }}>
                    <Typography variant="h3" color="warning.main">0</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Transfer
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: 3 }}>
                Last sync with Paris Agreement Registry: {new Date().toLocaleString()}
              </Alert>
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>
    </Box>
  );
}
