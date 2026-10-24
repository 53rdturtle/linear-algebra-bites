import { useRef } from 'react'

// A 2D coordinate plane with optional draggable arrows.
//   vectors: [{ id, v:[x,y], color, label, drag, from:[x,y], dash }]
//   lines:   [{ d:[x,y], color, label, dash, through:[x,y] }]  infinite lines
//   onDrag(id, [x,y])
export default function Plane2D({
  size = 360,
  range = 5,
  vectors = [],
  lines = [],
  shapes = [],
  points = [],
  onDrag,
  snap = 0.5,
  gridStep = 1,
  title,
}) {
  const svgRef = useRef(null)
  const s = size / (2 * range)
  const X = (x) => size / 2 + x * s
  const Y = (y) => size / 2 - y * s

  const toWorld = (e) => {
    const r = svgRef.current.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * size
    const py = ((e.clientY - r.top) / r.height) * size
    let x = (px - size / 2) / s
    let y = (size / 2 - py) / s
    if (snap) {
      x = Math.round(x / snap) * snap
      y = Math.round(y / snap) * snap
    }
    const c = (t) => Math.max(-range, Math.min(range, t))
    return [c(x), c(y)]
  }

  // Track the drag on window so it survives re-renders and leaving the plane.
  const latest = useRef(null)
  latest.current = { onDrag, toWorld }
  const startDrag = (id, e) => {
    e.preventDefault()
    const move = (ev) => latest.current.onDrag?.(id, latest.current.toWorld(ev))
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  const grid = []
  for (let i = -range; i <= range; i += gridStep) {
    grid.push(
      <line key={'v' + i} x1={X(i)} y1={0} x2={X(i)} y2={size} className={i === 0 ? 'axis' : 'grid'} />,
      <line key={'h' + i} x1={0} y1={Y(i)} x2={size} y2={Y(i)} className={i === 0 ? 'axis' : 'grid'} />,
    )
  }

  return (
    <figure className="plane2d">
      {title && <figcaption>{title}</figcaption>}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
      >
        <defs>
          {[...new Set(vectors.map((v) => v.color))].map((c) => (
            <marker
              key={c}
              id={'arrow-' + c.replace('#', '')}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill={c} />
            </marker>
          ))}
        </defs>
        {grid}
        {shapes.map((sh, i) => (
          <polygon
            key={'s' + i}
            points={sh.points.map(([x, y]) => `${X(x)},${Y(y)}`).join(' ')}
            fill={sh.color}
            opacity={sh.opacity ?? 0.2}
          />
        ))}
        {lines.map((l, i) => {
          const len = Math.hypot(l.d[0], l.d[1]) || 1
          const k = (range * 3) / len
          const [px, py] = l.through || [0, 0]
          return (
            <g key={'l' + i}>
              <line
                x1={X(px - l.d[0] * k)}
                y1={Y(py - l.d[1] * k)}
                x2={X(px + l.d[0] * k)}
                y2={Y(py + l.d[1] * k)}
                stroke={l.color}
                strokeWidth={l.width || 3}
                strokeDasharray={l.dash ? '6 5' : undefined}
                opacity={l.opacity ?? 0.55}
              />
              {l.label && (
                <text
                  x={X(px + (l.d[0] / len) * range * 0.82)}
                  y={Y(py + (l.d[1] / len) * range * 0.82) - 8}
                  fill={l.color}
                  className="svg-label small"
                >
                  {l.label}
                </text>
              )}
            </g>
          )
        })}
        {points.map((pt, i) => (
          <g key={'pt' + i}>
            <text x={X(pt.p[0])} y={Y(pt.p[1]) + 7} textAnchor="middle" fontSize="22" fill={pt.color}>
              ★
            </text>
            {pt.label && (
              <text x={X(pt.p[0]) + 12} y={Y(pt.p[1]) - 8} fill={pt.color} className="svg-label small">
                {pt.label}
              </text>
            )}
          </g>
        ))}
        {vectors.map((vec) => {
          const [fx, fy] = vec.from || [0, 0]
          const tx = fx + vec.v[0]
          const ty = fy + vec.v[1]
          const zero = Math.hypot(vec.v[0], vec.v[1]) < 1e-9
          return (
            <g key={vec.id}>
              {!zero && (
                <line
                  x1={X(fx)}
                  y1={Y(fy)}
                  x2={X(tx)}
                  y2={Y(ty)}
                  stroke={vec.color}
                  strokeWidth={vec.width || 3.5}
                  strokeDasharray={vec.dash ? '6 4' : undefined}
                  markerEnd={`url(#arrow-${vec.color.replace('#', '')})`}
                />
              )}
              {vec.label && (
                <text x={X(tx) + 8} y={Y(ty) - 8} fill={vec.color} className="svg-label">
                  {vec.label.split('_')[0]}
                  {vec.label.includes('_') && (
                    <tspan dy="5" fontSize="0.75em">
                      {vec.label.split('_')[1]}
                    </tspan>
                  )}
                </text>
              )}
              {vec.drag && (
                <circle
                  cx={X(tx)}
                  cy={Y(ty)}
                  r={13}
                  className="handle"
                  stroke={vec.color}
                  onPointerDown={(e) => startDrag(vec.id, e)}
                />
              )}
            </g>
          )
        })}
      </svg>
    </figure>
  )
}
