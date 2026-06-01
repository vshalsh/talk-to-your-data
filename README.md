# Talk to Your Data — Natural-Language Analytics

Ask questions about a CSV in **plain English**. The model writes a **read-only SQL**
query, runs it against an in‑memory **SQLite** engine (via `sql.js`/WASM), and returns
a **results table** plus an auto‑generated **chart** — with the exact SQL shown for
transparency.

**LLM‑agnostic by design.** It defaults to a **local Ollama model (no API key)** and
can optionally use a cloud provider (Google Gemini). Your data is processed in memory
and is never written to disk.

![Demo](docs/screenshot.png)

## Features

- Upload a CSV or use the built‑in samples
- Natural language → SQL → executed on real SQLite
- **Read‑only guardrail** (single `SELECT`/`WITH` statement only)
- Results table + auto bar/line chart
- The generated SQL is always displayed
- No database, no accounts, no keys required (with Ollama)

## Quick start

```bash
npm install
cp .env.example .env.local
```

### Option A — local model with Ollama (no API key)

1. Install [Ollama](https://ollama.com) and pull a model:
   ```bash
   ollama pull llama3.1
   ```
2. Keep the defaults in `.env.local` (`LLM_PROVIDER=ollama`).
3. Run it:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

### Option B — cloud (Google Gemini)

1. Get a key at https://aistudio.google.com/apikey
2. In `.env.local`:
   ```env
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=your-key-here
   GEMINI_MODEL=gemini-flash-latest
   ```
3. `npm run dev`

> Never commit `.env.local` or real keys. Only `.env.example` (with empty
> placeholders) is tracked.

## How it works

```
CSV ──▶ in-memory SQLite (sql.js)
question ──▶ LLM (Ollama / Gemini) ──▶ SQL ──▶ read-only guard ──▶ run ──▶ table + chart
```

- `src/lib/csv.ts` — CSV parsing, type inference, builds the SQLite table, read-only SQL guard
- `src/lib/llm.ts` — the LLM-agnostic Text‑to‑SQL client (Ollama default, Gemini optional)
- `src/lib/sqljs.ts` — loads the SQLite WASM engine
- `src/app/api/{load,ask}` — the two endpoints

## Safety notes

- Only read‑only `SELECT` queries are executed; the SQLite database is in‑memory and
  sandboxed, with no file or network access.
- Uploaded data lives in memory only and expires after an hour.
- This is a demo/reference implementation provided **as is**, without warranty.

## License

MIT © Vishal Sharma
