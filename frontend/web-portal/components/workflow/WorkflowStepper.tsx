"use client";

import { Box, Stepper, Step, StepLabel, StepContent, Typography, Chip, Paper, LinearProgress, Tooltip } from "@mui/material";
import {
  CheckCircle,
  RadioButtonUnchecked,
  HourglassEmpty,
  Block,
  PlayCircle,
  Assignment,
  Verified,
  AccountTree,
  Business,
  Gavel,
  Assessment,
  CloudUpload,
  Psychology,
  Map,
  Article,
  FactCheck,
  Policy,
  LocalAtm,
  SwapHoriz,
  Lock,
  Flag,
  AssessmentOutlined,
  Visibility,
} from "@mui/icons-material";

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  status: "not_started" | "in_progress" | "completed" | "blocked" | "skipped";
  completedAt?: string;
  assignedRole?: string;
  icon?: React.ReactNode;
}

// The complete 28-step national workflow
export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: "org_registration",
    label: "Organization Registration",
    description: "Register organization with KYB/KYC documentation",
    status: "not_started",
    assignedRole: "Project Developer",
    icon: <Business />,
  },
  {
    id: "org_approval",
    label: "Organization Approval",
    description: "Regulator review and approval of organization",
    status: "not_started",
    assignedRole: "Registry Officer",
    icon: <Gavel />,
  },
  {
    id: "account_creation",
    label: "Registry Account Creation",
    description: "Create credit holding account for organization",
    status: "not_started",
    assignedRole: "Registry Manager",
    icon: <AccountTree />,
  },
  {
    id: "project_registration",
    label: "Project Registration",
    description: "Register carbon project with methodology and boundaries",
    status: "not_started",
    assignedRole: "Project Developer",
    icon: <Assignment />,
  },
  {
    id: "project_validation",
    label: "Project Validation",
    description: "Methodology review, additionality, safeguards assessment",
    status: "not_started",
    assignedRole: "Accredited Validator",
    icon: <Assessment />,
  },
  {
    id: "project_approval",
    label: "Project Approval",
    description: "Regulator approval to proceed with implementation",
    status: "not_started",
    assignedRole: "Registry Officer",
    icon: <Verified />,
  },
  {
    id: "implementation",
    label: "Project Implementation",
    description: "On-ground project activities and monitoring setup",
    status: "not_started",
    assignedRole: "Project Developer",
    icon: <PlayCircle />,
  },
  {
    id: "monitoring_period",
    label: "Monitoring Period",
    description: "Data collection period for carbon measurements",
    status: "not_started",
    assignedRole: "MRV Officer",
    icon: <HourglassEmpty />,
  },
  {
    id: "monitoring_report",
    label: "Monitoring Report Submission",
    description: "Submit monitoring report with carbon calculations",
    status: "not_started",
    assignedRole: "Project Developer",
    icon: <Article />,
  },
  {
    id: "verification_case",
    label: "Verification Case Opened",
    description: "Initiate formal verification process",
    status: "not_started",
    assignedRole: "Accredited Verifier",
    icon: <Assignment />,
  },
  {
    id: "evidence_upload",
    label: "Evidence Package Upload",
    description: "Upload boundary, MRV, satellite, field evidence",
    status: "not_started",
    assignedRole: "Project Developer",
    icon: <CloudUpload />,
  },
  {
    id: "auto_validation",
    label: "Automatic Validation",
    description: "System checks completeness, formats, duplicates",
    status: "not_started",
    assignedRole: "System",
    icon: <FactCheck />,
  },
  {
    id: "ai_assessment",
    label: "AI Assessment",
    description: "AI review of documents, ownership, risk signals",
    status: "not_started",
    assignedRole: "AI Review Officer",
    icon: <Psychology />,
  },
  {
    id: "gis_review",
    label: "GIS Review",
    description: "Spatial validation of boundaries and forest cover",
    status: "not_started",
    assignedRole: "GIS Analyst",
    icon: <Map />,
  },
  {
    id: "mrv_review",
    label: "MRV Review",
    description: "Review calculations, baseline, leakage, permanence",
    status: "not_started",
    assignedRole: "MRV Officer",
    icon: <Article />,
  },
  {
    id: "verifier_decision",
    label: "Verifier Decision",
    description: "Accredited verifier independent assurance opinion",
    status: "not_started",
    assignedRole: "Accredited Verifier",
    icon: <Gavel />,
  },
  {
    id: "zicma_review",
    label: "ZiCMA Review",
    description: "Regulatory review and authorization",
    status: "not_started",
    assignedRole: "ZiCMA Administrator",
    icon: <Policy />,
  },
  {
    id: "credit_issuance",
    label: "Credit Issuance",
    description: "Issue serialized carbon credits to registry account",
    status: "not_started",
    assignedRole: "Registry Officer",
    icon: <Verified />,
  },
  {
    id: "credit_registry",
    label: "Credit Registry",
    description: "Credits recorded in national registry with serial numbers",
    status: "not_started",
    assignedRole: "Registry Manager",
    icon: <AccountTree />,
  },
  {
    id: "marketplace_listing",
    label: "Marketplace Listing",
    description: "List credits for sale on marketplace",
    status: "not_started",
    assignedRole: "Seller",
    icon: <LocalAtm />,
  },
  {
    id: "trading",
    label: "Trading",
    description: "Execute buy/sell transactions",
    status: "not_started",
    assignedRole: "Buyer/Seller",
    icon: <SwapHoriz />,
  },
  {
    id: "settlement",
    label: "Settlement",
    description: "Clear and settle transactions",
    status: "not_started",
    assignedRole: "Marketplace Operator",
    icon: <FactCheck />,
  },
  {
    id: "ownership_transfer",
    label: "Ownership Transfer",
    description: "Transfer credits to new owner",
    status: "not_started",
    assignedRole: "Registry Officer",
    icon: <SwapHoriz />,
  },
  {
    id: "retirement",
    label: "Retirement",
    description: "Permanently retire credits with certificate",
    status: "not_started",
    assignedRole: "Buyer",
    icon: <Lock />,
  },
  {
    id: "article6_auth",
    label: "Article 6 Authorization",
    description: "Host country authorization for ITMO transfer",
    status: "not_started",
    assignedRole: "ZiCMA Administrator",
    icon: <Flag />,
  },
  {
    id: "corresponding_adjustment",
    label: "Corresponding Adjustment",
    description: "Record NDC adjustment for Article 6 transfers",
    status: "not_started",
    assignedRole: "ZiCMA Administrator",
    icon: <AssessmentOutlined />,
  },
  {
    id: "national_reporting",
    label: "National Reporting",
    description: "Report to UNFCCC and national climate inventory",
    status: "not_started",
    assignedRole: "ZiCMA Administrator",
    icon: <Assessment />,
  },
  {
    id: "long_term_monitoring",
    label: "Long-Term Monitoring",
    description: "Ongoing monitoring for permanence and reversals",
    status: "not_started",
    assignedRole: "MRV Officer",
    icon: <Visibility />,
  },
];

