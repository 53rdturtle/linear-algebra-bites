import { useEffect, useRef, useState } from 'react'
import Plane2D from '../components/Plane2D.jsx'
import Space3D from '../components/Space3D.jsx'
import { MatrixEditor, VectorStepper } from '../components/Inputs.jsx'
import { M, matTex } from '../components/Tex.jsx'
import { add, cross, dot, fmt, fmtVec, matVec, norm, nullspaceBasis, rank, rowSpaceBasis, scale } from '../lib/linalg.js'
import { C } from '../content/colors.js'

// Fire cb once whenever cond turns true.
function useWhen(cond, cb) {
  const fired = useRef(false)
  useEffect(() => {
    if (cond && !fired.current) {
      fired.current = true
      cb()
    }
    if (!cond) fired.current = false
  }, [cond, cb])
}

const nonzero = (v) => v.some((t) => Math.abs(t) > 1e-9)
const isZero = (t) => Math.abs(t) < 1e-9
const paren = (t) => (t < 0 ? `(${fmt(t)})` : fmt(t))

// "I think it's impossible" button that appears after a few attempts.
function GiveUp({ moves, onClaim, after = 3 }) {
  if (moves < after) return null
  return (
    <button className="btn impossible" onClick={onClaim}>
      🤔 I think this is impossible
    </button>
  )
}

function Live({ children, good }) {
  return <div className={`live ${good ? 'good' : ''}`}>{children}</div>
}

/* ---------------- 1. Zero ---------------- */
function Zero({ win, star }) {
  const v = [3, 1]
  const [w, setW] = useState([1, 2])
  const [found, setFound] = useState([])
  const d = dot(v, w)
  const ok = isZero(d) && nonzero(w)
  useWhen(ok, win)
  useEffect(() => {
    if (ok && !found.some((f) => f[0] === w[0] && f[1] === w[1])) setFound((f) => [...f, w])
  }, [ok, w, found])
  useWhen(found.length >= 3, star)
  return (
    <div className="board">
      <Plane2D
        range={5}
        vectors={[
          { id: 'v', v, color: C.v, label: 'v' },
          ...found.map((f, i) => ({ id: 'f' + i, v: f, color: '#86efac', width: 2 })),
          { id: 'w', v: w, color: C.w, label: 'w', drag: true },
        ]}
        onDrag={(_, p) => setW(p)}
      />
      <div className="board-side">
        <Live good={ok}>
          v · w = 3·{paren(w[0])} + 1·{paren(w[1])} = <b>{fmt(d)}</b>
        </Live>
        {found.length > 0 && <div className="small muted">answers found: {found.map(fmtVec).join('  ')}</div>}
      </div>
    </div>
  )
}

/* ---------------- 2. Right triangle ---------------- */
function Triangle({ win }) {
  const [v, setV] = useState([3, 0])
  const [w, setW] = useState([1, 2])
  const s = add(v, w)
  const a2 = dot(v, v)
  const b2 = dot(w, w)
  const c2 = dot(s, s)
  const ok = isZero(a2 + b2 - c2) && nonzero(v) && nonzero(w)
  useWhen(ok, win)
  return (
    <div className="board">
      <Plane2D
        range={5}
        vectors={[
          { id: 'c', v: s, color: C.sum, label: 'c', width: 2.5 },
          { id: 'w2', v: w, from: v, color: C.w, dash: true, width: 2 },
          { id: 'v', v, color: C.v, label: 'a', drag: true },
          { id: 'w', v: w, color: C.w, label: 'b', drag: true },
        ]}
        onDrag={(id, p) => (id === 'v' ? setV(p) : setW(p))}
      />
      <div className="board-side">
        <Live good={ok}>
          <span style={{ color: C.v }}>a²</span> + <span style={{ color: C.w }}>b²</span> = {fmt(a2)} + {fmt(b2)} ={' '}
          <b>{fmt(a2 + b2)}</b>
        </Live>
        <Live good={ok}>
          <span style={{ color: C.sum }}>c²</span> = <b>{fmt(c2)}</b>
        </Live>
      </div>
    </div>
  )
}

