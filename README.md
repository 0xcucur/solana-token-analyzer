# Solana Token Analyzer CLI

A command-line tool to analyze Solana tokens before buying — rug check, holder distribution, liquidity depth, and risk scoring.

## Features

- 🔍 **Rug Pull Detection** — Check mint/freeze authority, LP lock status
- 👥 **Holder Analysis** — Distribution, top holder concentration, dev wallets
- 💧 **Liquidity Check** — Pool depth, TVL, volume ratio
- 🎯 **Risk Score** — 0-100 score with clear verdict (AMAN / HATI-HATI / RUG)

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
  LP Lock:           ✅ Locked

👥 Holders
  Total Holders:     2,450,000
  Top 10 Concentration: 45.2%
  Dev Wallet:        0.01%

💧 Liquidity
  TVL:              $180,000,000
  24h Volume:       $50,000,000
  Vol/TVL Ratio:    0.28

🎯 Risk Score: 5/100
✅ VERDIKT: AMAN — Token verified, authority revoked, high liquidity
```

## Requirements

- Node.js 18+
- Helius API key (free tier works)

## Setup

```bash
npm install
cp config.example.js config.js
# Edit config.js with your Helius API key
node analyze.js <TOKEN_ADDRESS>
```

## License

MIT
