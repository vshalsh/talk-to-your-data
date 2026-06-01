import { DataChatDemo } from '@/components/DataChatDemo';
import { llmInfo } from '@/lib/llm';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="container-app py-10">
      <div className="mb-8">
        <span className="chip">Open source · LLM-agnostic</span>
        <h1 className="mt-3 text-3xl font-extrabold text-ink">Talk to Your Data</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Load a CSV (or a built-in sample) and ask questions in plain English. The model writes a read-only SQL
          query, runs it against an in-memory SQLite engine, and returns a results table plus an auto-generated chart —
          with the exact SQL shown for transparency. Data is processed in memory and never stored.
        </p>
        <p className="mt-2 text-xs text-ink-soft">Backend: {llmInfo()} · Read-only queries only.</p>
      </div>
      <DataChatDemo />
      <footer className="mt-12 border-t border-black/5 pt-6 text-sm text-ink-soft">
        MIT licensed. Runs on a local Ollama model by default (no API key) or any cloud LLM. Set the backend in <code>.env.local</code>.
      </footer>
    </main>
  );
}
