// Interactive versions of the equations and figures in the book.
import { useState } from 'react'
import Plane2D from '../components/Plane2D.jsx'
import Space3D from '../components/Space3D.jsx'
import { MatrixEditor, Stepper, VectorStepper } from '../components/Inputs.jsx'
import { M, matTex } from '../components/Tex.jsx'
import {
  add,
  columnSpaceBasis,
  det,
  dot,
  fmt,
  fmtVec,
  matVec,
  nullspaceBasis,
  pivotRows,
  projectOnto,
  rank,
  resize,
  rref,
  rowSpaceBasis,
  scale,
  sub,
  transpose,
} from '../lib/linalg.js'
import { C } from '../content/colors.js'
import { useReport } from './ui.jsx'

const nonzero = (v) => v.some((t) => Math.abs(t) > 1e-9)
const paren = (t) => (t < 0 ? `(${fmt(t)})` : fmt(t))

function Readout({ good, children }) {
  return <div className={`live ${good ? 'good' : ''}`}>{children}</div>
}

/* p.194: orthogonal vectors and a² + b² = c² */
export function PythagorasToy() {
  const [v, setV] = useState([3, 1])
  const [w, setW] = useState([1, 2])
  const s = add(v, w)
  const vw = dot(v, w)
  const perp = Math.abs(vw) < 1e-9 && nonzero(v) && nonzero(w)
  useReport(`v = ${fmtVec(v)}, w = ${fmtVec(w)}, vᵀw = ${fmt(vw)}`)
  return (
    <div className="toy-row">
      <Plane2D
        size={300}
        range={5}
        vectors={[
          { id: 'w2', v: w, from: v, color: C.muted, dash: true, width: 2 },
          { id: 's', v: s, color: C.sum, label: 'v+w', width: 2.5 },
          { id: 'v', v, color: C.v, label: 'v', drag: true },
          { id: 'w', v: w, color: C.w, label: 'w', drag: true },
        ]}
        onDrag={(id, p) => (id === 'v' ? setV(p) : setW(p))}
      />
      <div className="toy-side">
        <Readout good={perp}>
          <M>{`v^Tw = ${fmt(vw)}`}</M>
        </Readout>
        <Readout good={perp}>
          <M>{`\\|v\\|^2+\\|w\\|^2 = ${fmt(dot(v, v) + dot(w, w))}`}</M>
          <br />
          <M>{`\\|v+w\\|^2 = ${fmt(dot(s, s))}`}</M>
        </Readout>
        <p className="small muted">Drag the tips. The two lengths agree exactly when vᵀw = 0.</p>
      </div>
    </div>
  )
}

/* p.195: Example 1 (floor + corner line) and Example 2 (two walls) */
const SCENES = {
  ex1: {
    name: 'Example 1: floor + corner',
    planes: [{ u: [1, 0, 0], w: [0, 1, 0], color: C.row, label: 'floor V' }],
    lines: [{ d: [0, 0, 1], color: C.null, label: 'W' }],
    note: 'Orthogonal: every vector up the corner line is perpendicular to every vector in the floor.',
    good: true,
  },
  ex2: {
    name: 'Example 2: two walls',
    planes: [
      { u: [1, 0, 0], w: [0, 0, 1], color: C.row, label: 'V' },
      { u: [0, 1, 0], w: [0, 0, 1], color: C.col, label: 'W' },
    ],
    lines: [{ d: [0, 0, 1], color: C.bad, label: 'in both' }],
    note: 'Not orthogonal: the meeting line is in both walls, and it is not perpendicular to itself.',
    good: false,
  },
}
export function WallsToy() {
  const [k, setK] = useState('ex1')
  const sc = SCENES[k]
  useReport(`Showing: ${sc.name}`)
  return (
    <div>
      <div className="tabs">
        {Object.entries(SCENES).map(([key, s]) => (
          <button key={key} className={`tab ${key === k ? 'active' : ''}`} onClick={() => setK(key)}>
            {s.name}
          </button>
        ))}
      </div>
      <div className="toy-row">
        <Space3D size={300} planes={sc.planes} lines={sc.lines} />
        <div className="toy-side">
          <Readout good={sc.good}>{sc.note}</Readout>
        </div>
      </div>
    </div>
  )
}

