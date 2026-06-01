// LLM-agnostic Text-to-SQL client.
// Default backend is a LOCAL Ollama model (no API key). Optionally use a cloud
// provider (Google Gemini) by setting LLM_PROVIDER=gemini and GEMINI_API_KEY.

export interface SqlPlan {
  sql: string;
  explanation: string;
  chartType: 'bar' | 'line' | 'none';
  labelColumn?: string;
  valueColumn?: string;
}

const PROVIDER = (process.env.LLM_PROVIDER || 'ollama').toLowerCase();

export function llmInfo(): string {
  return PROVIDER === 'gemini'
    ? `Gemini (${process.env.GEMINI_MODEL || 'gemini-flash-latest'})`
    : `Ollama (${process.env.OLLAMA_MODEL || 'llama3.1'})`;
}

function buildPrompt(question: string, schema: { name: string; type: string; display: string }[], sampleRows: Record<string, unknown>[]): string {
  const cols = schema.map((c) => `"${c.name}" (${c.type}, from "${c.display}")`).join(', ');
  const sample = JSON.stringify(sampleRows.slice(0, 3));
  return (
    'You are a SQLite expert. Convert the user question into a single read-only SQLite SELECT query over a table named `data`. ' +
    `The table columns are: ${cols}. A few sample rows: ${sample}. ` +
    'Rules: use ONLY the table `data` and the listed columns; produce exactly one SELECT statement (a leading WITH/CTE is allowed); never modify data; ' +
    'always quote column identifiers with double quotes; add a sensible LIMIT (<=100) unless the question asks for an aggregate. ' +
    'Decide whether the result is best shown as a chart: pick "bar" for category comparisons, "line" for trends over an ordered/time column, or "none". ' +
    'If charting, set labelColumn (the category/x axis, a column in the SELECT output) and valueColumn (the numeric y axis, a column in the SELECT output). ' +
    'Return ONLY JSON: {"sql": string, "explanation": string (one sentence, plain English), "chartType": "bar"|"line"|"none", "labelColumn": string, "valueColumn": string}. ' +
    `Question: ${question}`
  );
}

function coerce(obj: Record<string, unknown>): SqlPlan {
  const chartType = obj.chartType === 'bar' || obj.chartType === 'line' ? obj.chartType : 'none';
  return {
    sql: String(obj.sql ?? ''),
    explanation: String(obj.explanation ?? ''),
    chartType,
    labelColumn: obj.labelColumn ? String(obj.labelColumn) : undefined,
    valueColumn: obj.valueColumn ? String(obj.valueColumn) : undefined,
  };
}

function parseJson(raw: string): Record<string, unknown> {
  let s = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  // Some models wrap or prepend text; grab the outermost JSON object.
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first > 0 || last < s.length - 1) s = s.slice(first, last + 1);
  return JSON.parse(s) as Record<string, unknown>;
}

export async function generateSql(
  question: string,
  schema: { name: string; type: string; display: string }[],
  sampleRows: Record<string, unknown>[],
): Promise<SqlPlan> {
  const prompt = buildPrompt(question, schema, sampleRows);

  if (PROVIDER === 'gemini') {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('LLM_PROVIDER=gemini but GEMINI_API_KEY is not set.');
    const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 1024, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } },
      }),
    });
    if (!res.ok) throw new Error(`Gemini request failed (${res.status}).`);
    const data = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
    return coerce(parseJson(text));
  }

  // Default: Ollama (local, no key).
  const base = process.env.OLLAMA_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3.1';
  let res: Response;
  try {
    res = await fetch(`${base}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false, format: 'json', options: { temperature: 0 } }),
    });
  } catch {
    throw new Error(`Could not reach Ollama at ${base}. Is it running? (\`ollama serve\` and \`ollama pull ${model}\`)`);
  }
  if (!res.ok) throw new Error(`Ollama request failed (${res.status}). Try \`ollama pull ${model}\`.`);
  const data = (await res.json()) as { response?: string };
  return coerce(parseJson(data.response || '{}'));
}
