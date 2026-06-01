'use client';

export interface ChartPoint { label: string; value: number }

const PALETTE = ['#FF7A00', '#E85D04', '#F59E0B', '#FB923C', '#D946EF', '#0EA5E9', '#10B981', '#6366F1'];

// Compact inline SVG bar/line chart.
export function MiniChart({ type, points, height = 260 }: { type: 'bar' | 'line'; points: ChartPoint[]; height?: number }) {
  const pts = points.filter((p) => Number.isFinite(p.value)).slice(0, 24);
  if (pts.length < 1) return null;

  const W = 640, H = height, padL = 48, padR = 16, padT = 16, padB = 56;
  const max = Math.max(...pts.map((p) => p.value), 0);
  const min = Math.min(...pts.map((p) => p.value), 0);
  const span = max - min || 1;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const y = (v: number) => padT + plotH - ((v - min) / span) * plotH;
  const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${type} chart`}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={padL} y1={padT + plotH * (1 - f)} x2={W - padR} y2={padT + plotH * (1 - f)} stroke="#f1f5f9" />
      ))}
      <line x1={padL} y1={y(min)} x2={W - padR} y2={y(min)} stroke="#e5e7eb" />
      {type === 'bar'
        ? pts.map((p, i) => {
            const bw = plotW / pts.length;
            const x = padL + i * bw + bw * 0.15;
            const top = y(Math.max(p.value, 0));
            const h = Math.abs(y(p.value) - y(0));
            return (
              <g key={i}>
                <rect x={x} y={top} width={bw * 0.7} height={Math.max(h, 1)} rx={3} fill={PALETTE[i % PALETTE.length]} />
                <text x={x + bw * 0.35} y={H - padB + 14} textAnchor="middle" fontSize="10" fill="#6b7280"
                  transform={pts.length > 8 ? `rotate(35 ${x + bw * 0.35} ${H - padB + 14})` : undefined}>
                  {clip(p.label, 12)}
                </text>
              </g>
            );
          })
        : (
          <polyline fill="none" stroke="#FF7A00" strokeWidth={2.5} strokeLinejoin="round"
            points={pts.map((p, i) => `${padL + (i / Math.max(pts.length - 1, 1)) * plotW},${y(p.value)}`).join(' ')} />
        )}
      {type === 'line' && pts.map((p, i) => (
        <g key={i}>
          <circle cx={padL + (i / Math.max(pts.length - 1, 1)) * plotW} cy={y(p.value)} r={3} fill="#E85D04" />
          {(i === 0 || i === pts.length - 1 || i % Math.ceil(pts.length / 6) === 0) && (
            <text x={padL + (i / Math.max(pts.length - 1, 1)) * plotW} y={H - padB + 14} textAnchor="middle" fontSize="10" fill="#6b7280">
              {clip(p.label, 10)}
            </text>
          )}
        </g>
      ))}
      <text x={padL} y={y(max) - 4} fontSize="10" fill="#9ca3af">{max.toLocaleString()}</text>
    </svg>
  );
}
