import crypto from 'crypto';

export interface HashRecord {
  hash: string;
  targetUrl: string;
  token: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

// In-Memory store for active hashes (For production clustering, Redis is recommended)
// We maintain a global variable to persist across Next.js API route invocations in dev/prod
declare global {
  var __antiBypassHashStorage: Map<string, HashRecord> | undefined;
  var __authorizedPublisherTokens: Set<string> | undefined;
}

if (!global.__antiBypassHashStorage) {
  global.__antiBypassHashStorage = new Map<string, HashRecord>();
}

if (!global.__authorizedPublisherTokens) {
  global.__authorizedPublisherTokens = new Set<string>([
    '12cfd687bc39171533f0eb5b0d9bbf708412cb62502693cb8b15ca39d81777c9',
    'a9f8e4c7b2d13560e9a8f7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6',
  ]);
}

const hashStorage = global.__antiBypassHashStorage;
const authorizedTokens = global.__authorizedPublisherTokens;

export const HASH_TTL_MS = 10000; // 10 seconds active lifetime

/**
 * Generate a cryptographically secure 64-character hexadecimal hash
 */
export function generateSecureHash(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Store a new hash with 10-second TTL
 */
export function registerNewHash(targetUrl: string, token: string): HashRecord {
  const hash = generateSecureHash();
  const now = Date.now();
  const record: HashRecord = {
    hash,
    targetUrl,
    token,
    createdAt: now,
    expiresAt: now + HASH_TTL_MS,
    used: false,
  };

  hashStorage.set(hash, record);

  // Auto clean-up after expiration + buffer
  setTimeout(() => {
    const existing = hashStorage.get(hash);
    if (existing && Date.now() >= existing.expiresAt) {
      hashStorage.delete(hash);
    }
  }, HASH_TTL_MS + 2000);

  return record;
}

/**
 * Validates a publisher token and single-use hash
 * Follows Linkvertise Anti-Bypass protocol:
 * - Token must be 64 characters and match an authorized publisher token
 * - Hash must exist, be unexpired (<= 10s), and not yet used
 * - On success, the hash is immediately burned/invalidated (Single-Use Policy)
 */
export function verifyAntiBypass(token: string | null, hash: string | null): {
  statusCode: number;
  body: { response: boolean | string; reason?: string; latencyMs?: number };
} {
  const startTime = Date.now();

  // 1. Parameter presence and length check (64 hex characters)
  if (!token || typeof token !== 'string' || token.length !== 64) {
    return {
      statusCode: 200, // Linkvertise standard returns 200 with response text
      body: { response: 'Invalid token.', reason: 'Token must be exactly 64 characters' },
    };
  }

  if (!hash || typeof hash !== 'string' || hash.length !== 64) {
    return {
      statusCode: 200,
      body: { response: false, reason: 'Hash must be exactly 64 characters' },
    };
  }

  // 2. Publisher token authentication
  if (!authorizedTokens.has(token)) {
    return {
      statusCode: 200,
      body: { response: 'Invalid token.', reason: 'Publisher token is not recognized or unauthorized' },
    };
  }

  // 3. Hash record lookup
  const record = hashStorage.get(hash);

  if (!record) {
    return {
      statusCode: 200,
      body: { response: false, reason: 'Hash not found or already purged from storage' },
    };
  }

  // 4. Expiration check (> 10 seconds)
  const now = Date.now();
  if (now > record.expiresAt) {
    hashStorage.delete(hash);
    return {
      statusCode: 200,
      body: { response: false, reason: 'Hash expired (exceeded 10-second validity window)' },
    };
  }

  // 5. Single-use enforcement
  if (record.used) {
    hashStorage.delete(hash);
    return {
      statusCode: 200,
      body: { response: false, reason: 'Hash has already been consumed (Single-use violation)' },
    };
  }

  // 6. Token matching verification
  if (record.token && record.token !== token) {
    return {
      statusCode: 200,
      body: { response: 'Invalid token.', reason: 'Hash was generated for a different publisher token' },
    };
  }

  // 7. Successful validation: Burn the hash immediately (Single-Use Policy)
  hashStorage.delete(hash);

  return {
    statusCode: 200,
    body: {
      response: true,
      reason: 'Hash verified successfully and consumed',
      latencyMs: Date.now() - startTime,
    },
  };
}

/**
 * Get all active and recent hashes for UI monitoring & inspection
 */
export function getAllHashRecords(): HashRecord[] {
  const list: HashRecord[] = [];
  const now = Date.now();
  for (const [hash, record] of hashStorage.entries()) {
    // Retain records for display even if slightly expired
    if (now - record.createdAt < 60000) {
      list.push(record);
    } else {
      hashStorage.delete(hash);
    }
  }
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Get authorized tokens
 */
export function getAuthorizedTokens(): string[] {
  return Array.from(authorizedTokens);
}

/**
 * Register a custom token (e.g. from playground UI)
 */
export function addAuthorizedToken(token: string): boolean {
  if (token && token.length === 64) {
    authorizedTokens.add(token);
    return true;
  }
  return false;
}
