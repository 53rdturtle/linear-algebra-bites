// Small linear algebra helpers for vectors (arrays) and matrices (arrays of rows).

export const EPS = 1e-9

export const dot = (a, b) => a.reduce((s, ai, i) => s + ai * b[i], 0)
export const add = (a, b) => a.map((ai, i) => ai + b[i])
export const sub = (a, b) => a.map((ai, i) => ai - b[i])
export const scale = (a, c) => a.map((ai) => ai * c)
export const norm = (a) => Math.sqrt(dot(a, a))
export const transpose = (A) => A[0].map((_, j) => A.map((row) => row[j]))
export const matVec = (A, x) => A.map((row) => dot(row, x))

export function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

// Projection of x onto the line through d.
export function projectOnto(x, d) {
  const dd = dot(d, d)
  return dd < EPS ? x.map(() => 0) : scale(d, dot(x, d) / dd)
}

// Reduced row echelon form. Returns { R, pivots }.
export function rref(A) {
  const R = A.map((row) => row.slice())
  const m = R.length
  const n = R[0].length
  const pivots = []
  let r = 0
  for (let c = 0; c < n && r < m; c++) {
    let best = r
    for (let i = r + 1; i < m; i++) if (Math.abs(R[i][c]) > Math.abs(R[best][c])) best = i
    if (Math.abs(R[best][c]) < EPS) continue
    ;[R[r], R[best]] = [R[best], R[r]]
    const p = R[r][c]
    R[r] = R[r].map((v) => v / p)
    for (let i = 0; i < m; i++) {
      if (i !== r && Math.abs(R[i][c]) > EPS) {
        const f = R[i][c]
        R[i] = R[i].map((v, j) => v - f * R[r][j])
      }
    }
    pivots.push(c)
    r++
  }
  return { R, pivots }
}

export const rank = (A) => rref(A).pivots.length

// Special solutions of Ax = 0, one per free column.
export function nullspaceBasis(A) {
  const n = A[0].length
  const { R, pivots } = rref(A)
  const free = [...Array(n).keys()].filter((c) => !pivots.includes(c))
  return free.map((f) => {
    const x = Array(n).fill(0)
    x[f] = 1
    pivots.forEach((p, i) => {
      x[p] = -R[i][f]
    })
    return cleanVec(x)
  })
}

// Independent rows of A (nonzero rows of R) span the row space.
export function rowSpaceBasis(A) {
  const { R, pivots } = rref(A)
  return R.slice(0, pivots.length).map(cleanVec)
}

export function columnSpaceBasis(A) {
  const { pivots } = rref(A)
  return pivots.map((p) => A.map((row) => row[p]))
}

export function cleanNum(v) {
  const r = Math.round(v)
  if (Math.abs(v - r) < 1e-9) return r === 0 ? 0 : r
  return Math.round(v * 1000) / 1000
}

export const cleanVec = (v) => v.map(cleanNum)

export function fmt(v) {
  const c = cleanNum(v)
  return Number.isInteger(c) ? String(c) : c.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

export const fmtVec = (v) => `(${v.map(fmt).join(', ')})`

export function det(A) {
  const M = A.map((r) => r.slice())
  const n = M.length
  let d = 1
  for (let c = 0; c < n; c++) {
    let p = c
    for (let i = c + 1; i < n; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i
    if (Math.abs(M[p][c]) < EPS) return 0
    if (p !== c) {
      ;[M[p], M[c]] = [M[c], M[p]]
      d = -d
    }
    d *= M[c][c]
    for (let i = c + 1; i < n; i++) {
      const f = M[i][c] / M[c][c]
      for (let j = c; j < n; j++) M[i][j] -= f * M[c][j]
    }
  }
  return d
}

// Indices of rows that are independent of the rows before them.
export function pivotRows(A) {
  const keep = []
  A.forEach((row, i) => {
    if (rank([...keep.map((k) => A[k]), row]) > keep.length) keep.push(i)
  })
  return keep
}

export function resize(A, m, n) {
  return Array.from({ length: m }, (_, i) => Array.from({ length: n }, (_, j) => A[i]?.[j] ?? 0))
}
