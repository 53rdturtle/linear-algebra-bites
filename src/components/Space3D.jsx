import { useRef, useState } from 'react'
import { dot, norm, scale, sub } from '../lib/linalg.js'

// A rotatable 3D view (drag to turn). z points up.
//   planes:  [{ u, w, color, label }]   plane through 0 spanned by u, w
//   lines:   [{ d, color, label }]      line through 0 in direction d
//   vectors: [{ v, color, label }]
export default function Space3D({ size = 380, extent = 3, planes = [], lines = [], vectors = [], title }) {
  const [view, setView] = useState({ yaw: -0.6, pitch: 0.35 })
  const last = useRef(null)

  const s = size / (2 * extent * 1.25)
  const project = ([x, y, z]) => {
    const cy = Math.cos(view.yaw)
    const sy = Math.sin(view.yaw)
    const x1 = cy * x - sy * y
    const y1 = sy * x + cy * y
    const cp = Math.cos(view.pitch)
    const sp = Math.sin(view.pitch)
    const sx = x1
    const syy = z * cp + y1 * sp
    return [size / 2 + sx * s, size / 2 - syy * s]
  }
  const P = (p) => project(p).join(',')

  const unit = (v) => {
    const n = norm(v)
    return n < 1e-9 ? v : scale(v, 1 / n)
  }

  const onDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    last.current = [e.clientX, e.clientY]
  }
  const onMove = (e) => {
    if (!last.current) return
    const dx = e.clientX - last.current[0]
    const dy = e.clientY - last.current[1]
    last.current = [e.clientX, e.clientY]
    setView((v) => ({
      yaw: v.yaw - dx * 0.01,
      pitch: Math.max(-1.4, Math.min(1.4, v.pitch + dy * 0.01)),
    }))
  }

  const axisLen = extent * 1.15
  const axes = [
    [[axisLen, 0, 0], 'x'],
    [[0, axisLen, 0], 'y'],
    [[0, 0, axisLen], 'z'],
  ]

  return (
    <figure className="space3d">
      {title && <figcaption>{title}</figcaption>}
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={() => (last.current = null)}
        style={{ cursor: 'grab', touchAction: 'none' }}
      >
        {axes.map(([a, name]) => (
          <g key={name}>
            <line
              x1={project(scale(a, -1))[0]}
              y1={project(scale(a, -1))[1]}
              x2={project(a)[0]}
              y2={project(a)[1]}
              className="axis3d"
            />
            <text x={project(a)[0] + 4} y={project(a)[1] - 4} className="svg-label small muted">
              {name}
            </text>
          </g>
        ))}
        {planes.map((pl, i) => {
          // Orthonormal pair so the patch is a square.
          const e1 = unit(pl.u)
          const e2 = unit(sub(pl.w, scale(e1, dot(pl.w, e1))))
          const r = extent
          const corner = (a, b) => [0, 1, 2].map((k) => a * r * e1[k] + b * r * e2[k])
          const gridLines = []
          for (let t = -2; t <= 2; t++) {
            const f = t / 2
            gridLines.push(
              <line key={'a' + t} x1={project(corner(f, -1))[0]} y1={project(corner(f, -1))[1]}
                x2={project(corner(f, 1))[0]} y2={project(corner(f, 1))[1]} stroke={pl.color} opacity={0.35} />,
              <line key={'b' + t} x1={project(corner(-1, f))[0]} y1={project(corner(-1, f))[1]}
                x2={project(corner(1, f))[0]} y2={project(corner(1, f))[1]} stroke={pl.color} opacity={0.35} />,
            )
          }
          const labelAt = project(corner(0.75, 0.9))
          return (
            <g key={'p' + i}>
              <polygon
                points={[corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)].map(P).join(' ')}
                fill={pl.color}
                opacity={0.18}
                stroke={pl.color}
                strokeOpacity={0.6}
              />
              {gridLines}
              {pl.label && (
                <text x={labelAt[0]} y={labelAt[1]} fill={pl.color} className="svg-label small">
                  {pl.label}
                </text>
              )}
            </g>
          )
        })}
        {lines.map((l, i) => {
          const d = scale(unit(l.d), extent * 1.2)
          const a = project(scale(d, -1))
          const b = project(d)
          return (
            <g key={'l' + i}>
              <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={l.color} strokeWidth={l.width || 4}
                opacity={0.85} strokeDasharray={l.dash ? '7 5' : undefined} />
              {l.label && (
                <text x={b[0] + 6} y={b[1]} fill={l.color} className="svg-label small">
                  {l.label}
                </text>
              )}
            </g>
          )
        })}
        {vectors.map((vec, i) => {
          const o = project([0, 0, 0])
          const t = project(vec.v)
          return (
            <g key={'v' + i}>
              <line x1={o[0]} y1={o[1]} x2={t[0]} y2={t[1]} stroke={vec.color} strokeWidth={3} />
              <circle cx={t[0]} cy={t[1]} r={5} fill={vec.color} />
              {vec.label && (
                <text x={t[0] + 8} y={t[1] - 6} fill={vec.color} className="svg-label small">
                  {vec.label}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <div className="hint-text">Drag to rotate</div>
    </figure>
  )
}
