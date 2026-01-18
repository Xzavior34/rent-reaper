
# 🛡️ KoraKeep: Automated Rent Reclamation Terminal

> **Winner** of the Kora Rent Reclaim Bounty Challenge.
> A hybrid, safety-first terminal for monitoring and automatically reclaiming rent-locked SOL from abandoned Kora Node accounts.

[![KoraKeep Dashboard]](https://solana-security-secrets-8xj6.vercel.app/)

## 🚨 The Problem: The "Silent Leak" in Kora Nodes

Kora nodes facilitate gasless transactions by sponsoring accounts and wrapping SOL. While this creates a seamless user experience, it introduces a hidden operational cost: **Rent Leakage**.

When a Kora node (or any relayer) operates, it often creates:
1. **Temporary wSOL Accounts:** Used to unwrap SOL for fees.
2. **Token Accounts:** Created for intermediate transfers.

If a transaction fails or a cleanup instruction is missed, these accounts remain open on-chain. Each open account locks approximately **0.002039 SOL** in "Rent". For a high-volume operator, thousands of these "dust" accounts can silently lock up substantial capital in the treasury.

## ⚡ The Solution: KoraKeep

**KoraKeep** is a unified solution that solves this problem in two ways:

1. **Manual Command Center:** A beautiful, non-custodial dashboard for visual auditing and one-click sweeps.
2. **🤖 Headless Autopilot:** A server-side bot that runs 24/7 to reclaim rent automatically without human intervention.

### Key Features

* **🤖 Zero-Touch Automation:** Includes a backend worker script (Cron) that wakes up every 6 hours, scans for leaks, and reclaims funds silently.
* **🕵️ Deep-Scan Logic:** Inspects all token accounts owned by the wallet to identify "Dust" (Empty wSOL or Token Accounts with 0 balance).
* **🛡️ Safe Mode Protocol:** Automatically fetches on-chain transaction history for every candidate account. **If an account was active in the last 24 hours, it is strictly ignored** to prevent accidental closure of pending transactions.
* **🔋 Batch Processing:** Uses Solana's transaction batching to close up to 20 accounts in a single signature, maximizing efficiency.

## 🛠️ Technical Implementation

KoraKeep uses a **Hybrid Architecture** to ensure both ease of use and maximum uptime.

### 1. The Detection Engine (Shared Logic)

Both the UI and the Bot use the same filtering logic to identify dust:

```typescript
const isDust = (account) => {
  // Condition 1: Wrapped SOL with no native balance
  const isEmptyWSOL = (mint === WSOL_MINT && amount < 0.00203928);
  // Condition 2: Empty Token Account
  const isEmptyToken = (amount === 0);
  return isEmptyWSOL || isEmptyToken;
};

```

### 2. The Safety Layer (Critical)

Before adding an account to the "Kill List", KoraKeep performs a liveness check. This runs on both the client (React) and server (Node.js):

```typescript
const history = await connection.getSignaturesForAddress(pubkey, { limit: 1 });
if (history.length > 0) {
    const lastTxTime = history[0].blockTime;
    const isTooNew = (Date.now() / 1000 - lastTxTime) < 86400; // 24 Hours
    if (isTooNew) return "SKIPPED_SAFETY_LOCK";
}

```

### 3. The Headless Signer

For the automated bot, KoraKeep uses a secure backend route that signs transactions internally using a `KORA_OPERATOR_KEY`. This route is protected by a secret CRON header to prevent unauthorized triggers.

## 🚀 Quick Start

### Prerequisites

* Node.js v18+
* A Solana Wallet (Phantom, Solflare)
* (Optional) A dedicated "Operator" wallet for the bot.

### Installation

```bash
# Clone the repository
git clone https://github.com/Xzavior34/rent-reaper.git

# Enter the directory
cd rent-reaper

# Install dependencies
npm install

# Run the development server (UI only)
npm run dev

```

### Option A: Manual Usage (Dashboard)

1. Open the app at `http://localhost:3000`.
2. **Connect Wallet:** Select your Kora Operator wallet.
3. **Scan & Sweep:** Visualize leaks and click "Reclaim" to sign with your browser wallet.

### Option B: Enable Automation (The Bot)

To let KoraKeep run while you sleep, set up the backend worker:

1. **Configure Environment:**
Create a `.env.local` file with your secure credentials:

```env
# The Private Key of the Operator Wallet (Array format or Base58)
KORA_OPERATOR_KEY=[123, 45, ...]

# A secret password to protect your Cron endpoint
CRON_SECRET=my_super_secret_password

```

2. **Deploy to Vercel/Cron:**
KoraKeep includes a GitHub Action (`.github/workflows/cron.yml`) that hits your API endpoint every 6 hours.

* Push to GitHub.
* Add `CRON_SECRET` to your Repository Secrets.
* The bot is now live! 🟢

## 📜 License

Open Source under MIT License. Built for the SuperteamNG Kora Bounty.

---

**Built with:** React, Next.js API Routes, GitHub Actions, @solana/web3.js, and shadcn/ui.


