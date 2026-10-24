// Integer steppers and a small matrix editor.

export function Stepper({ value, onChange, min = -9, max = 9, step = 1, label, color }) {
  const set = (v) => onChange(Math.max(min, Math.min(max, Math.round(v / step) * step)))
  return (
    <div className="stepper" style={color ? { borderColor: color } : undefined}>
      {label && <span className="stepper-label" style={color ? { color } : undefined}>{label}</span>}
      <button onClick={() => set(value - step)} aria-label="decrease">−</button>
      <span className="stepper-val">{value}</span>
      <button onClick={() => set(value + step)} aria-label="increase">+</button>
    </div>
  )
}

export function VectorStepper({ value, onChange, labels, color, min, max }) {
  return (
    <div className="vector-stepper">
      {value.map((x, i) => (
        <Stepper
          key={i}
          label={labels?.[i]}
          color={color}
          value={x}
          min={min}
          max={max}
          onChange={(v) => onChange(value.map((y, j) => (j === i ? v : y)))}
        />
      ))}
    </div>
  )
}

export function MatrixEditor({ A, onChange, min = -9, max = 9 }) {
  const set = (i, j, raw) => {
    const v = raw === '' || raw === '-' ? 0 : Number(raw)
    if (!Number.isFinite(v)) return
    onChange(A.map((row, r) => row.map((x, c) => (r === i && c === j ? Math.max(min, Math.min(max, v)) : x))))
  }
  return (
    <div className="matrix-editor" style={{ gridTemplateColumns: `repeat(${A[0].length}, 3.2em)` }}>
      {A.map((row, i) =>
        row.map((x, j) => (
          <input
            key={i + '-' + j}
            value={x}
            inputMode="numeric"
            onChange={(e) => set(i, j, e.target.value)}
            onFocus={(e) => e.target.select()}
          />
        )),
      )}
    </div>
  )
}