interface WorkflowStepperProps {
  steps?: WorkflowStep[];
  currentStepId?: string;
  projectStatus?: string;
  compact?: boolean;
}

const statusConfig = {
  not_started: { color: "default", icon: <RadioButtonUnchecked />, label: "Not Started" },
  in_progress: { color: "primary", icon: <HourglassEmpty />, label: "In Progress" },
  completed: { color: "success", icon: <CheckCircle />, label: "Completed" },
  blocked: { color: "error", icon: <Block />, label: "Blocked" },
  skipped: { color: "default", icon: <RadioButtonUnchecked />, label: "Skipped" },
};

export function WorkflowStepper({ steps = WORKFLOW_STEPS, currentStepId, projectStatus, compact = false }: WorkflowStepperProps) {
  // Calculate progress
  const completedSteps = steps.filter((s) => s.status === "completed").length;
  const progress = Math.round((completedSteps / steps.length) * 100);

  // Find active step index
  const activeStep = currentStepId ? steps.findIndex((s) => s.id === currentStepId) : completedSteps;

  if (compact) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Workflow Progress
          </Typography>
          <Chip size="small" label={`${completedSteps}/${steps.length} steps`} color="primary" variant="outlined" />
          <Box sx={{ flex: 1 }} />
          <Typography variant="h6" fontWeight={700} color="primary">
            {progress}%
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 1 }} />
        {currentStepId && (
          <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Current:
            </Typography>
            <Typography variant="caption" fontWeight={600}>
              {steps.find((s) => s.id === currentStepId)?.label}
            </Typography>
          </Box>
        )}
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Project Lifecycle
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {steps.length} stages from organization registration to long-term monitoring
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="h4" fontWeight={800} color="primary">
            {progress}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {completedSteps} of {steps.length} completed
          </Typography>
        </Box>
      </Box>

      <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 2, mb: 3 }} />

      <Stepper activeStep={activeStep} orientation="vertical" nonLinear>
        {steps.map((step, index) => {
          const config = statusConfig[step.status];
          const isActive = step.id === currentStepId;

          return (
            <Step key={step.id} completed={step.status === "completed"} active={isActive}>
              <StepLabel
                StepIconComponent={() => (
                  <Tooltip title={config.label}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        bgcolor:
                          step.status === "completed"
                            ? "success.main"
                            : isActive
                            ? "primary.main"
                            : "grey.300",
                        color: step.status === "not_started" && !isActive ? "text.secondary" : "white",
                      }}
                    >
                      {step.status === "completed" ? <CheckCircle fontSize="small" /> : step.icon || <RadioButtonUnchecked fontSize="small" />}
                    </Box>
                  </Tooltip>
                )}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography
                    variant="body1"
                    fontWeight={isActive ? 700 : step.status === "completed" ? 600 : 400}
                    color={isActive ? "primary" : step.status === "completed" ? "success" : "text.primary"}
                  >
                    {step.label}
                  </Typography>
                  <Chip size="small" label={config.label} color={config.color as any} sx={{ height: 20, fontSize: "0.65rem" }} />
                </Box>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {step.description}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {step.assignedRole && (
                    <Chip size="small" icon={<Business fontSize="small" />} label={`Role: ${step.assignedRole}`} variant="outlined" sx={{ height: 24 }} />
                  )}
                  {step.completedAt && (
                    <Chip
                      size="small"
                      label={`Completed: ${new Date(step.completedAt).toLocaleDateString()}`}
                      variant="outlined"
                      sx={{ height: 24 }}
                    />
                  )}
                </Box>
              </StepContent>
            </Step>
          );
        })}
      </Stepper>
    </Paper>
  );
}

// Map project status to workflow step
export function getWorkflowStepFromProjectStatus(status: string): string {
  const statusMap: Record<string, string> = {
    draft: "project_registration",
    submitted_for_validation: "project_validation",
    validated: "project_approval",
    approved: "implementation",
    submitted_for_verification: "verification_case",
    under_verification: "evidence_upload",
    verified: "credit_issuance",
    credits_issued: "credit_registry",
    listed: "marketplace_listing",
    retired: "retirement",
    suspended: "blocked",
    rejected: "blocked",
  };
  return statusMap[status] || "project_registration";
}
