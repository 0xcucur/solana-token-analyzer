/**
 * Solana Token Analyzer — Config
 * 
 * Environment variables:
 *   HELIUS_RPC  — Solana RPC endpoint (required)
 */

// RPC endpoint — reads from env or uses placeholder
const HELIUS_RPC = process.env.HELIUS_RPC || 'https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY';

// Risk scoring weights
const RISK_WEIGHTS = {
  mintAuthority: 25,      // If mint authority exists = +25 risk
  freezeAuthority: 20,    // If freeze authority exists = +20 risk
  holderConcentration: 15,// Top 10 holding >80% = +15 risk
  lowLiquidity: 15,       // TVL < $10K = +15 risk
  lowHolders: 10,         // <100 holders = +10 risk
  newToken: 10,           // <7 days old = +10 risk
  noVerification: 5,      // Not verified on known platforms = +5 risk
};

// Verdict thresholds
const VERDICT = {
  SAFE: 30,      // Score <= 30 = AMAN
  CAUTION: 60,   // Score 31-60 = HATI-HATI
  // Score > 60 = RUG RISK TINGGI
};

module.exports = { HELIUS_RPC, RISK_WEIGHTS, VERDICT };
