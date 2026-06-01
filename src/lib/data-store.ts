import crypto from 'crypto';
import type { Dataset } from './csv';

// Ephemeral in-memory store for loaded datasets (single-instance). Each entry
// holds a live sql.js Database; entries expire after 1 hour and are closed.

interface StoredDataset extends Dataset {
  name: string;
  expiresAt: number;
}

const store = new Map<string, StoredDataset>();
const TTL_MS = 60 * 60 * 1000;

export function putDataset(d: Dataset, meta: { name: string }): string {
  const id = crypto.randomBytes(12).toString('hex');
  store.set(id, { ...d, ...meta, expiresAt: Date.now() + TTL_MS });
  return id;
}

export function getDataset(id: string): StoredDataset | null {
  const d = store.get(id);
  if (!d) return null;
  if (Date.now() > d.expiresAt) {
    try { d.db.close(); } catch { /* ignore */ }
    store.delete(id);
    return null;
  }
  return d;
}

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store) {
      if (now > v.expiresAt) {
        try { v.db.close(); } catch { /* ignore */ }
        store.delete(k);
      }
    }
  }, 10 * 60_000).unref?.();
}
