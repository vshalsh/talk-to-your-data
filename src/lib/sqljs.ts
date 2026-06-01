import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';

export type Database = initSqlJs.Database;
type SqlJsStatic = initSqlJs.SqlJsStatic;

// Lazily initialise sql.js (SQLite compiled to WASM). The WASM binary is read
// from node_modules at runtime using a path built from process.cwd(), so the
// bundler never sees a module specifier for the .wasm file to trace.
let sqlPromise: Promise<SqlJsStatic> | null = null;

export async function getSql(): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
    const wasmBinary = new Uint8Array(fs.readFileSync(wasmPath));
    sqlPromise = initSqlJs({ wasmBinary: wasmBinary as unknown as ArrayBuffer });
  }
  return sqlPromise;
}
