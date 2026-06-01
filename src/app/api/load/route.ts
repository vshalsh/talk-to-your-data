import { NextRequest, NextResponse } from 'next/server';
import { buildDataset } from '@/lib/csv';
import { putDataset } from '@/lib/data-store';
import { getSample } from '@/lib/sample-data';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

export async function POST(req: NextRequest) {
  let csv = '';
  let name = '';
  const ctype = req.headers.get('content-type') || '';

  try {
    if (ctype.includes('application/json')) {
      const body = (await req.json().catch(() => null)) as { sample?: string } | null;
      const sample = getSample(body?.sample);
      if (!sample) return NextResponse.json({ error: 'Unknown sample dataset.' }, { status: 400 });
      csv = sample.csv;
      name = `${sample.label} (sample)`;
    } else {
      const form = await req.formData();
      const file = form.get('file') as File | null;
      if (!file || typeof file.arrayBuffer !== 'function') return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
      if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File exceeds the 8MB limit.' }, { status: 400 });
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      if (!['csv', 'tsv', 'txt'].includes(ext) && !file.type.startsWith('text/')) {
        return NextResponse.json({ error: 'Please upload a CSV file.' }, { status: 400 });
      }
      csv = Buffer.from(await file.arrayBuffer()).toString('utf8');
      name = file.name;
    }

    const dataset = await buildDataset(csv);
    const id = putDataset(dataset, { name });
    return NextResponse.json({
      id,
      name,
      rowCount: dataset.rowCount,
      columns: dataset.columns.map((c) => ({ name: c.name, display: c.display, type: c.type })),
      sample: dataset.sample,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Could not read the dataset.' }, { status: 400 });
  }
}