/* p.196, equation (1): each row times x. Also Example 3. */
export function RowsTimesX({ A, start, goal = true }) {
  const [x, setX] = useState(start || A[0].map(() => 0))
  const dots = A.map((r) => dot(r, x))
  const found = dots.every((d) => d === 0) && nonzero(x)
  const big = Math.max(...x.map(Math.abs), 1)
  const show3d = A[0].length === 3 && rank(A) === 2
  useReport(`A = ${JSON.stringify(A)}, x = ${fmtVec(x)}, Ax = ${fmtVec(dots)}`)
  return (
    <div className="toy-row">
      <div className="toy-side">
        <M>{`A = ${matTex(A)}`}</M>
        <VectorStepper value={x} onChange={setX} labels={x.map((_, i) => `x${'₁₂₃₄'[i]}`)} color={C.null} min={-5} max={5} />
        {A.map((r, i) => (
          <Readout key={i} good={dots[i] === 0 && nonzero(x)}>
            (row {i + 1}) · x = {r.map((a, j) => `${a}·${paren(x[j])}`).join(' + ')} = <b>{dots[i]}</b>
          </Readout>
        ))}
        {goal && <p className={`small ${found ? 'good-text' : 'muted'}`}>{found ? '✓ x is in the nullspace, perpendicular to every row.' : 'Find a nonzero x that zeroes every row.'}</p>}
      </div>
      {show3d && (
        <Space3D
          size={300}
          planes={[{ u: A[0], w: A[1], color: C.row, label: 'row space' }]}
          lines={found ? [{ d: x, color: C.null, label: 'nullspace' }] : []}
          vectors={nonzero(x) ? [{ v: scale(x, 2.4 / big), color: C.null, label: 'x' }] : []}
        />
      )}
    </div>
  )
}

/* p.196, equation (3): each column times y. */
export function ColumnsTimesY({ A }) {
  const cols = transpose(A)
  const [y, setY] = useState(A.map(() => 0))
  const dots = cols.map((c) => dot(c, y))
  const found = dots.every((d) => d === 0) && nonzero(y)
  useReport(`A = ${JSON.stringify(A)}, y = ${fmtVec(y)}, Aᵀy = ${fmtVec(dots)}`)
  return (
    <div className="toy-side">
      <M>{`A = ${matTex(A)}`}</M>
      <VectorStepper value={y} onChange={setY} labels={y.map((_, i) => `y${'₁₂₃₄'[i]}`)} color={C.left} min={-5} max={5} />
      {cols.map((c, i) => (
        <Readout key={i} good={dots[i] === 0 && nonzero(y)}>
          (column {i + 1}) · y = <b>{dots[i]}</b>
        </Readout>
      ))}
      <p className={`small ${found ? 'good-text' : 'muted'}`}>
        {found ? '✓ y is in the left nullspace: perpendicular to every column, so to the whole column space.' : 'Find a nonzero y with Aᵀy = 0.'}
      </p>
    </div>
  )
}