/* ---------------- 3. Stick out ---------------- */
function StickOut({ win }) {
  const u = [1, 2, 0]
  const w = [0, 1, 1]
  const [d, setD] = useState([1, 0, 0])
  const du = dot(d, u)
  const dw = dot(d, w)
  const ok = du === 0 && dw === 0 && nonzero(d)
  useWhen(ok, win)
  const big = Math.max(...d.map(Math.abs), 1)
  return (
    <div className="board">
      <Space3D
        planes={[{ u, w, color: C.row, label: 'plane P' }]}
        vectors={[
          { v: u, color: C.row, label: 'u' },
          { v: w, color: C.row, label: 'w' },
          ...(nonzero(d) ? [{ v: scale(d, 2.6 / big), color: C.null, label: 'd' }] : []),
        ]}
        lines={ok ? [{ d, color: C.null }] : []}
      />
      <div className="board-side">
        <div className="small muted">Your arrow d:</div>
        <VectorStepper value={d} onChange={setD} labels={['x', 'y', 'z']} color={C.null} min={-4} max={4} />
        <Live good={du === 0}>
          d · u = <b>{du}</b>
        </Live>
        <Live good={dw === 0}>
          d · w = <b>{dw}</b>
        </Live>
      </div>
    </div>
  )
}

/* ---------------- 4. Two walls (impossible) ---------------- */
function TwoWalls({ win }) {
  const [n, setN] = useState([1, 0, 0])
  const [moves, setMoves] = useState(0)
  const floorN = [0, 0, 1]
  const shared = cross(floorN, n)
  const same = !nonzero(shared)
  // The wall with facing direction n is spanned by two vectors perpendicular to n.
  const e1 = same ? [1, 0, 0] : shared
  const e2 = same ? [0, 1, 0] : cross(n, shared)
  return (
    <div className="board">
      <Space3D
        planes={[
          { u: [1, 0, 0], w: [0, 1, 0], color: C.row, label: 'floor' },
          ...(nonzero(n) ? [{ u: e1, w: e2, color: C.col, label: 'wall W' }] : []),
        ]}
        lines={!same && nonzero(n) ? [{ d: shared, color: C.bad, label: 'in both!' }] : []}
      />
      <div className="board-side">
        <div className="small muted">Tilt the wall with its "facing direction":</div>
        <VectorStepper
          value={n}
          onChange={(v) => {
            setN(v)
            setMoves((m) => m + 1)
          }}
          labels={['x', 'y', 'z']}
          color={C.col}
          min={-3}
          max={3}
        />
        {nonzero(n) && (
          <Live>
            {same ? (
              'That wall is the floor itself!'
            ) : (
              <>
                The red line {fmtVec(shared)} lies in <b>both</b>. Its dot product with itself is {fmt(dot(shared, shared))}, not 0.
              </>
            )}
          </Live>
        )}
        <GiveUp moves={moves} onClaim={win} />
      </div>
    </div>
  )
}

/* ---------------- 5. Hide from the rows ---------------- */
const A5 = [
  [1, 3, 4],
  [5, 2, 7],
]
function HideFromRows({ win }) {
  const [x, setX] = useState([0, 0, 0])
  const d1 = dot(A5[0], x)
  const d2 = dot(A5[1], x)
  const ok = d1 === 0 && d2 === 0 && nonzero(x)
  useWhen(ok, win)
  const big = Math.max(...x.map(Math.abs), 1)
  return (
    <div className="board">
      <Space3D
        planes={[{ u: A5[0], w: A5[1], color: C.row, label: 'rows' }]}
        lines={ok ? [{ d: x, color: C.null }] : []}
        vectors={[
          { v: scale(A5[0], 0.45), color: C.row, label: 'row 1' },
          { v: scale(A5[1], 0.3), color: C.row, label: 'row 2' },
          ...(nonzero(x) ? [{ v: scale(x, 2.4 / big), color: C.null, label: 'x' }] : []),
        ]}
      />
      <div className="board-side">
        <M>{`A = ${matTex(A5)}`}</M>
        <VectorStepper value={x} onChange={setX} labels={['x₁', 'x₂', 'x₃']} color={C.null} min={-5} max={5} />
        <Live good={ok}>
          Ax = ({d1}, {d2})
        </Live>
      </div>
    </div>
  )
}

