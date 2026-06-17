"use client";

import AccountTreeIcon from "@mui/icons-material/AccountTree";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import GavelIcon from "@mui/icons-material/Gavel";
import MapIcon from "@mui/icons-material/Map";
import PaymentsIcon from "@mui/icons-material/Payments";
import RefreshIcon from "@mui/icons-material/Refresh";
import SendIcon from "@mui/icons-material/Send";
import VerifiedIcon from "@mui/icons-material/Verified";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  advanceProjectWorkflow,
  AiReview,
  AuditEvent,
  CarbonProject,
  CreditBatch,
  fetchGatewayHealth,
  GisAssessment,
  issueCreditBatch,
  listAuditEvents,
  listCarbonProjects,
  listCreditBatches,
  registerCarbonProject,
  runAiReview,
  runGisAssessment,
  WorkflowAction
} from "../services/carbonRegistry";

const bootstrapOrganizationId = "11111111-1111-4111-8111-111111111111";

const workflowSteps = [
  "Draft",
  "Submitted",
  "Verification",
  "Approved",
  "Credits Issued"
];

const statusStep: Record<string, number> = {
  draft: 0,
  submitted_for_verification: 1,
  under_verification: 2,
  approved: 3,
  credits_issued: 4,
  rejected: 1,
  suspended: 1
};

const workspaceLinks = [
  ["registry", "Registry", <VerifiedIcon key="registry" />],
  ["gis", "GIS", <MapIcon key="gis" />],
  ["ai", "AI Review", <AnalyticsIcon key="ai" />],
  ["marketplace", "Marketplace", <PaymentsIcon key="marketplace" />],
  ["blockchain", "Ledger", <AccountTreeIcon key="ledger" />],
  ["compliance", "Compliance", <GavelIcon key="compliance" />]
];

type FormState = {
  project_code: string;
  title: string;
  description: string;
  methodology: string;
  proponent_organization_id: string;
  district: string;
  province: string;
  estimated_annual_tco2e: string;
  start_date: string;
  crediting_period_years: number;
};

