import { Connection, clusterApiUrl } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

// Mainnet RPC endpoints with fallbacks
const MAINNET_RPC_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-mainnet.g.alchemy.com/v2/demo',
  clusterApiUrl(WalletAdapterNetwork.Mainnet),
];

// Devnet RPC endpoints with fallbacks
const DEVNET_RPC_ENDPOINTS = [
  'https://api.devnet.solana.com',
  clusterApiUrl(WalletAdapterNetwork.Devnet),
];

export type NetworkType = 'devnet' | 'mainnet-beta';

/**
 * Get RPC endpoints for a network with fallbacks
 */
export const getRpcEndpoints = (network: NetworkType): string[] => {
  return network === 'mainnet-beta' ? MAINNET_RPC_ENDPOINTS : DEVNET_RPC_ENDPOINTS;
};

/**
 * Get the primary RPC endpoint for a network
 */
export const getPrimaryEndpoint = (network: NetworkType): string => {
  return getRpcEndpoints(network)[0];
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute an RPC call with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 5000, onRetry } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        onRetry?.(attempt + 1, lastError);
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

/**
 * Execute an RPC call with fallback endpoints
 */
export async function withFallback<T>(
  network: NetworkType,
  fn: (connection: Connection) => Promise<T>,
  options: {
    commitment?: 'processed' | 'confirmed' | 'finalized';
    onFallback?: (endpoint: string, error: Error) => void;
  } = {}
): Promise<T> {
  const { commitment = 'confirmed', onFallback } = options;
  const endpoints = getRpcEndpoints(network);
  
  let lastError: Error | null = null;
  
  for (const endpoint of endpoints) {
    try {
      const connection = new Connection(endpoint, {
        commitment,
        confirmTransactionInitialTimeout: 60000,
      });
      return await fn(connection);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      onFallback?.(endpoint, lastError);
    }
  }
  
  throw lastError || new Error('All RPC endpoints failed');
}

/**
 * Create a resilient connection with health check
 */
export async function createResilientConnection(
  network: NetworkType,
  options: { commitment?: 'processed' | 'confirmed' | 'finalized' } = {}
): Promise<Connection> {
  const { commitment = 'confirmed' } = options;
  const endpoints = getRpcEndpoints(network);
  
  for (const endpoint of endpoints) {
    try {
      const connection = new Connection(endpoint, {
        commitment,
        confirmTransactionInitialTimeout: 60000,
      });
      
      // Health check - get slot to verify connection works
      await connection.getSlot();
      return connection;
    } catch {
      // Try next endpoint
      continue;
    }
  }
  
  // If all fail, return connection to primary (might work later)
  return new Connection(endpoints[0], { commitment });
}

/**
 * Check if an error is an RPC rate limit error
 */
export const isRateLimitError = (error: Error): boolean => {
  const message = error.message.toLowerCase();
  return (
    message.includes('429') ||
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('exceeded')
  );
};

/**
 * Check if an error is a network/connection error
 */
export const isNetworkError = (error: Error): boolean => {
  const message = error.message.toLowerCase();
  return (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('socket')
  );
};

/**
 * Get user-friendly error message
 */
export const getFriendlyErrorMessage = (error: Error): string => {
  if (isRateLimitError(error)) {
    return 'RPC is busy. Please wait a moment and try again.';
  }
  if (isNetworkError(error)) {
    return 'Network connection issue. Please check your internet.';
  }
  if (error.message.includes('insufficient')) {
    return 'Insufficient SOL for transaction fees.';
  }
  if (error.message.includes('rejected')) {
    return 'Transaction was rejected by the wallet.';
  }
  return 'An error occurred. Please try again.';
};
