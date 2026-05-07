/**
 * Solana Token Analyzer CLI
 * 
 * Analyze Solana tokens: rug check, holders, liquidity, risk score.
 * 
 * Usage: node analyze.js <TOKEN_MINT_ADDRESS>
 * 
 * Flow:
 *   1. Fetch token metadata from Helius
 *   2. Fetch holder distribution
 *   3. Check mint/freeze authority
 *   4. Analyze liquidity (via Meteora/Jupiter)
 *   5. Calculate risk score
 *   6. Output verdict
 */

let config;
try {
  config = require('./config');
} catch {
  config = require('./config.example');
}
const { HELIUS_RPC, RISK_WEIGHTS, VERDICT } = config;
const { Connection, PublicKey } = require('@solana/web3.js');

// ─── HELIUS RPC ───
async function heliusRpc(method, params = []) {
  const res = await fetch(HELIUS_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`RPC Error: ${data.error.message}`);
  return data.result;
}

// ─── TOKEN METADATA ───
async function getTokenMetadata(mintAddress) {
  // Get account info
  const accountInfo = await heliusRpc('getAccountInfo', [
    mintAddress,
    { encoding: 'jsonParsed' },
  ]);

  if (!accountInfo?.value) throw new Error('Token not found');

  const data = accountInfo.value.data.parsed.info;
  return {
    mint: mintAddress,
    name: data.name || 'Unknown',
    symbol: data.symbol || '???',
    supply: parseFloat(data.supply) / Math.pow(10, data.decimals),
    decimals: data.decimals,
    mintAuthority: data.mintAuthority,
    freezeAuthority: data.freezeAuthority,
  };
}

// ─── HOLDER ANALYSIS ───
async function getHolderAnalysis(mintAddress) {
  try {
    const largestAccounts = await heliusRpc('getTokenLargestAccounts', [mintAddress]);
    const accounts = largestAccounts.value || [];

    let totalHeld = 0;
    const top10 = accounts.slice(0, 10);
    for (const acc of top10) {
      totalHeld += parseFloat(acc.uiAmountString || '0');
    }

    return {
      totalAccounts: accounts.length,
      top10Held: totalHeld,
      top10Amount: totalHeld,
      accounts: accounts.slice(0, 5).map(a => ({
        address: a.address,
        amount: parseFloat(a.uiAmountString || '0'),
      })),
    };
  } catch {
    return { totalAccounts: 0, top10Held: 0, top10Amount: 0, accounts: [] };
  }
}

// ─── LIQUIDITY CHECK ───
async function getLiquidityInfo(mintAddress) {
  try {
    // Check via Jupiter quote for a small swap
    const quoteUrl = `https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${mintAddress}&amount=100000000&slippageBps=500`;
    const res = await fetch(quoteUrl);
    const data = await res.json();

    if (data.error) {
      return { available: false, reason: data.error };
    }

    const priceImpact = parseFloat(data.priceImpactPct || '0');
    return {
      available: true,
      priceImpact,
      outAmount: data.outAmount,
      routes: (data.routePlan || []).length,
      deepLiquidity: priceImpact < 1, // <1% impact = good liquidity
    };
  } catch (e) {
    return { available: false, reason: e.message };
  }
}

// ─── RISK SCORING ───
function calculateRiskScore(metadata, holders, liquidity) {
  let score = 0;
  const flags = [];

  // Mint authority check
  if (metadata.mintAuthority) {
    score += RISK_WEIGHTS.mintAuthority;
    flags.push('⚠️ Mint authority ACTIVE — supply can be inflated');
  }

  // Freeze authority check
  if (metadata.freezeAuthority) {
    score += RISK_WEIGHTS.freezeAuthority;
    flags.push('⚠️ Freeze authority ACTIVE — accounts can be frozen');
  }

  // Holder concentration
  if (holders.top10Amount > metadata.supply * 0.8) {
    score += RISK_WEIGHTS.holderConcentration;
    flags.push('⚠️ Top 10 holders own >80% of supply');
  }

  // Low holder count
  if (holders.totalAccounts < 100) {
    score += RISK_WEIGHTS.lowHolders;
    flags.push(`⚠️ Only ${holders.totalAccounts} holders`);
  }

  // Liquidity check
  if (!liquidity.available) {
    score += RISK_WEIGHTS.lowLiquidity;
    flags.push('⚠️ No liquidity found on Jupiter');
  } else if (!liquidity.deepLiquidity) {
    score += 10;
    flags.push(`⚠️ Low liquidity (price impact: ${liquidity.priceImpact.toFixed(2)}%)`);
  }

  return { score: Math.min(score, 100), flags };
}

