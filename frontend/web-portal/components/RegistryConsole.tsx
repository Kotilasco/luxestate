"use client";

import AccountTreeIcon from "@mui/icons-material/AccountTree";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import DashboardIcon from "@mui/icons-material/Dashboard";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import GavelIcon from "@mui/icons-material/Gavel";
import MapIcon from "@mui/icons-material/Map";
import PaymentsIcon from "@mui/icons-material/Payments";
import RefreshIcon from "@mui/icons-material/Refresh";
import SendIcon from "@mui/icons-material/Send";
import UploadFileIcon from "@mui/icons-material/UploadFile";
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
  decideVerificationStage,
  EvidenceRecord,
  fetchGatewayHealth,
  getVerificationCase,
  GisAssessment,
  GisEvidencePayload,
  issueCreditBatch,
  listAuditEvents,
  listCarbonProjects,
  listCreditBatches,
  listEvidence,
  registerCarbonProject,
  runAiReview,
  runAutomaticVerification,
  runGisAssessment,
  runVerificationAiAssessment,
  startVerificationCase,
  submitGisEvidence,
  uploadVerificationEvidencePackage,
  validateAiReview,
  validateGisEvidence,
  VerificationAssessment,
  VerificationCase,
  VerificationFile,
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

const VERIFICATION_SEQUENCE = [
  "pending_evidence",
  "evidence_uploaded",
  "automatic_validation",
  "ai_review",
  "gis_review",
  "mrv_review",
  "verifier_review",
  "zicma_review",
  "approved",
  "credit_issued"
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
  ["dashboard", "Dashboard", <DashboardIcon key="dashboard" />],
  ["registry", "Registry", <VerifiedIcon key="registry" />],
  ["verification", "Verification", <AssignmentTurnedInIcon key="verification" />],
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
  const [evidenceRecords, setEvidenceRecords] = useState<EvidenceRecord[]>([]);
  const [gisAssessment, setGisAssessment] = useState<GisAssessment | null>(null);
  const [aiReview, setAiReview] = useState<AiReview | null>(null);
  const [verificationCase, setVerificationCase] = useState<VerificationCase | null>(null);
  const [verificationAssessment, setVerificationAssessment] = useState<VerificationAssessment | null>(null);
  const [gisEvidenceForm, setGisEvidenceForm] = useState<GisEvidencePayload>({
    boundary_geojson:
      '{"type":"Feature","properties":{"name":"Kariba block A"},"geometry":{"type":"Polygon","coordinates":[[[28.72,-16.45],[28.92,-16.45],[28.92,-16.62],[28.72,-16.62],[28.72,-16.45]]]}}',
    satellite_scene_id: "S2A_MSIL2A_20260615T073621_KARIBA",
    land_cover_source: "ESA WorldCover 10m 2021 baseline",
    fire_alert_source: "NASA FIRMS VIIRS 375m last 30 days",
    field_mrv_reference: "MRV-FIELD-KARIBA-2026-001",
    verifier_notes: "Boundary, satellite and field MRV pack uploaded by accredited verifier for regulator review."
  });
  const [form, setForm] = useState<FormState>(() => createInitialForm());
  const [activeTab, setActiveTab] = useState("dashboard");
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
      setEvidenceRecords([]);
      setGisAssessment(null);
      setAiReview(null);
      setVerificationCase(null);
      setVerificationAssessment(null);
    }
  }

  async function loadProjectDetails(projectId: string) {
    const [creditResponse, auditResponse, evidenceResponse, verificationResponse] = await Promise.all([
      listCreditBatches(projectId),
      listAuditEvents(projectId),
      listEvidence(projectId),
      getVerificationCase(projectId)
    ]);
    setCredits(creditResponse);
    setAuditEvents(auditResponse);
    setEvidenceRecords(evidenceResponse);
    setVerificationCase(verificationResponse);
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

  function updateGisEvidenceField<Key extends keyof GisEvidencePayload>(key: Key, value: GisEvidencePayload[Key]) {
    setGisEvidenceForm((current) => ({ ...current, [key]: value }));
  }

  async function submitSelectedGisEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProject) {
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      const evidence = await submitGisEvidence(selectedProject.id, gisEvidenceForm);
      await loadProjectDetails(selectedProject.id);
      setMessage({ type: "success", text: `GIS evidence submitted: ${evidence.evidence_type}.` });
    } catch (error: unknown) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "GIS evidence submission failed." });
    } finally {
      setIsLoading(false);
    }
  }

  async function decideGisValidation(decision: "valid" | "invalid" | "requires_revision") {
    if (!selectedProject) {
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      const result = await validateGisEvidence(selectedProject.id, {
        decision,
        notes: decision === "valid" ? "Boundary, satellite, fire and field MRV evidence accepted by regulator." : "Evidence requires regulator follow-up before approval."
      });
      await loadProjectDetails(selectedProject.id);
      setMessage({ type: "success", text: `GIS validation marked ${result.status}.` });
    } catch (error: unknown) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "GIS validation failed." });
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

  async function decideAiValidation(decision: "valid" | "invalid" | "requires_revision") {
    if (!selectedProject) {
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      const result = await validateAiReview(selectedProject.id, {
        decision,
        notes: decision === "valid" ? "AI review accepted and human verification controls recorded." : "AI review requires additional human review evidence."
      });
      await loadProjectDetails(selectedProject.id);
      setMessage({ type: "success", text: `AI validation marked ${result.status}.` });
    } catch (error: unknown) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "AI validation failed." });
    } finally {
      setIsLoading(false);
    }
  }

  async function selectProject(projectId: string) {
    setSelectedProjectId(projectId);
    await loadProjectDetails(projectId);
  }

  function verificationFiles(): VerificationFile[] {
    const signature = `SIG-${selectedProject?.project_code ?? "PROJECT"}-2026`;
    return [
      ["project-boundary.geojson", "boundary", "application/geo+json", 18422],
      ["monitoring-report.pdf", "monitoring_report", "application/pdf", 992120],
      ["carbon-calculations.xlsx", "carbon_calculation", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 221004],
      ["biomass-inventory.csv", "biomass_inventory", "text/csv", 80442],
      ["sentinel-scene-metadata.json", "satellite_imagery", "application/json", 50220],
      ["gps-photo-pack.zip", "field_photo", "application/zip", 2240122],
      ["inspection-forms.pdf", "inspection_form", "application/pdf", 312002],
      ["drone-imagery-index.zip", "drone_imagery", "application/zip", 4021200],
      ["verifier-statement.pdf", "verifier_statement", "application/pdf", 202200],
      ["accreditation-certificate.pdf", "accreditation_certificate", "application/pdf", 181040],
      ["digital-signature.txt", "digital_signature", "text/plain", 2048]
    ].map(([file_name, category, mime_type, file_size_bytes]) => ({
      file_name: String(file_name),
      category: category as VerificationFile["category"],
      mime_type: String(mime_type),
      file_size_bytes: Number(file_size_bytes),
      capture_date: "2026-12-31",
      digital_signature: signature
    }));
  }

  async function runVerificationStep(step: "start" | "evidence" | "automatic" | "ai" | "gis" | "mrv" | "verifier" | "zicma") {
    if (!selectedProject) {
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      if (step === "start") {
        setVerificationCase(await startVerificationCase(selectedProject.id));
      } else if (step === "evidence") {
        await uploadVerificationEvidencePackage(selectedProject.id, verificationFiles());
      } else if (step === "automatic") {
        setVerificationAssessment(await runAutomaticVerification(selectedProject.id));
      } else if (step === "ai") {
        setVerificationAssessment(await runVerificationAiAssessment(selectedProject.id));
      } else if (step === "gis") {
        await decideVerificationStage(selectedProject.id, "gis", "approve", "GIS evidence, map layers and boundary inspection approved.");
      } else if (step === "mrv") {
        await decideVerificationStage(selectedProject.id, "mrv", "pass", "MRV calculations, leakage, baseline and permanence reviewed.");
      } else if (step === "verifier") {
        await decideVerificationStage(selectedProject.id, "verifier", "approve", "Accredited verifier approves with digital signature.");
      } else if (step === "zicma") {
        await decideVerificationStage(selectedProject.id, "zicma", "approve", "ZiCMA approval letter digitally signed and registry update authorized.");
      }
      await loadProjectDetails(selectedProject.id);
      setMessage({ type: "success", text: `Verification step completed: ${step}.` });
    } catch (error: unknown) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Verification step failed." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section id="registry" className="enterprise-shell mx-auto max-w-7xl px-6 py-10">
      <div className="hero-band mb-6 flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-end">
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

      <div className="app-frame grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="nav-panel sticky top-6 h-fit rounded-lg border bg-white/90 p-4">
          <div className="mb-4 rounded-md bg-slate-900 p-4 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-200">National Platform</p>
            <strong className="mt-2 block text-xl">ZAI-CTS</strong>
            <span className="text-sm text-slate-300">Verification command centre</span>
          </div>
          <Stack spacing={1}>
            {workspaceLinks.map(([value, label, icon]) => (
              <button
                key={value.toString()}
                type="button"
                onClick={() => setActiveTab(value.toString())}
                className={`flex items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-bold transition ${
                  activeTab === value ? "bg-sky-100 text-zai-blue shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-zai-ink"
                }`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-sky-700 shadow-sm">{icon}</span>
                {label}
              </button>
            ))}
          </Stack>
          <Divider className="my-4" />
          <div className="rounded-md bg-sky-50 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Selected Project</span>
            <strong className="mt-2 block text-sm text-zai-ink">{selectedProject?.project_code ?? "None"}</strong>
            <p className="mt-1 text-xs leading-5 text-slate-600">{selectedProject?.title ?? "Register or select a project to begin."}</p>
          </div>
        </aside>

        <main>
          {message && (
            <Alert className="mb-6" severity={message.type}>
              {message.text}
            </Alert>
          )}

      {activeTab === "dashboard" ? (
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["Projects", projects.length],
              ["Credits", credits.length],
              ["Evidence", evidenceRecords.length],
              ["Open Actions", verificationCase?.outstanding_actions.length ?? 0]
            ].map(([label, value]) => (
              <Paper key={label.toString()} elevation={0} className="workspace-panel border p-5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
                <strong className="mt-2 block text-3xl text-zai-blue">{value}</strong>
              </Paper>
            ))}
          </div>
          <Paper elevation={0} className="workspace-panel border p-6">
            <Typography variant="h5" fontWeight={900}>
              Verification operations overview
            </Typography>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div>
                <Typography variant="h6" fontWeight={800}>Outstanding actions</Typography>
                <Stack spacing={1.5} className="mt-3">
                  {(verificationCase?.outstanding_actions.length ? verificationCase.outstanding_actions : ["Select a project and start verification."]).map((action) => (
                    <div key={action} className="rounded-lg border p-4 text-sm text-slate-700">{action}</div>
                  ))}
                </Stack>
              </div>
              <div>
                <Typography variant="h6" fontWeight={800}>Latest audit</Typography>
                <Stack spacing={1.5} className="mt-3">
                  {auditEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="rounded-lg border p-4">
                      <strong className="block text-zai-ink">{event.event_type}</strong>
                      <span className="text-sm text-slate-600">{event.action} - {event.outcome}</span>
                    </div>
                  ))}
                </Stack>
              </div>
            </div>
          </Paper>
        </div>
      ) : activeTab === "verification" ? (
        <Paper elevation={0} className="workspace-panel border p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <Typography variant="h5" fontWeight={900}>Verification case workflow</Typography>
              <p className="mt-3 max-w-3xl text-slate-600">
                Start a verification case, upload a complete evidence package, run automatic and AI validation, complete GIS/MRV/verifier/ZiCMA review, then issue credits.
              </p>
            </div>
            <Button variant="contained" startIcon={<AssignmentTurnedInIcon />} disabled={isLoading || !selectedProject} onClick={() => runVerificationStep("start")}>
              Start Verification
            </Button>
          </div>

          {selectedProject ? (
            <Stack spacing={4} className="mt-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-sky-50 p-4">
                  <strong className="block text-zai-ink">{verificationCase?.verification_id ?? "No case"}</strong>
                  <span className="text-sm text-slate-500">Verification ID</span>
                </div>
                <div className="rounded-lg bg-sky-50 p-4">
                  <strong className="block text-zai-ink">{verificationCase?.status ?? "not started"}</strong>
                  <span className="text-sm text-slate-500">Case status</span>
                </div>
                <div className="rounded-lg bg-sky-50 p-4">
                  <strong className="block text-zai-ink">{verificationCase?.assigned_verifier ?? "Not Assigned"}</strong>
                  <span className="text-sm text-slate-500">Assigned verifier</span>
                </div>
              </div>

              <Stepper activeStep={verificationCase ? Math.max(0, VERIFICATION_SEQUENCE.indexOf(verificationCase.status)) : 0} alternativeLabel>
                {["Evidence", "Auto", "AI", "GIS", "MRV", "Verifier", "ZiCMA", "Approved"].map((label) => (
                  <Step key={label}><StepLabel>{label}</StepLabel></Step>
                ))}
              </Stepper>

              <div className="grid gap-3 md:grid-cols-4">
                {[
                  ["Automatic", verificationCase?.automatic_validation_status ?? "not_started"],
                  ["AI", verificationCase?.ai_status ?? "not_started"],
                  ["GIS", verificationCase?.gis_status ?? "not_started"],
                  ["MRV", verificationCase?.mrv_status ?? "not_started"],
                  ["Verifier", verificationCase?.verifier_status ?? "not_started"],
                  ["ZiCMA", verificationCase?.zicma_status ?? "not_started"],
                  ["Integrity", verificationCase?.integrity_score ?? "-"],
                  ["Risk", verificationCase?.risk_score ?? "-"]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border bg-white p-4">
                    <strong className="block text-zai-ink">{value}</strong>
                    <span className="text-sm text-slate-500">{label}</span>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <Button variant="outlined" startIcon={<UploadFileIcon />} disabled={isLoading || !verificationCase} onClick={() => runVerificationStep("evidence")}>Upload Evidence</Button>
                <Button variant="outlined" disabled={isLoading || !verificationCase} onClick={() => runVerificationStep("automatic")}>Automatic Validation</Button>
                <Button variant="outlined" disabled={isLoading || !verificationCase} onClick={() => runVerificationStep("ai")}>AI Assessment</Button>
                <Button variant="outlined" disabled={isLoading || !verificationCase} onClick={() => runVerificationStep("gis")}>Approve GIS</Button>
                <Button variant="outlined" disabled={isLoading || !verificationCase} onClick={() => runVerificationStep("mrv")}>Pass MRV</Button>
                <Button variant="outlined" disabled={isLoading || !verificationCase} onClick={() => runVerificationStep("verifier")}>Verifier Approve</Button>
                <Button variant="contained" disabled={isLoading || !verificationCase} onClick={() => runVerificationStep("zicma")}>ZiCMA Approve</Button>
                <Button variant="contained" color="success" startIcon={<FactCheckIcon />} onClick={issueCredits} disabled={isLoading || verificationCase?.zicma_status !== "approve"}>
                  Issue Credits
                </Button>
              </div>

              {verificationAssessment && (
                <Alert severity={verificationAssessment.status === "pass" ? "success" : "warning"}>
                  {verificationAssessment.stage}: {verificationAssessment.status} - {verificationAssessment.findings.join(" ")}
                </Alert>
              )}
            </Stack>
          ) : (
            <Alert className="mt-6" severity="info">Select or register a project before starting verification.</Alert>
          )}
        </Paper>
      ) : activeTab === "registry" ? (
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
        <Paper elevation={0} className="workspace-panel border p-8">
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
              <Paper elevation={0} className="xl:col-span-2 border p-6">
                <Box component="form" onSubmit={submitSelectedGisEvidence}>
                  <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <Typography variant="h6" fontWeight={900}>
                        Submit GIS and MRV evidence
                      </Typography>
                      <p className="mt-1 text-sm text-slate-600">
                        Evidence is recorded in the immutable audit trail before GIS can be marked valid.
                      </p>
                    </div>
                    <Button type="submit" variant="contained" disabled={isLoading}>
                      Submit Evidence
                    </Button>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <TextField label="Boundary GeoJSON" value={gisEvidenceForm.boundary_geojson} onChange={(event) => updateGisEvidenceField("boundary_geojson", event.target.value)} multiline minRows={4} required />
                    <Stack spacing={2}>
                      <TextField label="Satellite scene ID" value={gisEvidenceForm.satellite_scene_id} onChange={(event) => updateGisEvidenceField("satellite_scene_id", event.target.value)} required />
                      <TextField label="Land-cover source" value={gisEvidenceForm.land_cover_source} onChange={(event) => updateGisEvidenceField("land_cover_source", event.target.value)} required />
                      <TextField label="Fire-alert source" value={gisEvidenceForm.fire_alert_source} onChange={(event) => updateGisEvidenceField("fire_alert_source", event.target.value)} required />
                    </Stack>
                    <TextField label="Field MRV reference" value={gisEvidenceForm.field_mrv_reference} onChange={(event) => updateGisEvidenceField("field_mrv_reference", event.target.value)} required />
                    <TextField label="Verifier notes" value={gisEvidenceForm.verifier_notes} onChange={(event) => updateGisEvidenceField("verifier_notes", event.target.value)} required />
                  </div>
                </Box>
              </Paper>

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
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Button variant="contained" color="success" onClick={() => decideGisValidation("valid")} disabled={isLoading || evidenceRecords.length === 0}>
                        Mark GIS Valid
                      </Button>
                      <Button variant="outlined" onClick={() => decideGisValidation("requires_revision")} disabled={isLoading || evidenceRecords.length === 0}>
                        Request Revision
                      </Button>
                      <Button variant="outlined" color="error" onClick={() => decideGisValidation("invalid")} disabled={isLoading || evidenceRecords.length === 0}>
                        Mark Invalid
                      </Button>
                    </Stack>
                  </>
                ) : (
                  <Alert severity="info">No GIS assessment has been run for this selected project yet.</Alert>
                )}
              </Stack>

              {gisAssessment && (
                <div className="xl:col-span-2 grid gap-4 lg:grid-cols-2">
                  <div className="lg:col-span-2">
                    <Typography variant="h6" fontWeight={800}>
                      Evidence ledger
                    </Typography>
                    <Stack spacing={1.5} className="mt-3">
                      {evidenceRecords.filter((record) => record.evidence_type.includes("gis")).length === 0 ? (
                        <Alert severity="info">No GIS evidence submitted yet.</Alert>
                      ) : (
                        evidenceRecords
                          .filter((record) => record.evidence_type.includes("gis"))
                          .map((record) => (
                            <div key={record.id} className="rounded-lg border p-4">
                              <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
                                <div>
                                  <strong className="block text-zai-ink">{record.evidence_type}</strong>
                                  <span className="text-sm text-slate-600">{record.status} - {new Date(record.created_at).toLocaleString()}</span>
                                </div>
                                <Chip size="small" label={record.status} color={record.status === "valid" ? "success" : "primary"} variant="outlined" />
                              </div>
                            </div>
                          ))
                      )}
                    </Stack>
                  </div>
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
        <Paper elevation={0} className="workspace-panel border p-8">
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
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button variant="contained" color="success" onClick={() => decideAiValidation("valid")} disabled={isLoading}>
                      Mark AI Valid
                    </Button>
                    <Button variant="outlined" onClick={() => decideAiValidation("requires_revision")} disabled={isLoading}>
                      Request Human Revision
                    </Button>
                    <Button variant="outlined" color="error" onClick={() => decideAiValidation("invalid")} disabled={isLoading}>
                      Reject AI Review
                    </Button>
                  </Stack>
                  <div>
                    <Typography variant="h6" fontWeight={800}>
                      AI validation ledger
                    </Typography>
                    <Stack spacing={1.5} className="mt-3">
                      {evidenceRecords.filter((record) => record.evidence_type.includes("ai")).length === 0 ? (
                        <Alert severity="info">AI review has not been human validated yet.</Alert>
                      ) : (
                        evidenceRecords
                          .filter((record) => record.evidence_type.includes("ai"))
                          .map((record) => (
                            <div key={record.id} className="rounded-lg border p-4">
                              <strong className="block text-zai-ink">{record.evidence_type}</strong>
                              <span className="text-sm text-slate-600">{record.status} - {new Date(record.created_at).toLocaleString()}</span>
                            </div>
                          ))
                      )}
                    </Stack>
                  </div>
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
        </main>
      </div>
    </section>
  );
}
