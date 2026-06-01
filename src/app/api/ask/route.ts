import { NextRequest, NextResponse } from 'next/server';
import { getDataset } from '@/lib/data-store';
import { isReadOnlySelect, queryRows } from '@/lib/csv';
import { generateSql } from '@/lib/llm';

export const dynamic = 'force-dynamic';
const MAX_RESULT_ROWS = 200;

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { id?: string; question?: string } | null;
  const id = body?.id?.trim();
  const question = body?.question?.trim();
  if (!id || !question) return NextResponse.json({ error: 'Missing dataset or question.' }, { status: 400 });
  if (question.length > 1000) return NextResponse.json({ error: 'Question is too long.' }, { status: 400 });

  const ds = getDataset(id);
  if (!ds) return NextResponse.json({ error: 'Dataset expired or not found. Please load it again.' }, { status: 404 });

  try {
    const plan = await generateSql(question, ds.columns, ds.sample);
    if (!plan.sql || !isReadOnlySelect(plan.sql)) {
      return NextResponse.json({ error: 'Could not generate a safe read-only query for that question.', sql: plan.sql }, { status: 422 });
    }
    let result;
    try {
      result = queryRows(ds.db, plan.sql);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'SQL error.';
      return NextResponse.json({ error: `The generated query failed: ${msg}`, sql: plan.sql }, { status: 422 });
    }
    return NextResponse.json({
      sql: plan.sql,
      explanation: plan.explanation,
      chartType: plan.chartType,
      labelColumn: plan.labelColumn,
      valueColumn: plan.valueColumn,
      columns: result.columns,
      rows: result.rows.slice(0, MAX_RESULT_ROWS),
      truncated: result.rows.length > MAX_RESULT_ROWS,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Request failed.' }, { status: 502 });
  }
}
