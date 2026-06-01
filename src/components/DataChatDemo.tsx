'use client';

import { useRef, useState } from 'react';
import { UploadIcon, PipelineIcon, CheckIcon } from '@/components/icons';
import { SAMPLE_DATASETS } from '@/lib/sample-data';
import { MiniChart } from '@/components/MiniChart';

interface ColumnMeta { name: string; display: string; type: string }
interface LoadResult { id: string; name: string; rowCount: number; columns: ColumnMeta[]; sample: Record<string, string | number | null>[] }
interface AskResult {
  sql: string; explanation: string;
  chartType: 'bar' | 'line' | 'none';
  labelColumn?: string; valueColumn?: string;
  columns: string[]; rows: Record<string, string | number | null>[]; truncated?: boolean;
}

function Chart({ result }: { result: AskResult }) {
  const { chartType, labelColumn, valueColumn, rows } = result;
  if (chartType === 'none' || !labelColumn || !valueColumn || rows.length < 2) return null;
  const points = rows
    .map((r) => ({ label: String(r[labelColumn] ?? ''), value: Number(r[valueColumn]) }))
    .filter((p) => Number.isFinite(p.value));
  if (points.length < 2) return null;
  return <div className="mt-3"><MiniChart type={chartType} points={points} /></div>;
}

export function DataChatDemo() {
  const [dataset, setDataset] = useState<LoadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<AskResult | null>(null);
  const [askError, setAskError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadFrom(init: RequestInit) {
    setLoading(true); setLoadError(''); setAnswer(null); setAskError('');
    try {
      const res = await fetch('/api/load', init);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load dataset.');
      setDataset(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load dataset.');
    } finally { setLoading(false); }
  }

  function loadSample(key: string) {
    loadFrom({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sample: key }) });
  }
  function loadUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    loadFrom({ method: 'POST', body: fd });
  }

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || !dataset) return;
    setAsking(true); setAskError(''); setAnswer(null);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dataset.id, question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed.');
      setAnswer(data);
    } catch (err) {
      setAskError(err instanceof Error ? err.message : 'Request failed.');
    } finally { setAsking(false); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Load panel */}
      <div className="card h-fit">
        <div className="flex items-center gap-2 text-brand-deep">
          <UploadIcon width={20} height={20} />
          <h2 className="font-semibold text-ink">1 · Load data</h2>
        </div>
        <p className="mt-2 text-sm text-ink-soft">Try a sample, or upload your own CSV (max 8MB).</p>
        <div className="mt-3 space-y-2">
          {SAMPLE_DATASETS.map((s) => (
            <button key={s.key} onClick={() => loadSample(s.key)} disabled={loading} className="btn-outline w-full justify-start text-left text-sm">
              <span className="font-semibold">{s.label}</span>
            </button>
          ))}
        </div>
        <form onSubmit={loadUpload} className="mt-4 space-y-2 border-t border-black/5 pt-4">
          <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" className="input text-xs" />
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Loading…' : 'Upload CSV'}</button>
        </form>
        {loadError && <p className="mt-3 text-sm text-red-600">{loadError}</p>}
        {dataset && (
          <div className="mt-4 rounded-xl bg-brand-light/60 p-3 text-sm">
            <div className="flex items-center gap-2 font-medium text-ink"><CheckIcon width={16} height={16} /> {dataset.name}</div>
            <p className="mt-1 text-xs text-ink-soft">{dataset.rowCount} rows · {dataset.columns.length} columns</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {dataset.columns.map((c) => (
                <span key={c.name} className="rounded bg-white px-1.5 py-0.5 text-[11px] text-ink-soft" title={`${c.display} · ${c.type}`}>{c.display}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ask panel */}
      <div className="card flex min-h-[420px] flex-col">
        <div className="flex items-center gap-2 text-brand-deep">
          <PipelineIcon width={20} height={20} />
          <h2 className="font-semibold text-ink">2 · Ask in plain English</h2>
        </div>

        <div className="mt-4 flex-1">
          {!dataset && <p className="text-sm text-ink-soft">Load a dataset on the left to begin.</p>}
          {dataset && !answer && !asking && !askError && (
            <p className="text-sm text-ink-soft">
              Ask questions like <em>“total revenue by region”</em>, <em>“top 5 by salary”</em>, or <em>“revenue trend by quarter”</em>. The model writes the SQL, runs it, and charts the result.
            </p>
          )}
          {asking && <p className="text-sm text-ink-soft">Writing SQL and querying…</p>}
          {askError && <p className="text-sm text-red-600">{askError}</p>}

          {answer && (
            <div className="space-y-4">
              {answer.explanation && <p className="text-sm text-ink">{answer.explanation}</p>}
              <details className="rounded-lg border border-black/10 bg-accent/95 text-xs text-gray-100" open>
                <summary className="cursor-pointer px-3 py-2 font-medium text-gray-300">Generated SQL</summary>
                <pre className="overflow-x-auto px-3 pb-3"><code>{answer.sql}</code></pre>
              </details>

              <Chart result={answer} />

              {answer.rows.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-black/10">
                  <table className="w-full text-sm">
                    <thead className="bg-brand-light/50">
                      <tr>{answer.columns.map((c) => <th key={c} className="px-3 py-2 text-left font-medium text-ink">{c}</th>)}</tr>
                    </thead>
                    <tbody>
                      {answer.rows.map((row, i) => (
                        <tr key={i} className="border-t border-black/5">
                          {answer.columns.map((c) => <td key={c} className="px-3 py-2 align-top text-ink-soft">{row[c] === null ? '' : String(row[c])}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-sm text-ink-soft">The query returned no rows.</p>}
              {answer.truncated && <p className="text-xs text-amber-700">Showing the first 200 rows.</p>}
            </div>
          )}
        </div>

        <form onSubmit={ask} className="mt-4 flex gap-2 border-t border-black/5 pt-4">
          <input
            value={question} onChange={(e) => setQuestion(e.target.value)}
            placeholder={dataset ? 'Ask a question about this data…' : 'Load a dataset first'}
            disabled={!dataset || asking} className="input flex-1"
          />
          <button type="submit" disabled={!dataset || asking || !question.trim()} className="btn-primary">{asking ? '…' : 'Ask'}</button>
        </form>
      </div>
    </div>
  );
}
