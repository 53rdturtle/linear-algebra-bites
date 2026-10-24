import katex from 'katex'

function render(tex, displayMode) {
  return { __html: katex.renderToString(tex, { displayMode, throwOnError: false }) }
}

// Inline math: <M>{'v^T w = 0'}</M>
export function M({ children }) {
  return <span dangerouslySetInnerHTML={render(children, false)} />
}

// Display math on its own line.
export function MB({ children }) {
  return <div className="math-block" dangerouslySetInnerHTML={render(children, true)} />
}

export function vecTex(v) {
  return `\\begin{bmatrix}${v.join('\\\\')}\\end{bmatrix}`
}

export function matTex(A) {
  return `\\begin{bmatrix}${A.map((r) => r.join(' & ')).join('\\\\')}\\end{bmatrix}`
}
