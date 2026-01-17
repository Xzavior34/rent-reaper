

# 🛡️ KoraKeep: Automated Rent Reclamation Terminal

> **Winner** of the Kora Rent Reclaim Bounty Challenge.
> A non-custodial, safety-first terminal for monitoring and reclaiming rent-locked SOL from abandoned Kora Node accounts.

*https://solana-security-secrets-8xj6.vercel.app/*

## 🚨 The Problem: The "Silent Leak" in Kora Nodes

Kora nodes facilitate gasless transactions by sponsoring accounts and wrapping SOL. While this creates a seamless user experience, it introduces a hidden operational cost: **Rent Leakage**.

When a Kora node (or any relayer) operates, it often creates:

1. **Temporary wSOL Accounts:** Used to unwrap SOL for fees.
2. **Token Accounts:** Created for intermediate transfers.

If a transaction fails or a cleanup instruction is missed, these accounts remain open on-chain. Each open account locks approximately **0.002039 SOL** in "Rent". For a high-volume operator, thousands of these "dust" accounts can silently lock up substantial capital in the treasury.

## ⚡ The Solution: KoraKeep

**KoraKeep** is a specialized, non-custodial interface designed to audit, filter, and reclaim this locked capital. Unlike basic scripts that require access to your private keys, KoraKeep runs entirely client-side in your browser, interacting directly with your wallet (Phantom, Solflare, Backpack).

### Key Features

* **🕵️ Deep-Scan Logic:** Inspects all token accounts owned by the wallet to identify "Dust" (Empty wSOL or Token Accounts with 0 balance).
* **🛡️ Safe Mode Protocol:** Automatically fetches on-chain transaction history for every candidate account. **If an account was active in the last 24 hours, it is strictly ignored** to prevent accidental closure of pending transactions.
* **🔋 Batch Processing:** Uses Solana's transaction batching to close up to 20 accounts in a single signature, maximizing efficiency.
* **🔒 100% Non-Custodial:** Your private keys never leave your wallet. All transactions are constructed locally and approved by you.

## 🛠️ Technical Implementation

### 1. The Detection Engine

KoraKeep queries the RPC using `getParsedTokenAccountsByOwner`. It filters results based on:

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

Before adding an account to the "Kill List", KoraKeep performs a liveness check:

```typescript
const history = await connection.getSignaturesForAddress(pubkey, { limit: 1 });
if (history.length > 0) {
    const lastTxTime = history[0].blockTime;
    const isTooNew = (Date.now() / 1000 - lastTxTime) < 86400; // 24 Hours
    if (isTooNew) return "SKIPPED_SAFETY_LOCK";
}

```

### 3. The Reclaim Action

We utilize the SPL Token Program's `createCloseAccountInstruction`. The instruction directs the rent lamports back to the `owner` (your Kora Operator wallet).

## 🚀 Quick Start

### Prerequisites

* Node.js v16+
* A Solana Wallet (Phantom, Solflare, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/korakeep.git

# Enter the directory
cd korakeep

# Install dependencies
npm install

# Run the development server
npm run dev

```

### Usage Guide

1. Open the app at `http://localhost:8080`.
2. **Connect Wallet:** Select your Kora Operator wallet.
3. **Select Network:** Toggle between **DEV** (for testing) and **MAIN** (for production).
4. **Scan:** Click "Scan for Leaks".
5. **Review:** KoraKeep will display found accounts. Accounts <24h old are protected by default.
6. **Sweep:** Click "Reclaim Rent" to sign the batch close transaction.

## 📜 License

Open Source under MIT License. Built for the SuperteamNG Kora Bounty.

---

**Built with:** React, Vite, TailwindCSS, @solana/web3.js, and shadcn/ui.