// ─── VERDICT ───
function getVerdict(score) {
  if (score <= VERDICT.SAFE) {
    return { emoji: '✅', text: 'AMAN', color: 'green' };
  } else if (score <= VERDICT.CAUTION) {
    return { emoji: '⚠️', text: 'HATI-HATI', color: 'yellow' };
  } else {
    return { emoji: '🔴', text: 'RUG RISK TINGGI', color: 'red' };
  }
}

// ─── DISPLAY ───
function displayResults(metadata, holders, liquidity, risk) {
  const verdict = getVerdict(risk.score);

  console.log(`\n🔍 Analyzing: ${metadata.mint}`);
  console.log('━'.repeat(50));
  console.log(`📋 Token: ${metadata.name} (${metadata.symbol})`);
  console.log(`💰 Supply: ${metadata.supply.toLocaleString()}`);

  console.log('\n🔒 Security');
  console.log(`  Mint Authority:    ${metadata.mintAuthority ? '🔴 ACTIVE' : '✅ Revoked'}`);
  console.log(`  Freeze Authority:  ${metadata.freezeAuthority ? '🔴 ACTIVE' : '✅ Revoked'}`);

  console.log('\n👥 Holders');
  console.log(`  Top accounts:      ${holders.totalAccounts}`);
  if (holders.accounts.length > 0) {
    console.log('  Largest holders:');
    for (const h of holders.accounts.slice(0, 3)) {
      console.log(`    ${h.address.slice(0, 8)}...${h.address.slice(-4)} — ${h.amount.toLocaleString()}`);
    }
  }

  console.log('\n💧 Liquidity');
  if (liquidity.available) {
    console.log(`  Available:         ✅ Yes`);
    console.log(`  Price Impact:      ${liquidity.priceImpact.toFixed(2)}%`);
    console.log(`  Routes:            ${liquidity.routes}`);
    console.log(`  Deep Liquidity:    ${liquidity.deepLiquidity ? '✅' : '❌'}`);
  } else {
    console.log(`  Available:         ❌ No`);
    console.log(`  Reason:            ${liquidity.reason}`);
  }

  if (risk.flags.length > 0) {
    console.log('\n🚩 Risk Flags:');
    for (const flag of risk.flags) {
      console.log(`  ${flag}`);
    }
  }

  console.log(`\n🎯 Risk Score: ${risk.score}/100`);
  console.log(`${verdict.emoji} VERDIKT: ${verdict.text}`);
  console.log('');
}

// ─── MAIN ───
async function main() {
  const mintAddress = process.argv[2];

  if (!mintAddress) {
    console.log('Usage: node analyze.js <TOKEN_MINT_ADDRESS>');
    console.log('Example: node analyze.js EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
    process.exit(1);
  }

  // Validate address format
  try {
    new PublicKey(mintAddress);
  } catch {
    console.error('❌ Invalid Solana address');
    process.exit(1);
  }

  console.log('🔄 Fetching token data...');

  const [metadata, holders, liquidity] = await Promise.all([
    getTokenMetadata(mintAddress),
    getHolderAnalysis(mintAddress),
    getLiquidityInfo(mintAddress),
  ]);

  const risk = calculateRiskScore(metadata, holders, liquidity);
  displayResults(metadata, holders, liquidity, risk);
}

main().catch((e) => {
  console.error(`❌ Error: ${e.message}`);
  process.exit(1);
});
