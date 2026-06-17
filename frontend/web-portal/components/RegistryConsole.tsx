"use client";

import AddCircleIcon from "@mui/icons-material/AddCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import SendIcon from "@mui/icons-material/Send";
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
  TextField,
  Typography
} from "@mui/material";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  CarbonProject,
  fetchGatewayHealth,
  listCarbonProjects,
  registerCarbonProject
} from "../services/carbonRegistry";

const bootstrapOrganizationId = "11111111-1111-4111-8111-111111111111";

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
  const randomCode = Math.floor(20260000 + Math.random() * 9999);
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

export default function RegistryConsole() {
  const [health, setHealth] = useState<string>("checking");
  const [projects, setProjects] = useState<CarbonProject[]>([]);
  const [form, setForm] = useState<FormState>(() => createInitialForm());
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const projectCount = useMemo(() => projects.length, [projects]);

  async function refreshProjects() {
    const [healthResponse, projectResponse] = await Promise.all([
      fetchGatewayHealth(),
      listCarbonProjects()
    ]);
    setHealth(`${healthResponse.status} (${healthResponse.service})`);
    setProjects(projectResponse);
  }

  useEffect(() => {
    refreshProjects().catch((error: unknown) => {
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
      setProjects((current) => [created, ...current.filter((project) => project.id !== created.id)]);
      setForm(createInitialForm());
      setMessage({ type: "success", text: `Registered project ${created.project_code} as ${created.status}.` });
    } catch (error: unknown) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Project registration failed." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section id="registry" className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <span className="rounded-full bg-sky-100 px-4 py-2 text-sm font-bold uppercase tracking-wider text-zai-blue">
            Live Carbon Registry
          </span>
          <h2 className="mt-5 text-4xl font-bold text-zai-ink">Register and review carbon projects</h2>
          <p className="mt-3 max-w-3xl text-slate-600">
            This console is wired to the Dockerized API Gateway and FastAPI Carbon Registry service.
          </p>
        </div>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip color={health.startsWith("healthy") ? "success" : "warning"} label={`Gateway: ${health}`} />
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refreshProjects()}>
            Refresh
          </Button>
        </Stack>
      </div>

      {message && (
        <Alert className="mb-6" severity={message.type}>
          {message.text}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Paper elevation={0} className="border p-6">
          <Box component="form" onSubmit={submitProject}>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={800}>
                New project registration
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

        <Paper elevation={0} className="border p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <Typography variant="h6" fontWeight={800}>
                Registry projects
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {projectCount} project{projectCount === 1 ? "" : "s"} currently returned by the registry.
              </Typography>
            </div>
            <AddCircleIcon className="text-sky-600" />
          </div>
          <Divider />
          <Stack spacing={2} className="mt-5">
            {projects.length === 0 ? (
              <Alert severity="info">No projects registered yet. Use the form to create one.</Alert>
            ) : (
              projects.map((project) => (
                <article key={project.id} className="rounded-lg border p-5 transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-md">
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <Typography variant="h6" fontWeight={800}>
                        {project.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {project.project_code} - {project.district}, {project.province}
                      </Typography>
                    </div>
                    <Chip label={project.status} color="primary" variant="outlined" />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{project.description}</p>
                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                    <div className="rounded-md bg-sky-50 p-3">
                      <strong className="block text-zai-ink">{project.estimated_annual_tco2e}</strong>
                      <span className="text-slate-500">Annual tCO2e</span>
                    </div>
                    <div className="rounded-md bg-sky-50 p-3">
                      <strong className="block text-zai-ink">{project.crediting_period_years} years</strong>
                      <span className="text-slate-500">Crediting period</span>
                    </div>
                    <div className="rounded-md bg-sky-50 p-3">
                      <strong className="block text-zai-ink">{project.methodology}</strong>
                      <span className="text-slate-500">Methodology</span>
                    </div>
                  </div>
                </article>
              ))
            )}
          </Stack>
        </Paper>
      </div>
    </section>
  );
}