/* ---------------- 6. 0 = 1 ---------------- */
const A6 = [
  [1, 2, 2],
  [2, 2, 3],
  [3, 4, 5],
]
const b6 = [5, 5, 9]
function eqText(c, rhs) {
  const names = ['x', 'y', 'z']
  let s = ''
  c.forEach((k, i) => {
    if (k === 0) return
    const sign = k < 0 ? (s ? ' − ' : '−') : s ? ' + ' : ''
    s += `${sign}${Math.abs(k) === 1 ? '' : Math.abs(k)}${names[i]}`
  })
  return `${s || '0'} = ${rhs}`
}
function ZeroEqualsOne({ win }) {
  const [y, setY] = useState([0, 0, 0])
  const combo = [0, 1, 2].map((j) => dot(y, A6.map((r) => r[j])))
  const rhs = dot(y, b6)
  const ok = combo.every((c) => c === 0) && rhs !== 0
  useWhen(ok, win)
  return (
    <div className="board column">
      <div className="equations">
        {A6.map((row, i) => (
          <div className="eq-line" key={i}>
            <VectorStepper value={[y[i]]} onChange={([v]) => setY(y.map((t, j) => (j === i ? v : t)))} color={C.left} min={-3} max={3} />
            <span className="times">×</span>
            <span className="eq-text">{eqText(row, b6[i])}</span>
          </div>
        ))}
        <div className="eq-line sum">
          <span className="eq-label">add up:</span>
          <span className={`eq-text ${ok ? 'bad-text' : ''}`}>{eqText(combo, rhs)}</span>
        </div>
      </div>
    </div>
  )
}

/* ---------------- 7. Two lines (impossible) ---------------- */
function TwoLines({ win }) {
  const [A, setA] = useState([
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ])
  const [moves, setMoves] = useState(0)
  const r = rank(A)
  const rowB = rowSpaceBasis(A)
  const nullB = nullspaceBasis(A)
  const shape = (B, color, label) =>
    B.length === 1 ? { lines: [{ d: B[0], color, label }], planes: [] } : B.length === 2 ? { lines: [], planes: [{ u: B[0], w: B[1], color, label }] } : { lines: [], planes: [] }
  const rs = shape(rowB, C.row, 'row space')
  const ns = shape(nullB, C.null, 'nullspace')
  const kind = (d) => ['just 0', 'a line', 'a plane', 'everything'][d]
  return (
    <div className="board">
      <Space3D planes={[...rs.planes, ...ns.planes]} lines={[...rs.lines, ...ns.lines]} />
      <div className="board-side">
        <MatrixEditor
          A={A}
          onChange={(next) => {
            setA(next)
            setMoves((m) => m + 1)
          }}
        />
        <Live good={r === 1}>
          <span style={{ color: C.row }}>row space</span>: {kind(r)}
        </Live>
        <Live good={3 - r === 1}>
          <span style={{ color: C.null }}>nullspace</span>: {kind(3 - r)}
        </Live>
        <GiveUp moves={moves} onClaim={win} after={4} />
      </div>
    </div>
  )
}

/* ---------------- 8 & 9. The squashing matrix ---------------- */
const A8 = [
  [1, 2],
  [3, 6],
]
function Squash({ x, setX, target, extraLines = [] }) {
  const Ax = matVec(A8, x)
  return (
    <div className="board">
      <Plane2D
        title="input x"
        size={320}
        range={5}
        lines={extraLines}
        vectors={[{ id: 'x', v: x, color: C.x, label: 'x', drag: true }]}
        onDrag={(_, p) => setX(p)}
      />
      <div className="arrow-col">
        <div className="big-arrow">A →</div>
      </div>
      <Plane2D
        title="output Ax"
        size={320}
        range={30}
        gridStep={5}
        lines={[{ d: [1, 3], color: C.col, opacity: 0.25 }]}
        points={target ? [{ p: target, color: '#f59e0b' }] : []}
        vectors={nonzero(Ax) ? [{ id: 'Ax', v: Ax, color: C.col, label: 'Ax' }] : []}
      />
    </div>
  )
}

function Vanish({ win }) {
  const [x, setX] = useState([2, 1])
  const [hits, setHits] = useState([])
  const Ax = matVec(A8, x)
  const ok = !nonzero(Ax) && nonzero(x)
  useWhen(ok, win)
  useEffect(() => {
    if (ok && !hits.some((h) => h[0] === x[0] && h[1] === x[1])) setHits((h) => [...h, x])
  }, [ok, x, hits])
  return (
    <>
      <Squash x={x} setX={setX} extraLines={hits.length ? [{ d: [2, -1], color: C.null, label: 'nullspace' }] : []} />
      <Live good={ok}>
        Ax = {fmtVec(Ax)} {ok && ' (gone!)'}
      </Live>
    </>
  )
}

