# Solana Token Analyzer CLI

A command-line tool to analyze Solana tokens before buying — rug check, holder distribution, liquidity depth, and risk scoring.

## Features

- 🔍 **Rug Pull Detection** — Check mint/freeze authority
- 👥 **Holder Analysis** — Top holder concentration
- 💧 **Liquidity Check** — Pool depth via Jupiter quotes
- 🎯 **Risk Score** — 0-100 score with clear verdict (AMAN / HATI-HATI / RUG)

## Requirements

- Node.js 18+
- Helius API key (free tier works)

## Setup

```bash
npm install
cp config.example.js config.js
# Edit config.js with your Helius API key
node analyze.js <TOKEN_MINT_ADDRESS>
```

## Usage

```bash
# Analyze a token
node analyze.js <TOKEN_MINT_ADDRESS>

# Example
node analyze.js EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

## Output Example

```
🔍 Analyzing: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Token: USD Coin (USDC)
💰 Supply: 1,000,000,000

🔒 Security
  Mint Authority:    ✅ Revoked
  Freeze Authority:  ✅ Revoked

👥 Holders
  Top accounts:      10
  Largest holders:
    ABCD1234...5678 — 500,000,000

💧 Liquidity
  Available:         ✅ Yes
  Price Impact:      0.05%
  Routes:            2
  Deep Liquidity:    ✅

🎯 Risk Score: 5/100
✅ VERDIKT: AMAN
```

## License

MIT
