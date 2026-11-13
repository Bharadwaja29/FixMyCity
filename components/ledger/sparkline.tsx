const W = 120
const H = 32
const PAD = 3

export function Sparkline({ values, label }: { values: number[]; label: string }) {
  const max = Math.max(...values, 1)
  const step = values.length > 1 ? (W - PAD * 2) / (values.length - 1) : 0
  const points = values.map((v, i) => [PAD + i * step, H - PAD - (v / max) * (H - PAD * 2)] as const)
  const last = points[points.length - 1]

  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="shrink-0 text-primary">
      <line x1={PAD} x2={W - PAD} y1={H - PAD} y2={H - PAD} stroke="currentColor" strokeOpacity={0.2} />
      <polyline
        points={points.map(([x, y]) => `${x},${y}`).join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {last && <circle cx={last[0]} cy={last[1]} r={3} className="fill-saffron" stroke="#fffdf8" strokeWidth={1} />}
    </svg>
  )
}