function Shortest({ win, star }) {
  const [x, setX] = useState([0, 1])
  const target = [5, 15]
  const Ax = matVec(A8, x)
  const ok = Ax[0] === 5 && Ax[1] === 15
  const best = x[0] === 1 && x[1] === 2
  const [solved, setSolved] = useState(false)
  useWhen(ok, () => {
    setSolved(true)
    win()
  })
  useWhen(best, star)
  return (
    <>
      <Squash
        x={x}
        setX={setX}
        target={target}
        extraLines={
          solved
            ? [
                { d: [2, -1], through: [5, 0], color: '#f59e0b', label: 'all answers', dash: true },
                ...(best ? [{ d: [1, 2], color: C.row, label: 'row space' }] : []),
              ]
            : []
        }
      />
      <Live good={ok}>
        Ax = {fmtVec(Ax)} · length of x = {fmt(norm(x))}
      </Live>
    </>
  )
}

/* ---------------- 10. Can't reach ---------------- */
function CantReach({ win }) {
  const [a, setA] = useState([2, 1])
  const [b, setB] = useState([-1, 2])
  const det = a[0] * b[1] - a[1] * b[0]
  const ok = isZero(det) && nonzero(a) && nonzero(b)
  useWhen(ok, win)
  return (
    <div className="board">
      <Plane2D
        range={5}
        shapes={ok ? [] : [{ points: [[-5, -5], [5, -5], [5, 5], [-5, 5]], color: C.sum, opacity: 0.08 }]}
        lines={ok ? [{ d: a, color: C.sum, label: 'all you can reach' }] : []}
        vectors={[
          { id: 'a', v: a, color: C.v, label: 'a', drag: true },
          { id: 'b', v: b, color: C.w, label: 'b', drag: true },
        ]}
        onDrag={(id, p) => (id === 'a' ? setA(p) : setB(p))}
      />
      <div className="board-side">
        <Live good={ok}>{ok ? 'Only one line is reachable now.' : 'Right now, combinations of a and b reach the whole plane (shaded).'}</Live>
      </div>
    </div>
  )
}