/* Figure 4.2, live: the four subspaces and their dimensions. */
function SpaceBox({ x, y, dim, color, label, right, below }) {
  const h = 26 + 30 * dim
  const w = 130
  if (dim === 0)
    return (
      <g>
        <circle cx={x} cy={y} r={5} fill={color} />
        <text x={right ? x + 10 : x - 10} y={below ? y + 22 : y - 12} textAnchor={right ? 'start' : 'end'} className="svg-label small" fill={color}>
          {label} = {'{0}'}
        </text>
      </g>
    )
  const left = right ? x : x - w
  const top = below ? y : y - h
  return (
    <g>
      <rect x={left} y={top} width={w} height={h} fill={color} opacity={0.18} stroke={color} rx={4} />
      <text x={left + w / 2} y={top + h / 2 - 4} textAnchor="middle" className="svg-label small" fill={color}>
        {label}
      </text>
      <text x={left + w / 2} y={top + h / 2 + 14} textAnchor="middle" className="svg-label small" fill={color}>
        dim {dim}
      </text>
    </g>
  )
}
const Sub = ({ children }) => (
  <tspan baselineShift="sub" fontSize="0.75em">
    {children}
  </tspan>
)
export function BigPictureToy({ initial }) {
  const [A, setA] = useState(
    initial || [
      [1, 2, 1],
      [3, 4, 3],
    ],
  )
  const m = A.length
  const n = A[0].length
  const r = rank(A)
  useReport(`A = ${JSON.stringify(A)} (${m} by ${n}), rank r = ${r}`)
  const W = 620
  const H = 330
  const midY = 165
  return (
    <div>
      <div className="toy-controls">
        <span className="small muted">size</span>
        <Stepper value={m} min={1} max={4} label="m" onChange={(v) => setA(resize(A, v, n))} />
        <Stepper value={n} min={1} max={4} label="n" onChange={(v) => setA(resize(A, m, v))} />
        <MatrixEditor A={A} onChange={setA} />
        <span className="small">rank r = <b>{r}</b></span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="bigpicture">
        <text x={150} y={20} textAnchor="middle" className="svg-label small muted">inside Rⁿ = R{'⁰¹²³⁴'[n]}</text>
        <text x={470} y={20} textAnchor="middle" className="svg-label small muted">inside Rᵐ = R{'⁰¹²³⁴'[m]}</text>
        {/* Row space above, nullspace below, meeting at a right angle */}
        <SpaceBox x={215} y={midY} dim={r} color={C.row} label="row space" />
        <SpaceBox x={215} y={midY} dim={n - r} color={C.null} label="nullspace" below />
        <SpaceBox x={405} y={midY} dim={r} color={C.col} label="column space" right />
        <SpaceBox x={405} y={midY} dim={m - r} color={C.left} label="left nullspace" right below />
        <path d={`M 215 ${midY - 12} h -12 v 12`} fill="none" stroke="#475569" />
        <path d={`M 405 ${midY - 12} h 12 v 12`} fill="none" stroke="#475569" />
        {r > 0 && (
          <g>
            <line x1={222} y1={midY - 40} x2={398} y2={midY - 40} stroke={C.col} strokeWidth={2} markerEnd="url(#bp-arrow)" />
            <text x={310} y={midY - 48} textAnchor="middle" className="svg-label small">Ax<Sub>r</Sub> = b</text>
          </g>
        )}
        {n - r > 0 && (
          <g>
            <line x1={222} y1={midY + 40} x2={398} y2={midY + 6} stroke={C.null} strokeWidth={2} markerEnd="url(#bp-arrow)" strokeDasharray="5 4" />
            <text x={310} y={midY + 46} textAnchor="middle" className="svg-label small">Ax<Sub>n</Sub> = 0</text>
          </g>
        )}
        <circle cx={405} cy={midY} r={4} fill="#0f172a" />
        <defs>
          <marker id="bp-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="#475569" />
          </marker>
        </defs>
        <text x={150} y={H - 10} textAnchor="middle" className="svg-label small">r + (n − r) = {r} + {n - r} = {n}</text>
        <text x={470} y={H - 10} textAnchor="middle" className="svg-label small">r + (m − r) = {r} + {m - r} = {m}</text>
      </svg>
      <table className="basis-table">
        <tbody>
          <tr><td style={{ color: C.row }}>row space</td><td>{rowSpaceBasis(A).map(fmtVec).join('  ') || '{0}'}</td></tr>
          <tr><td style={{ color: C.null }}>nullspace</td><td>{nullspaceBasis(A).map(fmtVec).join('  ') || '{0}'}</td></tr>
          <tr><td style={{ color: C.col }}>column space</td><td>{columnSpaceBasis(A).map(fmtVec).join('  ') || '{0}'}</td></tr>
          <tr><td style={{ color: C.left }}>left nullspace</td><td>{nullspaceBasis(transpose(A)).map(fmtVec).join('  ') || '{0}'}</td></tr>
        </tbody>
      </table>
    </div>
  )
}

