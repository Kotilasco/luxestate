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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  TextareaAutosize,
} from "@mui/material";
import {
  ExpandMore,
  Article,
  Campaign,
  TrendingUp,
  Chat,
  AutoStories,
} from "@mui/icons-material";
import {
  generateNaturalLanguageReport,
  generateMarketingAnalysis,
  analyzeBuyerSentiment,
  generateProjectStory,
  answerNaturalLanguageQuery,
} from "../services/aiReports";

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

export default function AIReportsPanel() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Report generation state
  const [reportType, setReportType] = useState("carbon_impact");
  const [reportAudience, setReportAudience] = useState("executive");
  const [reportLanguage, setReportLanguage] = useState("en");
  const [reportData, setReportData] = useState(`{\n  "project_name": "Kariba REDD+",\n  "credits_issued": 50000,\n  "co2_sequestered": 125000,\n  "forest_area_ha": 45000,\n  "communities_supported": 12,\n  "verification_standard": "VCS"\n}`);
  const [generatedReport, setGeneratedReport] = useState("");

  // Marketing analysis state
  const [marketingProject, setMarketingProject] = useState(`{\n  "project_id": "proj-001",\n  "project_name": "Kariba REDD+ Forest Conservation",\n  "project_type": "Forestry",\n  "location": "Kariba, Zimbabwe",\n  "credits_available": 25000,\n  "price_per_tco2e": 12.50,\n  "co_benefits": ["biodiversity", "community_livelihoods", "water_conservation"],\n  "certifications": ["VCS", "CCB", "SDG_Vista"]\n}`);
  const [targetMarket, setTargetMarket] = useState("corporate");
  const [marketingResult, setMarketingResult] = useState("");

  // Sentiment analysis state
  const [marketData, setMarketData] = useState(`{\n  "total_volume_traded": 125000,\n  "average_price": 14.75,\n  "active_buyers": 45,\n  "market_sentiment_index": 0.72\n}`);
  const [buyerFeedback, setBuyerFeedback] = useState(`Quality verification is excellent\nPricing is competitive compared to other African markets\nWould like faster settlement times\nAppreciate the transparency in reporting\nConcerned about delivery timeline consistency`);
  const [sentimentResult, setSentimentResult] = useState("");

  // Story generation state
  const [storyProject, setStoryProject] = useState(`{\n  "project_name": "Kariba REDD+",\n  "location": "Kariba District, Zimbabwe",\n  "community_name": "Nyamhunga",\n  "beneficiaries": 2450,\n  "hectares_protected": 45000,\n  "co2_sequestered": 125000,\n  "benefit_sharing_usd": 78000,\n  "schools_built": 2,\n  "healthcare_visits": 450\n}`);
  const [storyType, setStoryType] = useState("impact");
  const [storyFormat, setStoryFormat] = useState("narrative");
  const [generatedStory, setGeneratedStory] = useState("");

  // NL Query state
  const [nlQuery, setNlQuery] = useState("");
  const [queryContext, setQueryContext] = useState("{}");
  const [queryResult, setQueryResult] = useState("");

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError(null);
    setSuccess(null);
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const result = await generateNaturalLanguageReport({
        report_type: reportType,
        data: JSON.parse(reportData),
        audience: reportAudience,
        language: reportLanguage,
      });
      setGeneratedReport(result.report);
      setSuccess(`Report generated! ${result.word_count} words`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarketingAnalysis = async () => {
    setLoading(true);
    try {
      const result = await generateMarketingAnalysis({
        project_data: JSON.parse(marketingProject),
        target_market: targetMarket,
        competitor_analysis: true,
      });
      setMarketingResult(result.analysis);
      setSuccess("Marketing analysis generated!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSentimentAnalysis = async () => {
    setLoading(true);
    try {
      const result = await analyzeBuyerSentiment({
        market_data: JSON.parse(marketData),
        buyer_feedback: buyerFeedback.split("\n").filter((f) => f.trim()),
      });
      setSentimentResult(result.sentiment_analysis);
      setSuccess(`Analyzed ${result.feedback_count} feedback items`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStory = async () => {
    setLoading(true);
    try {
      const result = await generateProjectStory({
        project_data: JSON.parse(storyProject),
        story_type: storyType,
        format: storyFormat,
      });
      setGeneratedStory(result.story);
      setSuccess(`Story generated in ${storyFormat} format!`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNLQuery = async () => {
    setLoading(true);
    try {
      const result = await answerNaturalLanguageQuery({
        query: nlQuery,
        context: JSON.parse(queryContext),
        user_role: "general",
      });
      setQueryResult(result.answer);
      setSuccess("Query answered!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h4" gutterBottom>
        AI Reports & Marketing Intelligence
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Powered by LangChain + Gemini 2.5 Flash for natural language reporting and marketing analysis.
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
          <Tab label="Report Generator" icon={<Article />} iconPosition="start" />
          <Tab label="Marketing Analysis" icon={<Campaign />} iconPosition="start" />
          <Tab label="Sentiment Analysis" icon={<TrendingUp />} iconPosition="start" />
          <Tab label="Storytelling" icon={<AutoStories />} iconPosition="start" />
          <Tab label="AI Assistant" icon={<Chat />} iconPosition="start" />
        </Tabs>

        {/* Report Generator Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Report Configuration
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <MenuItem value="carbon_impact">Carbon Impact Report</MenuItem>
                  <MenuItem value="project_performance">Project Performance</MenuItem>
                  <MenuItem value="market_analysis">Market Analysis</MenuItem>
                  <MenuItem value="compliance_summary">Compliance Summary</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Target Audience</InputLabel>
                <Select
                  value={reportAudience}
                  onChange={(e) => setReportAudience(e.target.value)}
                >
                  <MenuItem value="executive">Executive Summary</MenuItem>
                  <MenuItem value="technical">Technical</MenuItem>
                  <MenuItem value="community">Community</MenuItem>
                  <MenuItem value="regulatory">Regulatory</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Language</InputLabel>
                <Select
                  value={reportLanguage}
                  onChange={(e) => setReportLanguage(e.target.value)}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="sn">Shona</MenuItem>
                  <MenuItem value="nd">Ndebele</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                multiline
                rows={8}
                label="Data (JSON)"
                value={reportData}
                onChange={(e) => setReportData(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                onClick={handleGenerateReport}
                disabled={loading}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : "Generate Report"}
              </Button>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Generated Report
              </Typography>
              <Paper
                variant="outlined"
                sx={{ p: 2, minHeight: 400, backgroundColor: "grey.50" }}
              >
                {generatedReport ? (
                  <Typography
                    component="pre"
                    sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}
                  >
                    {generatedReport}
                  </Typography>
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ mt: 10 }}>
                    Generated report will appear here...
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Marketing Analysis Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <Typography variant="h6" gutterBottom>
                Project Data
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={10}
                label="Project Details (JSON)"
                value={marketingProject}
                onChange={(e) => setMarketingProject(e.target.value)}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Target Market</InputLabel>
                <Select
                  value={targetMarket}
                  onChange={(e) => setTargetMarket(e.target.value)}
                >
                  <MenuItem value="corporate">Corporate Buyers</MenuItem>
                  <MenuItem value="aviation">Aviation (CORSIA)</MenuItem>
                  <MenuItem value="sovereign">Sovereign/Government</MenuItem>
                  <MenuItem value="voluntary">Voluntary Market</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={handleMarketingAnalysis}
                disabled={loading}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : "Generate Analysis"}
              </Button>
            </Grid>
            <Grid item xs={12} md={7}>
              <Typography variant="h6" gutterBottom>
                Marketing Analysis
              </Typography>
              <Paper
                variant="outlined"
                sx={{ p: 2, minHeight: 400, backgroundColor: "grey.50" }}
              >
                {marketingResult ? (
                  <Typography
                    component="pre"
                    sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}
                  >
                    {marketingResult}
                  </Typography>
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ mt: 10 }}>
                    Marketing analysis will appear here...
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Sentiment Analysis Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <Typography variant="h6" gutterBottom>
                Market Data
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={5}
                label="Market Metrics (JSON)"
                value={marketData}
                onChange={(e) => setMarketData(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Typography variant="subtitle2" gutterBottom>
                Buyer Feedback (one per line)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={6}
                value={buyerFeedback}
                onChange={(e) => setBuyerFeedback(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                onClick={handleSentimentAnalysis}
                disabled={loading}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : "Analyze Sentiment"}
              </Button>
            </Grid>
            <Grid item xs={12} md={7}>
              <Typography variant="h6" gutterBottom>
                Sentiment Analysis Results
              </Typography>
              <Paper
                variant="outlined"
                sx={{ p: 2, minHeight: 400, backgroundColor: "grey.50" }}
              >
                {sentimentResult ? (
                  <Typography
                    component="pre"
                    sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}
                  >
                    {sentimentResult}
                  </Typography>
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ mt: 10 }}>
                    Sentiment analysis will appear here...
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Storytelling Tab */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Story Configuration
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={8}
                label="Project Data (JSON)"
                value={storyProject}
                onChange={(e) => setStoryProject(e.target.value)}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Story Type</InputLabel>
                <Select
                  value={storyType}
                  onChange={(e) => setStoryType(e.target.value)}
                >
                  <MenuItem value="impact">Impact Story</MenuItem>
                  <MenuItem value="community">Community Focus</MenuItem>
                  <MenuItem value="conservation">Conservation</MenuItem>
                  <MenuItem value="innovation">Innovation</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Format</InputLabel>
                <Select
                  value={storyFormat}
                  onChange={(e) => setStoryFormat(e.target.value)}
                >
                  <MenuItem value="narrative">Narrative</MenuItem>
                  <MenuItem value="social_media">Social Media</MenuItem>
                  <MenuItem value="press_release">Press Release</MenuItem>
                  <MenuItem value="video_script">Video Script</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={handleGenerateStory}
                disabled={loading}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : "Generate Story"}
              </Button>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Generated Story
              </Typography>
              <Paper
                variant="outlined"
                sx={{ p: 2, minHeight: 400, backgroundColor: "grey.50" }}
              >
                {generatedStory ? (
                  <Typography
                    component="pre"
                    sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}
                  >
                    {generatedStory}
                  </Typography>
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ mt: 10 }}>
                    Generated story will appear here...
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* AI Assistant Tab */}
        <TabPanel value={activeTab} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <Typography variant="h6" gutterBottom>
                Ask a Question
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Your Question"
                placeholder="e.g., What is the total carbon sequestered by Kariba REDD+ project?"
                value={nlQuery}
                onChange={(e) => setNlQuery(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                multiline
                rows={5}
                label="Context Data (JSON)"
                value={queryContext}
                onChange={(e) => setQueryContext(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                onClick={handleNLQuery}
                disabled={loading || !nlQuery}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : "Ask AI"}
              </Button>
            </Grid>
            <Grid item xs={12} md={7}>
              <Typography variant="h6" gutterBottom>
                AI Response
              </Typography>
              <Paper
                variant="outlined"
                sx={{ p: 2, minHeight: 300, backgroundColor: "grey.50" }}
              >
                {queryResult ? (
                  <Typography sx={{ whiteSpace: "pre-wrap" }}>
                    {queryResult}
                  </Typography>
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ mt: 10 }}>
                    AI response will appear here...
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      <Alert severity="info">
        <strong>Note:</strong> This panel uses LangChain with Google Gemini 2.5 Flash for AI-powered content generation. 
        Set the <code>GOOGLE_API_KEY</code> environment variable in the AI Validation Service for full functionality. 
        Currently running in mock mode for demonstration.
      </Alert>
    </Box>
  );
}
