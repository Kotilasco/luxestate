"use client";

import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Chip,
  Alert,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  generatePDDDraft,
  analyzeAdditionality,
  startRemoteSensingAnalysis,
  getRemoteSensingStatus,
  PDDDrafResponse,
  AdditionalityResponse,
  RemoteSensingResults,
} from "../services/aiValidation";

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

export default function AIValidationPanel() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PDD Co-Pilot State
  const [pddDescription, setPddDescription] = useState("");
  const [projectType, setProjectType] = useState("forestry");
  const [pddResult, setPddResult] = useState<PDDDrafResponse | null>(null);

  // Additionality State
  const [addDescription, setAddDescription] = useState("");
  const [addResult, setAddResult] = useState<AdditionalityResponse | null>(null);

  // Remote Sensing State
  const [rsProjectId, setRsProjectId] = useState("");
  const [rsStatus, setRsStatus] = useState<string>("");
  const [rsResult, setRsResult] = useState<RemoteSensingResults | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError(null);
  };

  const handleGeneratePDD = async () => {
    if (!pddDescription) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generatePDDDraft(
        "test-project-123",
        pddDescription,
        projectType,
        { district: "Chipinge", province: "Manicaland" }
      );
      setPddResult(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeAdditionality = async () => {
    if (!addDescription) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeAdditionality(
        "test-project-123",
        addDescription,
        projectType,
        { district: "Chipinge", province: "Manicaland" },
        ["High upfront costs", "Long payback period"]
      );
      setAddResult(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRSAnalysis = async () => {
    if (!rsProjectId) return;
    setLoading(true);
    setError(null);
    try {
      const job = await startRemoteSensingAnalysis(
        rsProjectId,
        {
          type: "Polygon",
          coordinates: [[[32.5, -18.5], [32.6, -18.5], [32.6, -18.6], [32.5, -18.6], [32.5, -18.5]]],
        },
        ["forest_cover", "biomass"]
      );
      setRsStatus(`Analysis started: ${job.analysis_id}`);
      
      // Poll for results
      setTimeout(async () => {
        const result = await getRemoteSensingStatus(job.analysis_id);
        if ("carbon_stock_tco2e" in result) {
          setRsResult(result as RemoteSensingResults);
        }
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getConclusionColor = (conclusion: string) => {
    switch (conclusion) {
      case "additional":
        return "success";
      case "not_additional":
        return "error";
      default:
        return "warning";
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h5" gutterBottom>
        AI-Powered Project Validation & MRV
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="PDD Co-Pilot" />
          <Tab label="Additionality Checker" />
          <Tab label="Remote Sensing" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {loading && <LinearProgress />}

        {/* PDD Co-Pilot Tab */}
        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" gutterBottom>
            Generate PDD Draft
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Describe your project in natural language and the AI will generate a structured Project Design Document compliant with SI 48 of 2025.
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Project Type</InputLabel>
            <Select value={projectType} onChange={(e) => setProjectType(e.target.value)}>
              <MenuItem value="forestry">Forestry</MenuItem>
              <MenuItem value="agriculture">Agriculture</MenuItem>
              <MenuItem value="renewable_energy">Renewable Energy</MenuItem>
              <MenuItem value="waste">Waste Management</MenuItem>
              <MenuItem value="industrial">Industrial</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Project Description"
            placeholder="Describe your project in detail..."
            value={pddDescription}
            onChange={(e) => setPddDescription(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Button
            variant="contained"
            onClick={handleGeneratePDD}
            disabled={loading || !pddDescription}
          >
            Generate PDD Draft
          </Button>

          {pddResult && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Generated PDD Draft
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">SI 48 Compliance Score</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={pddResult.compliance_score}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                  <Typography variant="body2" align="right">
                    {pddResult.compliance_score.toFixed(1)}%
                  </Typography>
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  Suggested Methodologies
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {pddResult.methodology_suggestions.map((m) => (
                    <Chip
                      key={m.methodology_id}
                      label={`${m.methodology_id} (${(m.relevance_score * 100).toFixed(0)}%)`}
                      color="primary"
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>

                {pddResult.missing_fields.length > 0 && (
                  <>
                    <Typography variant="subtitle2" color="warning.main" gutterBottom>
                      Missing Fields
                    </Typography>
                    <List dense>
                      {pddResult.missing_fields.map((field, i) => (
                        <ListItem key={i}>
                          <ListItemText primary={field} />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}

                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  AI Confidence
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {(pddResult.metadata.confidence_score * 100).toFixed(0)}% - {pddResult.metadata.explanation}
                </Typography>
              </CardContent>
            </Card>
          )}
        </TabPanel>

        {/* Additionality Checker Tab */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Additionality Assessment
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            AI-powered analysis to determine if your project is additional (wouldn't happen without carbon finance).
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Project Description"
            placeholder="Describe your project, including financial barriers, regulatory context..."
            value={addDescription}
            onChange={(e) => setAddDescription(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Button
            variant="contained"
            onClick={handleAnalyzeAdditionality}
            disabled={loading || !addDescription}
          >
            Analyze Additionality
          </Button>

          {addResult && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    Assessment Result
                  </Typography>
                  <Chip
                    label={addResult.conclusion.replace("_", " ").toUpperCase()}
                    color={getConclusionColor(addResult.conclusion) as any}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Overall Score</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={addResult.overall_score}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                  <Typography variant="body2" align="right">
                    {addResult.overall_score}/100
                  </Typography>
                </Box>

                <Typography variant="body1" sx={{ mb: 2 }}>
                  {addResult.reasoning_summary}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  AI Confidence: {(addResult.confidence * 100).toFixed(0)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Model: {addResult.metadata.model_version}
                </Typography>
              </CardContent>
            </Card>
          )}
        </TabPanel>

        {/* Remote Sensing Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Satellite Imagery Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Analyze project area using satellite imagery to estimate carbon stocks and detect anomalies.
          </Typography>

          <TextField
            fullWidth
            label="Project ID"
            placeholder="Enter project ID"
            value={rsProjectId}
            onChange={(e) => setRsProjectId(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Button
            variant="contained"
            onClick={handleStartRSAnalysis}
            disabled={loading || !rsProjectId}
          >
            Start Analysis
          </Button>

          {rsStatus && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {rsStatus}
            </Alert>
          )}

          {rsResult && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Analysis Results
                </Typography>

                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Project Area
                    </Typography>
                    <Typography variant="h6">
                      {rsResult.project_area_km2.toFixed(1)} km²
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Forest Cover
                    </Typography>
                    <Typography variant="h6">
                      {rsResult.forest_cover_percent.toFixed(1)}%
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Carbon Stock
                    </Typography>
                    <Typography variant="h6">
                      {rsResult.carbon_stock_tco2e.toLocaleString()} tCO2e
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Biomass Density
                    </Typography>
                    <Typography variant="h6">
                      {rsResult.biomass_density_mg_per_ha.toFixed(1)} Mg/ha
                    </Typography>
                  </Paper>
                </Box>

                {rsResult.anomalies.length > 0 && (
                  <>
                    <Typography variant="subtitle2" color="error" gutterBottom>
                      Detected Anomalies
                    </Typography>
                    <List dense>
                      {rsResult.anomalies.map((anomaly) => (
                        <ListItem key={anomaly.anomaly_id}>
                          <ListItemText
                            primary={`${anomaly.anomaly_type} - ${anomaly.severity}`}
                            secondary={anomaly.description}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}

                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Data Sources
                </Typography>
                <Box>
                  {rsResult.satellite_sources_used.map((source) => (
                    <Chip key={source} label={source} size="small" sx={{ mr: 1 }} />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
}
