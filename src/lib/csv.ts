import { getSql, type Database } from './sqljs';

export interface Column {
  name: string; // normalized, SQL-safe identifier
  display: string; // original header
  type: 'INTEGER' | 'REAL' | 'TEXT';
}

export interface Dataset {
  db: Database;
  columns: Column[];
  rowCount: number;
  sample: Record<string, string | number | null>[];
}

export const MAX_ROWS = 5000;
export const MAX_COLS = 40;

// Minimal RFC-4180-ish CSV parser (handles quotes, escaped quotes, CRLF).
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const records: string[][] = [];
  let field = '';
  let record: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      record.push(field); field = '';
    } else if (c === '\n') {
      record.push(field); field = ''; records.push(record); record = [];
    } else if (c !== '\r') {
      field += c;
    }
  }
  if (field.length || record.length) { record.push(field); records.push(record); }
  const nonEmpty = records.filter((r) => r.some((cell) => cell.trim() !== ''));
  const headers = (nonEmpty[0] || []).map((h) => h.trim());
  return { headers, rows: nonEmpty.slice(1) };
}

function normalizeName(header: string, idx: number, used: Set<string>): string {
  let n = header.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (!n) n = `col_${idx + 1}`;
  if (/^[0-9]/.test(n)) n = `c_${n}`;
  let candidate = n;
  let k = 2;
  while (used.has(candidate)) candidate = `${n}_${k++}`;
  used.add(candidate);
  return candidate;
}

function inferType(values: string[]): Column['type'] {
  let sawNumber = false;
  let allInt = true;
  for (const v of values) {
    const t = v.trim();
    if (t === '') continue;
    const num = Number(t.replace(/,/g, ''));
    if (!Number.isFinite(num)) return 'TEXT';
    sawNumber = true;
    if (!Number.isInteger(num)) allInt = false;
  }
  if (!sawNumber) return 'TEXT';
  return allInt ? 'INTEGER' : 'REAL';
}

// Build an in-memory SQLite database with a single table named `data`.
export async function buildDataset(text: string): Promise<Dataset> {
  const { headers, rows } = parseCsv(text);
  if (!headers.length) throw new Error('No columns found. Is this a valid CSV with a header row?');
  if (headers.length > MAX_COLS) throw new Error(`Too many columns (max ${MAX_COLS}).`);
  if (!rows.length) throw new Error('No data rows found.');

  const used = new Set<string>();
  const limited = rows.slice(0, MAX_ROWS);
  const columns: Column[] = headers.map((h, i) => ({
    name: normalizeName(h, i, used),
    display: h || `Column ${i + 1}`,
    type: inferType(limited.map((r) => r[i] ?? '')),
  }));

  const SQL = await getSql();
  const db = new SQL.Database();
  const colDefs = columns.map((c) => `"${c.name}" ${c.type}`).join(', ');
  db.run(`CREATE TABLE data (${colDefs});`);

  const placeholders = columns.map(() => '?').join(', ');
  const stmt = db.prepare(`INSERT INTO data VALUES (${placeholders});`);
  for (const r of limited) {
    const vals = columns.map((c, i) => {
      const raw = (r[i] ?? '').trim();
      if (raw === '') return null;
      if (c.type === 'INTEGER' || c.type === 'REAL') {
        const num = Number(raw.replace(/,/g, ''));
        return Number.isFinite(num) ? num : null;
      }
      return raw;
    });
    stmt.run(vals as (string | number | null)[]);
  }
  stmt.free();

  const sample = queryRows(db, `SELECT * FROM data LIMIT 5`).rows;
  return { db, columns, rowCount: limited.length, sample };
}

export function queryRows(db: Database, sql: string): { columns: string[]; rows: Record<string, string | number | null>[] } {
  const res = db.exec(sql);
  if (!res.length) return { columns: [], rows: [] };
  const { columns, values } = res[0];
  const rows = values.map((row) => {
    const obj: Record<string, string | number | null> = {};
    columns.forEach((c, i) => { obj[c] = row[i] as string | number | null; });
    return obj;
  });
  return { columns, rows };
}

// Guard: allow a single read-only SELECT (optionally a leading WITH/CTE).
export function isReadOnlySelect(sql: string): boolean {
  const s = sql.trim().replace(/;+\s*$/, '');
  if (s.includes(';')) return false; // no multiple statements
  if (!/^\s*(select|with)\b/i.test(s)) return false;
  if (/\b(insert|update|delete|drop|alter|create|attach|detach|pragma|replace|vacuum|reindex)\b/i.test(s)) return false;
  return true;
}