/* Figure 4.3 with Example 5: x = x_r + x_n and Ax = Ax_r. */
export function SplitToy() {
  const A = [
    [1, 2],
    [3, 6],
  ]
  const [x, setX] = useState([4, 3])
  const xr = projectOnto(x, [1, 2])
  const xn = sub(x, xr)
  const Ax = matVec(A, x)
  useReport(`A = [[1,2],[3,6]], x = ${fmtVec(x)} = x_r ${fmtVec(xr)} + x_n ${fmtVec(xn)}, Ax = ${fmtVec(Ax)}`)
  return (
    <div>
      <div className="toy-row">
        <Plane2D
          title="Rⁿ: drag x"
          size={280}
          range={5}
          lines={[
            { d: [1, 2], color: C.row, label: 'row space' },
            { d: [2, -1], color: C.null, label: 'nullspace' },
          ]}
          vectors={[
            { id: 'xr', v: xr, color: C.row, label: 'x_r', width: 3 },
            { id: 'xn', v: xn, from: xr, color: C.null, label: 'x_n', width: 3, dash: true },
            { id: 'x', v: x, color: C.x, label: 'x', drag: true },
          ]}
          onDrag={(_, p) => setX(p)}
        />
        <div className="arrow-col">
          <div className="big-arrow">A →</div>
        </div>
        <Plane2D
          title="Rᵐ: Ax"
          size={280}
          range={40}
          gridStep={10}
          lines={[{ d: [1, 3], color: C.col, label: 'column space' }]}
          vectors={nonzero(Ax) ? [{ id: 'Ax', v: Ax, color: C.col, label: 'Ax' }] : []}
        />
      </div>
      <Readout>
        <M>{`A = ${matTex(A)},\\quad x = ${fmtVec(x)} = \\textcolor{${C.row}}{${fmtVec(xr)}} + \\textcolor{${C.null}}{${fmtVec(xn)}},\\quad Ax = Ax_r = ${fmtVec(Ax)}`}</M>
      </Readout>
    </div>
  )
}

