"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import VerifiedIcon from "@mui/icons-material/Verified";
import LinkIcon from "@mui/icons-material/Link";
import RefreshIcon from "@mui/icons-material/Refresh";
import SendIcon from "@mui/icons-material/Send";
import ShieldIcon from "@mui/icons-material/Shield";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import {
  anchorUnanchoredBatch,
  AnchorResult,
  AnchorVerification,
  getUnanchoredCount,
  reconcileAnchorChain,
  verifyAnchor,
} from "../services/carbonRegistry";

function shortenHash(hash: string) {
  if (!hash) return "—";
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}…${hash.slice(-8)}`;
}

export default function AnchorDashboard() {
  const [unanchoredCount, setUnanchoredCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(true);

  const [anchorResult, setAnchorResult] = useState<AnchorResult | null>(null);
  const [anchoring, setAnchoring] = useState(false);
  const [batchName, setBatchName] = useState("");

  const [anchorId, setAnchorId] = useState("");
  const [verifyResult, setVerifyResult] = useState<AnchorVerification | null>(null);
  const [verifying, setVerifying] = useState(false);

  const [chainResult, setChainResult] = useState<Array<AnchorVerification & { chain_continuous?: boolean }> | null>(null);
  const [reconciling, setReconciling] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const refreshCount = async () => {
    setLoadingCount(true);
    try {
      const data = await getUnanchoredCount();
      setUnanchoredCount(data.unanchored_count);
    } catch (e: any) {
      setError(e?.message || "Failed to load unanchored count");
    } finally {
      setLoadingCount(false);
    }
  };

  useEffect(() => {
    refreshCount();
  }, []);

  const handleAnchor = async () => {
    setError(null);
    setAnchorResult(null);
    setAnchoring(true);
    try {
      const result = await anchorUnanchoredBatch(batchName || undefined);
      setAnchorResult(result);
      await refreshCount();
    } catch (e: any) {
      setError(e?.message || "Anchor failed");
    } finally {
      setAnchoring(false);
    }
  };

  const handleVerify = async () => {
    if (!anchorId.trim()) return;
    setError(null);
    setVerifyResult(null);
    setVerifying(true);
    try {
      const result = await verifyAnchor(anchorId.trim());
      setVerifyResult(result);
    } catch (e: any) {
      setError(e?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleReconcile = async () => {
    setError(null);
    setChainResult(null);
    setReconciling(true);
    try {
      const result = await reconcileAnchorChain();
      setChainResult(result);
    } catch (e: any) {
      setError(e?.message || "Reconciliation failed");
    } finally {
      setReconciling(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a", mb: 1 }}>
        Blockchain Anchoring
      </Typography>
      <Typography variant="body2" sx={{ color: "#64748b", mb: 3 }}>
        Merkle root anchoring keeps a tamper-evident chain of credit hashes inside PostgreSQL.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Stats */}
        <Paper elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", borderRadius: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <ShieldIcon sx={{ color: "#0d9488" }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {loadingCount ? <CircularProgress size={18} /> : unanchoredCount ?? 0}
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b" }}>
                Unanchored credit entries
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Anchor Batch */}
        <Paper elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Create Anchor Batch
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="Batch name (optional)"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              startIcon={anchoring ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
              onClick={handleAnchor}
              disabled={anchoring || (unanchoredCount ?? 0) === 0}
              sx={{
                background: "linear-gradient(90deg,#0d9488,#0f766e)",
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Anchor Now
            </Button>
          </Stack>

          {anchorResult && (
            <Card variant="outlined" sx={{ mt: 2, borderRadius: 2 }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Anchor created successfully
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    ID: {anchorResult.anchor_id}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    Entries anchored: {anchorResult.entry_count}
                  </Typography>
                  <Tooltip title={anchorResult.merkle_root}>
                    <Typography variant="caption" sx={{ color: "#0d9488", fontFamily: "monospace" }}>
                      Merkle root: {shortenHash(anchorResult.merkle_root)}
                    </Typography>
                  </Tooltip>
                  <Tooltip title={anchorResult.anchor_hash}>
                    <Typography variant="caption" sx={{ color: "#64748b", fontFamily: "monospace" }}>
                      Chain hash: {shortenHash(anchorResult.anchor_hash)}
                    </Typography>
                  </Tooltip>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    Mock Fabric TX: {anchorResult.fabric_tx_id}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Paper>

        {/* Verify Single Anchor */}
        <Paper elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Verify Anchor
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="Anchor ID"
              value={anchorId}
              onChange={(e) => setAnchorId(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
            />
            <Button
              variant="outlined"
              startIcon={verifying ? <CircularProgress size={16} /> : <VerifiedIcon />}
              onClick={handleVerify}
              disabled={verifying || !anchorId.trim()}
              sx={{ textTransform: "none", fontWeight: 600, borderColor: "#0d9488", color: "#0d9488" }}
            >
              Verify
            </Button>
          </Stack>

          {verifyResult && (
            <Alert
              severity={verifyResult.is_valid ? "success" : "error"}
              icon={verifyResult.is_valid ? <VerifiedIcon /> : <WarningAmberIcon />}
              sx={{ mt: 2 }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {verifyResult.is_valid ? "Anchor verified" : "Anchor tampered"}
              </Typography>
              <Typography variant="caption" display="block" sx={{ fontFamily: "monospace" }}>
                Stored: {shortenHash(verifyResult.stored_root)}
              </Typography>
              <Typography variant="caption" display="block" sx={{ fontFamily: "monospace" }}>
                Recomputed: {shortenHash(verifyResult.recomputed_root)}
              </Typography>
            </Alert>
          )}
        </Paper>

        {/* Reconcile Chain */}
        <Paper elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", borderRadius: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Reconcile Chain
            </Typography>
            <Button
              variant="outlined"
              startIcon={reconciling ? <CircularProgress size={16} /> : <RefreshIcon />}
              onClick={handleReconcile}
              disabled={reconciling}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Run Reconciliation
            </Button>
          </Stack>

          {reconciling && <LinearProgress sx={{ mb: 2 }} />}

          {chainResult && (
            <Stack spacing={2}>
              {chainResult.length === 0 ? (
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  No anchors found.
                </Typography>
              ) : (
                chainResult.map((item, idx) => (
                  <Card key={idx} variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <LinkIcon sx={{ color: "#0d9488", fontSize: 18 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Anchor {idx + 1}
                        </Typography>
                        <Chip
                          size="small"
                          label={item.is_valid ? "Valid" : "Tampered"}
                          color={item.is_valid ? "success" : "error"}
                          sx={{ fontWeight: 600 }}
                        />
                        {item.chain_continuous === false && (
                          <Chip
                            size="small"
                            label="Chain Break"
                            color="warning"
                            sx={{ fontWeight: 600 }}
                          />
                        )}
                      </Stack>
                      <Typography variant="caption" display="block" sx={{ fontFamily: "monospace", color: "#64748b" }}>
                        {shortenHash(item.stored_root ?? "")}
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ color: "#64748b" }}>
                        Entries: {item.entry_count} · Fabric TX: {item.fabric_tx_id}
                      </Typography>
                    </CardContent>
                  </Card>
                ))
              )}
            </Stack>
          )}
        </Paper>
      </Stack>
    </Box>
  );
}