function createInitialForm(): FormState {
  const randomCode = Math.floor(20260000 + Math.random() * 900000);
  return {
    project_code: `ZAI-${randomCode}`,
    title: "Kariba AI Verified Forest Carbon Programme",
    description:
      "A production-grade project record for forest conservation and verified carbon sequestration under the ZAI-CTS registry workflow.",
    methodology: "VM0047 Afforestation Reforestation Revegetation",
    proponent_organization_id: bootstrapOrganizationId,
    district: "Kariba",
    province: "Mashonaland West",
    estimated_annual_tco2e: "125000.0000",
    start_date: "2026-01-01",
    crediting_period_years: 30
  };
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function availableActions(project: CarbonProject | null): Array<[WorkflowAction, string]> {
  if (!project) {
    return [];
  }
  if (project.status === "draft") {
    return [["submit_for_verification", "Submit for Verification"]];
  }
  if (project.status === "submitted_for_verification") {
    return [["start_verification", "Start Verification"]];
  }
  if (project.status === "under_verification") {
    return [
      ["approve", "Approve Project"],
      ["reject", "Reject"]
    ];
  }
  if (project.status === "approved" || project.status === "credits_issued") {
    return [["suspend", "Suspend"]];
  }
  return [];
}

export default function RegistryConsole() {
  const [health, setHealth] = useState<string>("checking");
  const [projects, setProjects] = useState<CarbonProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [credits, setCredits] = useState<CreditBatch[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [gisAssessment, setGisAssessment] = useState<GisAssessment | null>(null);
  const [aiReview, setAiReview] = useState<AiReview | null>(null);
  const [form, setForm] = useState<FormState>(() => createInitialForm());
  const [activeTab, setActiveTab] = useState("registry");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? projects[0] ?? null,
    [projects, selectedProjectId]
  );

  const activeStep = selectedProject ? statusStep[selectedProject.status] ?? 0 : 0;
  const totalIssued = credits.reduce((sum, batch) => sum + Number(batch.quantity_tco2e), 0);

  async function loadProjects(preferredProjectId?: string) {
    const [healthResponse, projectResponse] = await Promise.all([
      fetchGatewayHealth(),
      listCarbonProjects()
    ]);
    setHealth(`${healthResponse.status} (${healthResponse.service})`);
    setProjects(projectResponse);
    const nextSelected = preferredProjectId ?? selectedProjectId ?? projectResponse[0]?.id ?? null;
    setSelectedProjectId(nextSelected);
    if (nextSelected) {
      await loadProjectDetails(nextSelected);
    } else {
      setCredits([]);
      setAuditEvents([]);
      setGisAssessment(null);
      setAiReview(null);
    }
  }

  async function loadProjectDetails(projectId: string) {
    const [creditResponse, auditResponse] = await Promise.all([
      listCreditBatches(projectId),
      listAuditEvents(projectId)
    ]);
    setCredits(creditResponse);
    setAuditEvents(auditResponse);
    setGisAssessment((current) => (current?.project_id === projectId ? current : null));
    setAiReview((current) => (current?.project_id === projectId ? current : null));
  }

  useEffect(() => {
    loadProjects().catch((error: unknown) => {
      setHealth("unavailable");
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to load registry data." });
    });
  }, []);

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const created = await registerCarbonProject(form);
      setForm(createInitialForm());
      await loadProjects(created.id);
      setMessage({ type: "success", text: `Registered ${created.project_code}. Select workflow actions to continue.` });
    } catch (error: unknown) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Project registration failed." });
    } finally {
      setIsLoading(false);
    }
  }

  async function runWorkflowAction(action: WorkflowAction) {
    if (!selectedProject) {
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      const updated = await advanceProjectWorkflow(
        selectedProject.id,
        action,
        `Regulatory workflow action completed from the ZAI-CTS web portal.`
      );
      await loadProjects(updated.id);
      setMessage({ type: "success", text: `${updated.project_code} is now ${formatStatus(updated.status)}.` });
    } catch (error: unknown) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Workflow action failed." });
    } finally {
      setIsLoading(false);
    }
  }

  async function issueCredits() {
    if (!selectedProject) {
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      const batch = await issueCreditBatch(selectedProject.id, {
        vintage_year: new Date().getFullYear(),
        quantity_tco2e: selectedProject.estimated_annual_tco2e
      });
      await loadProjects(selectedProject.id);
      setMessage({ type: "success", text: `Issued ${batch.quantity_tco2e} tCO2e with serial ${batch.serial_prefix}.` });
    } catch (error: unknown) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Credit issuance failed." });
    } finally {
      setIsLoading(false);
    }
  }

  async function runSelectedGisAssessment() {
    if (!selectedProject) {
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      const assessment = await runGisAssessment(selectedProject.id);
      setGisAssessment(assessment);
      await loadProjectDetails(selectedProject.id);
      setMessage({ type: "success", text: `GIS assessment completed: ${assessment.boundary_validation_status}.` });
    } catch (error: unknown) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "GIS assessment failed." });
    } finally {
      setIsLoading(false);
    }
  }

  async function runSelectedAiReview() {
    if (!selectedProject) {
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      const review = await runAiReview(selectedProject.id);
      setAiReview(review);
      await loadProjectDetails(selectedProject.id);
      setMessage({ type: "success", text: `AI review completed: ${review.risk_level} risk at ${review.confidence_score} confidence.` });
    } catch (error: unknown) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "AI review failed." });
    } finally {
      setIsLoading(false);
    }
  }

  async function selectProject(projectId: string) {
    setSelectedProjectId(projectId);
    await loadProjectDetails(projectId);
  }

  return (
    <section id="registry" className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6 flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zai-blue">ZAI-CTS Operations Portal</p>
          <h1 className="mt-2 text-4xl font-bold text-zai-ink">Carbon market workflow console</h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Register a project, review it, approve it, issue serialized credits, and inspect the audit trail from one working screen.
          </p>
        </div>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip color={health.startsWith("healthy") ? "success" : "warning"} label={`Gateway: ${health}`} />
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => loadProjects()} disabled={isLoading}>
            Refresh
          </Button>
        </Stack>
      </div>

      <Paper elevation={0} className="mb-6 border">
        <Tabs value={activeTab} onChange={(_, value: string) => setActiveTab(value)} variant="scrollable" scrollButtons="auto">
          {workspaceLinks.map(([value, label, icon]) => (
            <Tab key={value.toString()} value={value} icon={icon} iconPosition="start" label={label} />
          ))}
        </Tabs>
      </Paper>

      {message && (
        <Alert className="mb-6" severity={message.type}>
          {message.text}
        </Alert>
      )}

      {activeTab === "registry" ? (
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <Paper elevation={0} className="border p-6">
            <Box component="form" onSubmit={submitProject}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={800}>
                  Start: project registration
                </Typography>
                <TextField label="Project code" value={form.project_code} onChange={(event) => updateField("project_code", event.target.value)} required fullWidth />
                <TextField label="Title" value={form.title} onChange={(event) => updateField("title", event.target.value)} required fullWidth />
                <TextField label="Description" value={form.description} onChange={(event) => updateField("description", event.target.value)} required fullWidth multiline minRows={3} />
                <TextField label="Methodology" value={form.methodology} onChange={(event) => updateField("methodology", event.target.value)} required fullWidth />
                <TextField select label="Province" value={form.province} onChange={(event) => updateField("province", event.target.value)} fullWidth>
                  <MenuItem value="Mashonaland West">Mashonaland West</MenuItem>
                  <MenuItem value="Matabeleland North">Matabeleland North</MenuItem>
                  <MenuItem value="Manicaland">Manicaland</MenuItem>
                  <MenuItem value="Masvingo">Masvingo</MenuItem>
                </TextField>
                <TextField label="District" value={form.district} onChange={(event) => updateField("district", event.target.value)} required fullWidth />
                <TextField label="Estimated annual tCO2e" value={form.estimated_annual_tco2e} onChange={(event) => updateField("estimated_annual_tco2e", event.target.value)} required fullWidth />
                <div className="grid gap-3 md:grid-cols-2">
                  <TextField type="date" label="Start date" value={form.start_date} onChange={(event) => updateField("start_date", event.target.value)} InputLabelProps={{ shrink: true }} required />
                  <TextField type="number" label="Crediting years" value={form.crediting_period_years} onChange={(event) => updateField("crediting_period_years", Number(event.target.value))} required />
                </div>
                <Button type="submit" variant="contained" size="large" startIcon={isLoading ? <CircularProgress size={18} /> : <SendIcon />} disabled={isLoading}>
                  Register Project
                </Button>
              </Stack>
            </Box>
          </Paper>

          <Stack spacing={3}>
            <Paper elevation={0} className="border p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <Typography variant="h6" fontWeight={800}>
                    Registered projects
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {projects.length} project{projects.length === 1 ? "" : "s"} available. Select one to view and continue.
                  </Typography>
                </div>
                <AddCircleIcon className="text-sky-600" />
              </div>
              <Divider />
              <Stack spacing={1.5} className="mt-5">
                {projects.length === 0 ? (
                  <Alert severity="info">No projects registered yet. Use the form to create the first project.</Alert>
                ) : (
                  projects.map((project) => (
                    <button
                      key={project.id}
                      className={`w-full rounded-lg border p-4 text-left transition hover:border-sky-300 hover:bg-sky-50 ${selectedProject?.id === project.id ? "border-sky-500 bg-sky-50" : "bg-white"}`}
                      type="button"
                      onClick={() => selectProject(project.id)}
                    >
                      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
                        <div>
                          <strong className="block text-zai-ink">{project.title}</strong>
                          <span className="text-sm text-slate-500">{project.project_code} - {project.district}, {project.province}</span>
                        </div>
                        <Chip size="small" label={formatStatus(project.status)} color={project.status === "credits_issued" ? "success" : "primary"} variant="outlined" />
                      </div>
                    </button>
                  ))
                )}
              </Stack>
            </Paper>

            <Paper elevation={0} className="border p-6">
              {selectedProject ? (
                <Stack spacing={3}>
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <Typography variant="h5" fontWeight={900}>
                        {selectedProject.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedProject.project_code} - {selectedProject.district}, {selectedProject.province}
                      </Typography>
                    </div>
                    <Chip label={formatStatus(selectedProject.status)} color="primary" />
                  </div>

                  <Stepper activeStep={activeStep} alternativeLabel>
                    {workflowSteps.map((label) => (
                      <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>

                  <p className="text-sm leading-6 text-slate-600">{selectedProject.description}</p>

                  <div className="grid gap-3 text-sm md:grid-cols-4">
                    <div className="rounded-md bg-sky-50 p-3">
                      <strong className="block text-zai-ink">{selectedProject.estimated_annual_tco2e}</strong>
                      <span className="text-slate-500">Annual tCO2e</span>
                    </div>
                    <div className="rounded-md bg-sky-50 p-3">
                      <strong className="block text-zai-ink">{selectedProject.crediting_period_years} years</strong>
                      <span className="text-slate-500">Crediting period</span>
                    </div>
                    <div className="rounded-md bg-sky-50 p-3">
                      <strong className="block text-zai-ink">{credits.length}</strong>
                      <span className="text-slate-500">Credit batches</span>
                    </div>
                    <div className="rounded-md bg-sky-50 p-3">
                      <strong className="block text-zai-ink">{totalIssued.toLocaleString()}</strong>
                      <span className="text-slate-500">Issued tCO2e</span>
                    </div>
                  </div>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {availableActions(selectedProject).map(([action, label]) => (
                      <Button key={action} variant="contained" onClick={() => runWorkflowAction(action)} disabled={isLoading}>
                        {label}
                      </Button>
                    ))}
                    <Button
                      variant="outlined"
                      startIcon={<FactCheckIcon />}
                      onClick={issueCredits}
                      disabled={isLoading || !["approved", "credits_issued"].includes(selectedProject.status)}
                    >
                      Issue Credits
                    </Button>
                  </Stack>

                  <Divider />
                  <div className="grid gap-4 xl:grid-cols-2">
                    <div>
                      <Typography variant="h6" fontWeight={800}>
                        Issued credit batches
                      </Typography>
                      <Stack spacing={1.5} className="mt-3">
                        {credits.length === 0 ? (
                          <Alert severity="info">No credits issued yet. Approve the project, then issue credits.</Alert>
                        ) : (
                          credits.map((batch) => (
                            <div key={batch.id} className="rounded-lg border p-4">
                              <strong className="block text-zai-ink">{batch.serial_prefix}</strong>
                              <span className="text-sm text-slate-600">{batch.quantity_tco2e} tCO2e - vintage {batch.vintage_year}</span>
                              <p className="mt-2 break-all text-xs text-slate-500">{batch.blockchain_tx_id}</p>
                            </div>
                          ))
                        )}
                      </Stack>
                    </div>

                    <div>
                      <Typography variant="h6" fontWeight={800}>
                        Immutable audit trail
                      </Typography>
                      <Stack spacing={1.5} className="mt-3">
                        {auditEvents.length === 0 ? (
                          <Alert severity="info">No audit events yet.</Alert>
                        ) : (
                          auditEvents.map((event) => (
                            <div key={event.id} className="rounded-lg border p-4">
                              <strong className="block text-zai-ink">{event.event_type}</strong>
                              <span className="text-sm text-slate-600">{event.action} - {event.outcome}</span>
                              <p className="mt-2 text-xs text-slate-500">{new Date(event.created_at).toLocaleString()}</p>
                            </div>
                          ))
                        )}
                      </Stack>
                    </div>
                  </div>
                </Stack>
              ) : (
                <Alert severity="info">Register a project to begin the workflow.</Alert>
              )}
            </Paper>
          </Stack>
        </div>
      ) : activeTab === "gis" ? (
        <Paper elevation={0} className="border p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <Typography variant="h5" fontWeight={900}>
                GIS project intelligence
              </Typography>
              <p className="mt-3 max-w-3xl text-slate-600">
                Run district, forest cover, fire risk, carbon density, and boundary validation for the selected project.
              </p>
            </div>
            <Button variant="contained" startIcon={<MapIcon />} onClick={runSelectedGisAssessment} disabled={isLoading || !selectedProject}>
              Run GIS Assessment
            </Button>
          </div>

          {selectedProject ? (
            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
              <div className="min-h-[360px] rounded-lg border bg-[linear-gradient(rgba(14,165,233,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,.18)_1px,transparent_1px)] bg-[size:36px_36px] p-6">
                <div className="flex h-full min-h-[320px] items-center justify-center rounded-md border border-sky-200 bg-white/75">
                  <div className="text-center">
                    <MapIcon className="mx-auto text-sky-600" fontSize="large" />
                    <Typography variant="h6" fontWeight={900} className="mt-3">
                      {selectedProject.district}, {selectedProject.province}
                    </Typography>
                    <p className="mt-2 text-sm text-slate-600">
                      {gisAssessment
                        ? `${gisAssessment.centroid_latitude}, ${gisAssessment.centroid_longitude}`
                        : "Run GIS assessment to calculate centroid, area, and layer risk."}
                    </p>
                    {gisAssessment && (
                      <Chip className="mt-4" color={gisAssessment.boundary_validation_status === "validated" ? "success" : "warning"} label={gisAssessment.boundary_validation_status} />
                    )}
                  </div>
                </div>
              </div>

              <Stack spacing={2}>
                <div className="rounded-lg border p-5">
                  <strong className="block text-zai-ink">{selectedProject.project_code}</strong>
                  <span className="text-sm text-slate-500">Selected registry project</span>
                </div>
                {gisAssessment ? (
                  <>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                      <div className="rounded-lg bg-sky-50 p-4">
                        <strong className="block text-zai-ink">{gisAssessment.estimated_area_hectares}</strong>
                        <span className="text-sm text-slate-500">Estimated hectares</span>
                      </div>
                      <div className="rounded-lg bg-sky-50 p-4">
                        <strong className="block text-zai-ink">{gisAssessment.forest_cover_percent}%</strong>
                        <span className="text-sm text-slate-500">Forest cover profile</span>
                      </div>
                      <div className="rounded-lg bg-sky-50 p-4">
                        <strong className="block text-zai-ink">{gisAssessment.fire_risk_level}</strong>
                        <span className="text-sm text-slate-500">Fire risk</span>
                      </div>
                      <div className="rounded-lg bg-sky-50 p-4">
                        <strong className="block text-zai-ink">{gisAssessment.carbon_density_tco2e_per_hectare}</strong>
                        <span className="text-sm text-slate-500">tCO2e per hectare</span>
                      </div>
                    </div>
                    <Alert severity={gisAssessment.boundary_validation_status === "validated" ? "success" : "warning"}>
                      {gisAssessment.recommendation}
                    </Alert>
                  </>
                ) : (
                  <Alert severity="info">No GIS assessment has been run for this selected project yet.</Alert>
                )}
              </Stack>

              {gisAssessment && (
                <div className="xl:col-span-2 grid gap-4 lg:grid-cols-2">
                  <div>
                    <Typography variant="h6" fontWeight={800}>
                      GIS layers
                    </Typography>
                    <Stack spacing={1.5} className="mt-3">
                      {gisAssessment.layers.map((layer) => (
                        <div key={layer.name} className="rounded-lg border p-4">
                          <strong className="block text-zai-ink">{layer.name}</strong>
                          <span className="text-sm text-slate-600">{layer.status} - {layer.summary}</span>
                        </div>
                      ))}
                    </Stack>
                  </div>
                  <div>
                    <Typography variant="h6" fontWeight={800}>
                      Evidence required
                    </Typography>
                    <Stack spacing={1.5} className="mt-3">
                      {gisAssessment.evidence_sources.map((source) => (
                        <div key={source} className="rounded-lg border p-4 text-sm text-slate-700">
                          {source}
                        </div>
                      ))}
                    </Stack>
                  </div>
                  <div className="lg:col-span-2">
                    <Typography variant="h6" fontWeight={800}>
                      GIS findings
                    </Typography>
                    <Stack spacing={1.5} className="mt-3">
                      {gisAssessment.findings.map((finding) => (
                        <div key={finding} className="rounded-lg border p-4 text-sm text-slate-700">
                          {finding}
                        </div>
                      ))}
                    </Stack>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Alert className="mt-6" severity="info">Select or register a project before running GIS assessment.</Alert>
          )}
        </Paper>
      ) : activeTab === "ai" ? (
        <Paper elevation={0} className="border p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <Typography variant="h5" fontWeight={900}>
                AI PDD and risk review
              </Typography>
              <p className="mt-3 max-w-3xl text-slate-600">
                Run explainable project screening for methodology fit, crediting period, estimated tCO2e risk, and verifier actions.
              </p>
            </div>
            <Button variant="contained" startIcon={<AnalyticsIcon />} onClick={runSelectedAiReview} disabled={isLoading || !selectedProject}>
              Run AI Review
            </Button>
          </div>

          {selectedProject ? (
            <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
              <Stack spacing={2}>
                <div className="rounded-lg border p-5">
                  <strong className="block text-zai-ink">{selectedProject.project_code}</strong>
                  <span className="text-sm text-slate-500">Selected project</span>
                </div>
                <div className="rounded-lg border p-5">
                  <strong className="block text-zai-ink">{selectedProject.methodology}</strong>
                  <span className="text-sm text-slate-500">Declared methodology</span>
                </div>
                <div className="rounded-lg border p-5">
                  <strong className="block text-zai-ink">{selectedProject.estimated_annual_tco2e}</strong>
                  <span className="text-sm text-slate-500">Annual tCO2e under review</span>
                </div>
              </Stack>

              {aiReview ? (
                <Stack spacing={3}>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg bg-sky-50 p-4">
                      <strong className="block text-zai-ink">{aiReview.risk_level}</strong>
                      <span className="text-sm text-slate-500">Risk level</span>
                    </div>
                    <div className="rounded-lg bg-sky-50 p-4">
                      <strong className="block text-zai-ink">{aiReview.confidence_score}</strong>
                      <span className="text-sm text-slate-500">Confidence score</span>
                    </div>
                    <div className="rounded-lg bg-sky-50 p-4">
                      <strong className="block text-zai-ink">{aiReview.prompt_version}</strong>
                      <span className="text-sm text-slate-500">Prompt version</span>
                    </div>
                  </div>
                  <Alert severity={aiReview.risk_level === "low" ? "success" : "warning"}>{aiReview.recommendation}</Alert>
                  <div className="grid gap-4 xl:grid-cols-2">
                    <div>
                      <Typography variant="h6" fontWeight={800}>
                        Explainable findings
                      </Typography>
                      <Stack spacing={1.5} className="mt-3">
                        {aiReview.findings.map((finding) => (
                          <div key={finding} className="rounded-lg border p-4 text-sm text-slate-700">
                            {finding}
                          </div>
                        ))}
                      </Stack>
                    </div>
                    <div>
                      <Typography variant="h6" fontWeight={800}>
                        Required actions
                      </Typography>
                      <Stack spacing={1.5} className="mt-3">
                        {aiReview.required_actions.map((action) => (
                          <div key={action} className="rounded-lg border p-4 text-sm text-slate-700">
                            {action}
                          </div>
                        ))}
                      </Stack>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Model: {aiReview.model_version} - Generated {new Date(aiReview.generated_at).toLocaleString()}
                  </p>
                </Stack>
              ) : (
                <Alert severity="info">No AI review has been run for this selected project yet.</Alert>
              )}
            </div>
          ) : (
            <Alert className="mt-6" severity="info">Select or register a project before running AI review.</Alert>
          )}
        </Paper>
      ) : (
        <Paper elevation={0} className="border p-8">
          <Typography variant="h5" fontWeight={900}>
            {workspaceLinks.find(([value]) => value === activeTab)?.[1]} workspace
          </Typography>
          <p className="mt-3 max-w-3xl text-slate-600">
            This section is linked into the workflow console. Select a registered project in the Registry tab first, then use the operational data below for the selected project.
          </p>
          {selectedProject ? (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-5">
                <strong className="block text-zai-ink">{selectedProject.project_code}</strong>
                <span className="text-sm text-slate-500">Selected project</span>
              </div>
              <div className="rounded-lg border p-5">
                <strong className="block text-zai-ink">{formatStatus(selectedProject.status)}</strong>
                <span className="text-sm text-slate-500">Current status</span>
              </div>
              <div className="rounded-lg border p-5">
                <strong className="block text-zai-ink">{credits.length}</strong>
                <span className="text-sm text-slate-500">Issued credit batches</span>
              </div>
            </div>
          ) : (
            <Alert className="mt-6" severity="info">No selected project yet.</Alert>
          )}
        </Paper>
      )}
    </section>
  );
}