/* Example 4: the r by r invertible submatrix in the pivot rows and columns. */
const EX4 = {
  A: [
    [3, 0, 0, 0, 0],
    [0, 5, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ],
  B: [
    [1, 2, 3, 4, 5],
    [1, 2, 4, 5, 6],
    [1, 2, 4, 5, 6],
  ],
}
export function SubmatrixToy() {
  const [A, setA] = useState(EX4.B)
  const cols = rref(A).pivots
  const rows = pivotRows(A)
  const S = rows.map((i) => cols.map((j) => A[i][j]))
  const d = S.length ? det(S) : 0
  useReport(`A = ${JSON.stringify(A)}, pivot rows ${rows.map((i) => i + 1)}, pivot columns ${cols.map((j) => j + 1)}, submatrix ${JSON.stringify(S)}`)
  return (
    <div>
      <div className="tabs">
        <button className="tab" onClick={() => setA(EX4.A)}>like the book's A</button>
        <button className="tab" onClick={() => setA(EX4.B)}>like the book's B</button>
      </div>
      <div className="toy-row">
        <table className="sub-grid">
          <tbody>
            {A.map((row, i) => (
              <tr key={i}>
                {row.map((x, j) => {
                  const inR = rows.includes(i)
                  const inC = cols.includes(j)
                  return (
                    <td key={j} className={inR && inC ? 'hit' : inR || inC ? 'lane' : ''}>
                      <input
                        value={x}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const v = Number(e.target.value)
                          if (Number.isFinite(v)) setA(A.map((r, a) => r.map((y, b) => (a === i && b === j ? v : y))))
                        }}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="toy-side">
          <Readout>
            rank r = <b>{rows.length}</b>. Pivot rows {rows.map((i) => i + 1).join(', ') || '–'}, pivot columns{' '}
            {cols.map((j) => j + 1).join(', ') || '–'}
          </Readout>
          {S.length > 0 && (
            <Readout good={Math.abs(d) > 1e-9}>
              <M>{`${matTex(S)}\\quad \\det = ${fmt(d)} \\ne 0`}</M> : invertible
            </Readout>
          )}
          <p className="small muted">Edit any entry. The highlighted r×r block is always invertible.</p>
        </div>
      </div>
    </div>
  )
}

/* Figure 4.4: row space = plane, nullspace = orthogonal line. */
export function Figure44() {
  const A = [
    [1, 2, 1],
    [3, 4, 3],
  ]
  return (
    <div className="toy-row">
      <Space3D
        size={320}
        planes={[{ u: A[0], w: A[1], color: C.row, label: 'row space' }]}
        lines={[{ d: [1, 0, -1], color: C.null, label: 'nullspace (1,0,−1)' }]}
        vectors={[
          { v: scale(A[0], 0.8), color: C.row, label: 'row 1' },
          { v: scale(A[1], 0.45), color: C.row, label: 'row 2' },
        ]}
      />
      <div className="toy-side">
        <M>{`A = ${matTex(A)}`}</M>
        <p className="small muted">Rotate until the plane looks like a line. The nullspace stands straight up from it. Dimensions 2 + 1 = 3.</p>
      </div>
    </div>
  )
}

/* p.200: n vectors in Rⁿ: independent ⇔ span. */
export function CountToy() {
  const [a, setA] = useState([2, 1])
  const [b, setB] = useState([-1, 2])
  const d = a[0] * b[1] - a[1] * b[0]
  const ok = Math.abs(d) > 1e-9
  useReport(`a = ${fmtVec(a)}, b = ${fmtVec(b)}, ${ok ? 'independent' : 'dependent'}`)
  return (
    <div className="toy-row">
      <Plane2D
        size={280}
        range={5}
        shapes={ok ? [{ points: [[0, 0], a, add(a, b), b], color: C.sum, opacity: 0.2 }] : []}
        lines={!ok && nonzero(a) ? [{ d: a, color: C.bad, label: 'all you can reach' }] : []}
        vectors={[
          { id: 'a', v: a, color: C.v, label: 'a', drag: true },
          { id: 'b', v: b, color: C.w, label: 'b', drag: true },
        ]}
        onDrag={(id, p) => (id === 'a' ? setA(p) : setB(p))}
      />
      <div className="toy-side">
        <Readout good={ok}>{ok ? '✓' : '✗'} independent</Readout>
        <Readout good={ok}>{ok ? '✓' : '✗'} span R²</Readout>
        <p className="small muted">Try to make one true and the other false. You can't.</p>
      </div>
    </div>
  )
}

/* Problem 6: multiply the equations to reach 0 = 1. */
export function FredholmToy({ A, b, names = ['x', 'y', 'z'] }) {
  const [y, setY] = useState(A.map(() => 0))
  const combo = A[0].map((_, j) => dot(y, A.map((r) => r[j])))
  const rhs = dot(y, b)
  const ok = combo.every((c) => c === 0) && rhs !== 0
  const eq = (c, r) => {
    let s = ''
    c.forEach((k, i) => {
      if (k === 0) return
      s += `${k < 0 ? (s ? ' − ' : '−') : s ? ' + ' : ''}${Math.abs(k) === 1 ? '' : Math.abs(k)}${names[i]}`
    })
    return `${s || '0'} = ${r}`
  }
  return (
    <div className="equations">
      {A.map((row, i) => (
        <div className="eq-line" key={i}>
          <Stepper value={y[i]} onChange={(v) => setY(y.map((t, j) => (j === i ? v : t)))} color={C.left} min={-3} max={3} />
          <span className="times">×</span>
          <span className="eq-text">{eq(row, b[i])}</span>
        </div>
      ))}
      <div className="eq-line sum">
        <span className="eq-label">sum:</span>
        <span className={`eq-text ${ok ? 'bad-text' : ''}`}>{eq(combo, rhs)}</span>
        {ok && <span className="feedback good">✓ y = {fmtVec(y)} is in N(Aᵀ) with yᵀb = {rhs}</span>}
      </div>
    </div>
  )
}
