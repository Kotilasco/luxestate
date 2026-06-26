"use client";

import React, { useState, useEffect } from "react";
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
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  getCurrentPricing,
  calculatePrice,
  getListings,
  findMatches,
  executeTrade,
  PricePoint,
  CreditListing,
  MatchResult,
} from "../services/marketplace";

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

export default function MarketplacePanel() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pricing State
  const [prices, setPrices] = useState<PricePoint[]>([]);
  const [calcQuantity, setCalcQuantity] = useState(1000);
  const [calcResult, setCalcResult] = useState<any>(null);

  // Listings State
  const [listings, setListings] = useState<CreditListing[]>([]);

  // Matching State
  const [buyerCountry, setBuyerCountry] = useState("Germany");
  const [targetScope, setTargetScope] = useState("scope_2");
  const [matches, setMatches] = useState<MatchResult[]>([]);

  // Trade State
  const [selectedListing, setSelectedListing] = useState<CreditListing | null>(null);
  const [tradeQuantity, setTradeQuantity] = useState(100);
  const [tradeResult, setTradeResult] = useState<any>(null);
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);

  useEffect(() => {
    loadPricing();
    loadListings();
  }, []);

  const loadPricing = async () => {
    try {
      const data = await getCurrentPricing();
      setPrices(data.prices);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadListings = async () => {
    try {
      const data = await getListings();
      setListings(data.listings);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError(null);
  };

  const handleCalculatePrice = async () => {
    setLoading(true);
    try {
      const result = await calculatePrice(
        "test-project-123",
        calcQuantity,
        2024,
        "authorized",
        "forestry"
      );
      setCalcResult(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFindMatches = async () => {
    setLoading(true);
    try {
      const result = await findMatches(
        "buyer-123",
        buyerCountry,
        { target_type: targetScope as "scope_1" | "scope_2" | "scope_3" },
        { min: 20, max: 40 },
        true
      );
      setMatches(result.matches);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteTrade = async () => {
    if (!selectedListing) return;
    setLoading(true);
    try {
      const result = await executeTrade(
        selectedListing.listing_id,
        "buyer-123",
        tradeQuantity,
        selectedListing.price_per_tco2e
      );
      setTradeResult(result);
      setTradeDialogOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openTradeDialog = (listing: CreditListing) => {
    setSelectedListing(listing);
    setTradeQuantity(100);
    setTradeDialogOpen(true);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h5" gutterBottom>
        Smart Marketplace & Pricing
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Dynamic Pricing" />
          <Tab label="Browse Listings" />
          <Tab label="AI Matching" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {loading && <LinearProgress />}

        {/* Dynamic Pricing Tab */}
        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" gutterBottom>
            Current Market Prices
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Real-time pricing based on global demand, NDC cycles, credit vintage, and authorization status.
          </Typography>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            {prices.slice(0, 4).map((price, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      {price.credit_type === "authorized" ? "Authorized (ITMO)" : "Voluntary"}
                    </Typography>
                    <Typography variant="h4" color="primary">
                      ${price.price_usd.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Vintage: {price.vintage_year}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        size="small"
                        label={`Demand: ${(price.factors.demand_factor * 100).toFixed(0)}%`}
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                      <Chip
                        size="small"
                        label={`Auth: ${(price.factors.authorization_premium * 100).toFixed(0)}%`}
                        color={price.credit_type === "authorized" ? "success" : "default"}
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Price Calculator
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Quantity (tCO2e)"
                value={calcQuantity}
                onChange={(e) => setCalcQuantity(Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="contained"
                onClick={handleCalculatePrice}
                disabled={loading}
              >
                Calculate Price
              </Button>
            </Grid>
          </Grid>

          {calcResult && (
            <Card sx={{ mt: 3, bgcolor: "success.light" }}>
              <CardContent>
                <Typography variant="h6">
                  Estimated Value: ${calcResult.total_value.toLocaleString()}
                </Typography>
                <Typography>
                  Price per tCO2e: ${calcResult.price_per_tco2e}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Factors: Base (${calcResult.factors.base_price}) × 
                  Vintage ({(calcResult.factors.vintage_factor * 100).toFixed(0)}%) × 
                  Demand ({(calcResult.factors.demand_factor * 100).toFixed(0)}%) × 
                  NDC ({(calcResult.factors.ndc_factor * 100).toFixed(0)}%) × 
                  Auth ({(calcResult.factors.authorization_premium * 100).toFixed(0)}%)
                </Typography>
              </CardContent>
            </Card>
          )}
        </TabPanel>

        {/* Browse Listings Tab */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Available Credit Listings
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Vintage</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Price/tCO2e</TableCell>
                  <TableCell>Authorization</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {listings.map((listing) => (
                  <TableRow key={listing.listing_id}>
                    <TableCell>{listing.project_name}</TableCell>
                    <TableCell>{listing.project_type}</TableCell>
                    <TableCell>{listing.vintage_year}</TableCell>
                    <TableCell>{listing.quantity_tco2e.toLocaleString()}</TableCell>
                    <TableCell>${listing.price_per_tco2e.toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={listing.credit_type}
                        color={listing.credit_type === "authorized" ? "success" : "default"}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => openTradeDialog(listing)}
                      >
                        Buy
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {tradeResult && (
            <Alert severity="success" sx={{ mt: 3 }}>
              Trade executed! Transaction: {tradeResult.transaction_hash}
            </Alert>
          )}
        </TabPanel>

        {/* AI Matching Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Bilateral Matching Agent
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            AI-powered matching of host country credits with buyer NDC targets.
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Buyer Country"
                value={buyerCountry}
                onChange={(e) => setBuyerCountry(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>NDC Target Scope</InputLabel>
                <Select value={targetScope} onChange={(e) => setTargetScope(e.target.value)}>
                  <MenuItem value="scope_1">Scope 1 (Direct)</MenuItem>
                  <MenuItem value="scope_2">Scope 2 (Electricity)</MenuItem>
                  <MenuItem value="scope_3">Scope 3 (Value Chain)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="contained"
                onClick={handleFindMatches}
                disabled={loading}
                fullWidth
              >
                Find Matches
              </Button>
            </Grid>
          </Grid>

          {matches.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom>
                Recommended Matches
              </Typography>
              <Grid container spacing={2}>
                {matches.map((match) => (
                  <Grid item xs={12} md={6} key={match.match_id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                          <Typography variant="h6">{match.project_name}</Typography>
                          <Chip
                            label={`${(match.compatibility_score * 100).toFixed(0)}% Match`}
                            color={match.compatibility_score > 0.8 ? "success" : "warning"}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Host: {match.host_country}
                        </Typography>
                        <Typography variant="body2">
                          Price: ${match.price_per_tco2e}/tCO2e | 
                          Available: {match.quantity_available.toLocaleString()} tCO2e
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            size="small"
                            label={`NDC Alignment: ${(match.ndc_alignment_score * 100).toFixed(0)}%`}
                            sx={{ mr: 1 }}
                          />
                          <Chip
                            size="small"
                            label={match.scope_match ? "Scope Match" : "Scope Mismatch"}
                            color={match.scope_match ? "success" : "error"}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic" }}>
                          {match.recommendation}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </TabPanel>
      </Paper>

      {/* Trade Dialog */}
      <Dialog open={tradeDialogOpen} onClose={() => setTradeDialogOpen(false)}>
        <DialogTitle>Execute Trade</DialogTitle>
        <DialogContent>
          {selectedListing && (
            <>
              <Typography gutterBottom>
                Project: {selectedListing.project_name}
              </Typography>
              <Typography gutterBottom>
                Price: ${selectedListing.price_per_tco2e}/tCO2e
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="Quantity (tCO2e)"
                value={tradeQuantity}
                onChange={(e) => setTradeQuantity(Number(e.target.value))}
                sx={{ mt: 2 }}
              />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Total: ${(tradeQuantity * selectedListing.price_per_tco2e).toLocaleString()}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTradeDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleExecuteTrade} disabled={loading}>
            Confirm Trade
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