export const pack = {
  id: 'perp',
  title: 'Perpendicular',
  subtitle: 'Strang 4.1 · Orthogonality of the Four Subspaces',
  levels: [
    {
      id: 'perp-1',
      title: 'Zero',
      goal: 'Drag w until v · w is exactly 0.',
      starGoal: 'Find 3 different answers.',
      hints: ['Multiply matching entries and add: 3·w₁ + 1·w₂.', 'Try w₂ = −3·w₁.'],
      Board: Zero,
      reveal: {
        name: 'Orthogonal vectors',
        line: 'Your w is perpendicular to v. That is exactly what v · w = 0 means.',
        tex: 'v \\perp w \\iff v^Tw = 0',
        extra: 'The answers form a whole line. Every multiple works.',
        page: 194,
        anchor: 'orthogonal-vectors',
      },
    },
    {
      id: 'perp-2',
      title: 'Pythagoras',
      goal: 'Drag a and b until a² + b² = c².',
      hints: ['That only happens in a right triangle.', 'Make a and b perpendicular. Level 1 showed you how.'],
      Board: Triangle,
      reveal: {
        name: 'Pythagoras = zero dot product',
        line: 'The leftover between a² + b² and c² is always 2(a · b). It vanishes exactly at a right angle.',
        tex: '\\|a+b\\|^2 = \\|a\\|^2 + \\|b\\|^2 + 2\\,a^Tb',
        page: 194,
        anchor: 'orthogonal-vectors',
      },
    },
    {
      id: 'perp-3',
      title: 'Stick out',
      goal: 'Find an arrow d perpendicular to the whole plane P.',
      hints: ['It has to be perpendicular to both u and w.', 'Start with z = 1, then fix x and y one at a time.'],
      Board: StickOut,
      reveal: {
        name: 'Orthogonal subspaces',
        line: 'Being perpendicular to u and w makes d perpendicular to every vector in the plane. The line and the plane are orthogonal subspaces.',
        tex: 'v^Tw = 0 \\text{ for every } v \\in V,\\ w \\in W',
        page: 195,
        anchor: 'orthogonal-subspaces',
      },
    },
    {
      id: 'perp-4',
      title: 'Two walls',
      goal: 'Tilt wall W so that every vector in it is perpendicular to every vector in the floor.',
      hints: ['Watch the red line. Can you ever get rid of it?', 'A vector in both planes would need to be perpendicular to itself.'],
      Board: TwoWalls,
      reveal: {
        name: 'Two planes in 3D can never be orthogonal',
        line: 'They always share a line, and nothing nonzero is perpendicular to itself. Dimensions must fit: 2 + 2 > 3.',
        tex: '\\dim V + \\dim W \\le n',
        page: 195,
        anchor: 'orthogonal-subspaces',
      },
    },
    {
      id: 'perp-5',
      title: 'Hide from the rows',
      goal: 'Find a nonzero x with Ax = 0.',
      hints: ['Ax = 0 means x · (row 1) = 0 and x · (row 2) = 0.', 'Small numbers work. Try x₃ = −1.'],
      Board: HideFromRows,
      reveal: {
        name: 'The nullspace ⟂ the row space',
        line: 'Solving Ax = 0 is finding vectors perpendicular to every row. Rotate the view: x sticks straight out of the rows plane.',
        tex: 'N(A) \\perp C(A^T)',
        page: 196,
        anchor: 'row-null',
      },
    },
    {
      id: 'perp-6',
      title: '0 = 1',
      goal: 'Multiply the equations and add them up so that every x, y, z cancels but the right side does not.',
      hints: ['Row 3 looks a lot like row 1 + row 2…', 'Try 1, 1, −1.'],
      Board: ZeroEqualsOne,
      reveal: {
        name: 'The left nullspace',
        line: 'You proved the system has no solution. Your multipliers y kill every column (Aᵀy = 0), but yᵀb ≠ 0, so b is outside the column space.',
        tex: 'N(A^T) \\perp C(A)',
        page: 196,
        anchor: 'left-null',
      },
    },
    {
      id: 'perp-7',
      title: 'Two lines',
      goal: 'Edit the matrix so that the row space is a line AND the nullspace is a line.',
      hints: ['Watch both labels as you edit. What happens to one when the other changes?', 'A line plus a line is 2 dimensions. Where does the third go?'],
      Board: TwoLines,
      reveal: {
        name: 'Orthogonal complements',
        line: 'Row space and nullspace always fill all of R³ between them: r + (3 − r) = 3. Two lines only make 2.',
        tex: 'N(A) = C(A^T)^{\\perp}, \\quad r + (n - r) = n',
        page: 197,
        anchor: 'complements',
      },
    },
    {
      id: 'perp-8',
      title: 'Vanish',
      goal: 'Find a nonzero x that this matrix sends to zero.',
      hints: ['A = [1 2; 3 6]. Both rows are multiples of (1, 2).', 'Make x perpendicular to (1, 2).'],
      Board: Vanish,
      reveal: {
        name: 'A erases the nullspace',
        line: 'Every x on the orange line disappears. Moving x along that line never changes Ax. Try it!',
        tex: 'Ax_n = 0',
        page: 198,
        anchor: 'split',
      },
    },
    {
      id: 'perp-9',
      title: 'Shortest route',
      goal: 'Drag x so that Ax lands on the ★.',
      starGoal: 'Find the shortest x that works.',
      hints: ['Ax = (t, 3t) where t = x₁ + 2x₂. You need t = 5.', 'For the ★ bonus: the shortest answer is perpendicular to the dashed line.'],
      Board: Shortest,
      reveal: {
        name: 'Row part + null part',
        line: 'All answers differ by nullspace vectors (the dashed line). A only "sees" the row space part of x, and the shortest answer is that row space part itself.',
        tex: 'Ax = A(x_r + x_n) = Ax_r',
        page: 198,
        anchor: 'split',
      },
    },
    {
      id: 'perp-10',
      title: "Can't reach",
      goal: 'Place a and b so that some points of the plane can no longer be reached by combinations of them.',
      hints: ['When can two arrows only make one line?'],
      Board: CantReach,
      reveal: {
        name: 'The count is right',
        line: 'With 2 vectors in R², "independent" and "reach everything" fail together. With n vectors in Rⁿ, one test is enough.',
        tex: '\\text{n independent} \\iff \\text{span } \\mathbf{R}^n',
        page: 200,
        anchor: 'bases',
      },
    },
  ],
}

export const comingPacks = [
  { title: 'Shadows', subtitle: '4.2 · Projections' },
  { title: 'Best fit', subtitle: '4.3 · Least squares' },
  { title: 'Straighten up', subtitle: '4.4 · Gram-Schmidt' },
  { title: 'Stretch', subtitle: '6 · Eigenvectors' },
]
