/**
 * KoraKeep Headless Auto-Sweep Bot
 * 
 * This script runs server-side (Node.js/Bun) to automatically reclaim
 * dust accounts without user interaction. It reads a private key from
 * environment variables and signs transactions internally.
 * 
 * Usage: npx ts-node scripts/auto-sweep.ts
 * 
 * Environment Variables:
 *   - KORA_OPERATOR_KEY: Base58 or JSON array of the operator wallet private key
 *   - HELIUS_RPC_URL: (Optional) Custom RPC endpoint
 *   - SAFE_MODE: (Optional) "true" to enable 24h protection (default: true)
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  createCloseAccountInstruction,
} from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';

// Constants
const WSOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
const RENT_PER_ACCOUNT = 0.00203928;
const BATCH_SIZE = 20;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// Sweep log file path
const LOG_FILE = path.join(process.cwd(), 'sweep-log.json');

interface DustAccount {
  address: string;
  mint: string;
  type: 'wSOL' | 'Token';
  balance: number;
  createdAt?: number;
  isProtected: boolean;
}

interface SweepLog {
  timestamp: string;
  signature: string;
  accountsClosed: number;
  solReclaimed: number;
  walletAddress: string;
  status: 'success' | 'partial' | 'failed';
  error?: string;
}

interface SweepHistory {
  lastSweep: string | null;
  totalReclaimed: number;
  totalAccountsClosed: number;
  logs: SweepLog[];
}

// ============ UTILITIES ============

function log(message: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') {
  const icons = { info: '📋', warn: '⚠️', error: '❌', success: '✅' };
  const timestamp = new Date().toISOString();
  console.log(`${icons[type]} [${timestamp}] ${message}`);
}

function parsePrivateKey(keyString: string): Uint8Array {
  // Try JSON array format first
  try {
    const parsed = JSON.parse(keyString);
    if (Array.isArray(parsed)) {
      return Uint8Array.from(parsed);
    }
  } catch {
    // Not JSON, try Base58
  }
  
  // Try Base58 format
  try {
    const bs58 = require('bs58');
    return bs58.decode(keyString);
  } catch {
    throw new Error('Invalid private key format. Use JSON array or Base58.');
  }
}

function loadSweepHistory(): SweepHistory {
  try {
    if (fs.existsSync(LOG_FILE)) {
      return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
    }
  } catch (error) {
    log('Could not load sweep history, starting fresh', 'warn');
  }
  return {
    lastSweep: null,
    totalReclaimed: 0,
    totalAccountsClosed: 0,
    logs: [],
  };
}

function saveSweepLog(entry: SweepLog, history: SweepHistory): void {
  history.logs.unshift(entry);
  history.lastSweep = entry.timestamp;
  if (entry.status === 'success' || entry.status === 'partial') {
    history.totalReclaimed += entry.solReclaimed;
    history.totalAccountsClosed += entry.accountsClosed;
  }
  // Keep only last 100 logs
  history.logs = history.logs.slice(0, 100);
  fs.writeFileSync(LOG_FILE, JSON.stringify(history, null, 2));
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============ CORE LOGIC ============

async function getAccountAge(
  connection: Connection,
  accountAddress: string
): Promise<number | null> {
  try {
    const pubkey = new PublicKey(accountAddress);
    const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 1 });
    if (signatures.length > 0 && signatures[0].blockTime) {
      return signatures[0].blockTime * 1000;
    }
  } catch (error) {
    log(`Could not fetch age for ${accountAddress}`, 'warn');
  }
  return null;
}

async function scanForDust(
  connection: Connection,
  walletPubkey: PublicKey,
  safeModeEnabled: boolean
): Promise<DustAccount[]> {
  log('Scanning for dust accounts...', 'info');
  
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPubkey, {
    programId: TOKEN_PROGRAM_ID,
  });

  log(`Found ${tokenAccounts.value.length} token accounts`, 'info');
  
  const dustAccounts: DustAccount[] = [];
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  for (const account of tokenAccounts.value) {
    const parsedData = account.account.data as any;
    const info = parsedData.parsed?.info;

    if (!info) continue;

    const mint = info.mint as string;
    const balance = info.tokenAmount?.uiAmount || 0;
    const isWsol = mint === WSOL_MINT.toBase58();

    // Check if this is a dust account
    const isDust = balance === 0 || (isWsol && balance < 0.001);

    if (isDust) {
      let createdAt: number | undefined;
      let isProtected = false;

      if (safeModeEnabled) {
        createdAt = (await getAccountAge(connection, account.pubkey.toBase58())) ?? undefined;
        if (createdAt && createdAt > oneDayAgo) {
          isProtected = true;
          log(`Protected: ${account.pubkey.toBase58()} (created < 24h ago)`, 'warn');
        }
      }

      dustAccounts.push({
        address: account.pubkey.toBase58(),
        mint,
        type: isWsol ? 'wSOL' : 'Token',
        balance,
        createdAt,
        isProtected,
      });
    }
  }

  const reclaimable = dustAccounts.filter((a) => !a.isProtected);
  log(`Found ${dustAccounts.length} dust accounts, ${reclaimable.length} reclaimable`, 'info');
  
  return dustAccounts;
}

async function reclaimDust(
  connection: Connection,
  keypair: Keypair,
  accounts: DustAccount[]
): Promise<{ success: boolean; closed: number; reclaimed: number; signatures: string[] }> {
  const toClose = accounts.filter((a) => !a.isProtected);
  
  if (toClose.length === 0) {
    log('No accounts to close', 'info');
    return { success: true, closed: 0, reclaimed: 0, signatures: [] };
  }

  log(`Closing ${toClose.length} accounts in batches of ${BATCH_SIZE}...`, 'info');
  
  let totalClosed = 0;
  const signatures: string[] = [];

  for (let i = 0; i < toClose.length; i += BATCH_SIZE) {
    const batch = toClose.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(toClose.length / BATCH_SIZE);
    
    log(`Processing batch ${batchNum}/${totalBatches} (${batch.length} accounts)`, 'info');

    const transaction = new Transaction();

    for (const account of batch) {
      const instruction = createCloseAccountInstruction(
        new PublicKey(account.address),
        keypair.publicKey, // destination - send rent back to wallet
        keypair.publicKey  // owner
      );
      transaction.add(instruction);
    }

    // Retry logic for network congestion
    let retries = 0;
    let signature: string | null = null;
    
    while (retries < MAX_RETRIES) {
      try {
        signature = await sendAndConfirmTransaction(connection, transaction, [keypair], {
          commitment: 'confirmed',
        });
        log(`Batch ${batchNum} confirmed: ${signature}`, 'success');
        signatures.push(signature);
        totalClosed += batch.length;
        break;
      } catch (error: any) {
        retries++;
        if (retries >= MAX_RETRIES) {
          log(`Batch ${batchNum} failed after ${MAX_RETRIES} retries: ${error.message}`, 'error');
          // Return partial success
          return {
            success: false,
            closed: totalClosed,
            reclaimed: totalClosed * RENT_PER_ACCOUNT,
            signatures,
          };
        }
        log(`Batch ${batchNum} failed, retrying (${retries}/${MAX_RETRIES})...`, 'warn');
        await sleep(RETRY_DELAY_MS * retries);
      }
    }
  }

  const reclaimedSol = totalClosed * RENT_PER_ACCOUNT;
  log(`Successfully closed ${totalClosed} accounts, reclaimed ${reclaimedSol.toFixed(4)} SOL`, 'success');
  
  return { success: true, closed: totalClosed, reclaimed: reclaimedSol, signatures };
}

// ============ MAIN ============

async function main() {
  console.log('\n🤖 KoraKeep Auto-Sweep Bot v1.0\n');
  console.log('═'.repeat(50));

  // Validate environment
  const privateKeyEnv = process.env.KORA_OPERATOR_KEY;
  if (!privateKeyEnv) {
    log('KORA_OPERATOR_KEY environment variable is required', 'error');
    process.exit(1);
  }

  const rpcUrl = process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com';
  const safeModeEnabled = process.env.SAFE_MODE !== 'false';

  log(`RPC: ${rpcUrl}`, 'info');
  log(`Safe Mode: ${safeModeEnabled ? 'Enabled' : 'Disabled'}`, 'info');

  // Parse private key
  let keypair: Keypair;
  try {
    const privateKey = parsePrivateKey(privateKeyEnv);
    keypair = Keypair.fromSecretKey(privateKey);
    log(`Wallet: ${keypair.publicKey.toBase58()}`, 'info');
  } catch (error: any) {
    log(`Failed to parse private key: ${error.message}`, 'error');
    process.exit(1);
  }

  // Connect to Solana
  const connection = new Connection(rpcUrl, 'confirmed');
  
  try {
    const balance = await connection.getBalance(keypair.publicKey);
    log(`Balance: ${(balance / 1e9).toFixed(4)} SOL`, 'info');
  } catch (error) {
    log('Failed to connect to Solana RPC', 'error');
    process.exit(1);
  }

  console.log('═'.repeat(50));

  // Load sweep history
  const history = loadSweepHistory();
  if (history.lastSweep) {
    log(`Last sweep: ${history.lastSweep}`, 'info');
  }

  // Scan for dust
  const dustAccounts = await scanForDust(connection, keypair.publicKey, safeModeEnabled);
  
  if (dustAccounts.length === 0) {
    log('No dust accounts found. Wallet is clean!', 'success');
    process.exit(0);
  }

  // Reclaim dust
  console.log('═'.repeat(50));
  const result = await reclaimDust(connection, keypair, dustAccounts);

  // Log results
  const logEntry: SweepLog = {
    timestamp: new Date().toISOString(),
    signature: result.signatures[0] || 'none',
    accountsClosed: result.closed,
    solReclaimed: result.reclaimed,
    walletAddress: keypair.publicKey.toBase58(),
    status: result.success ? 'success' : result.closed > 0 ? 'partial' : 'failed',
  };

  saveSweepLog(logEntry, history);

  console.log('═'.repeat(50));
  log(`Sweep complete!`, result.success ? 'success' : 'warn');
  log(`Accounts closed: ${result.closed}`, 'info');
  log(`SOL reclaimed: ${result.reclaimed.toFixed(4)}`, 'info');
  log(`Total lifetime reclaimed: ${history.totalReclaimed.toFixed(4)} SOL`, 'info');
  console.log('═'.repeat(50));

  process.exit(result.success ? 0 : 1);
}

main().catch((error) => {
  log(`Fatal error: ${error.message}`, 'error');
  process.exit(1);
});
