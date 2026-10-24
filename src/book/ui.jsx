import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Question } from '../components/Quiz.jsx'
import { addQuote } from '../ask/store.js'
import { MB } from '../components/Tex.jsx'

// A titled subsection with the book page in the margin.
export function Part({ id, title, page, children }) {
  return (
    <section className="part" id={id}>
      <div className="part-head">
        <h2>{title}</h2>
        {page && <span className="page-mark">p. {page}</span>}
      </div>
      {children}
    </section>
  )
}

// Strang's boxed statements: definitions and theorems.
export function Boxed({ label, children, tex }) {
  return (
    <div className="boxed">
      {label && <div className="boxed-label">{label}</div>}
      {children}
      {tex && <MB>{tex}</MB>}
    </div>
  )
}

export function Example({ n, children }) {
  return (
    <div className="example">
      <span className="example-label">Example {n}</span> {children}
    </div>
  )
}

// Toys describe their current state (e.g. the matrix typed in) so it can be quoted in a question.
const ToyReport = createContext(null)
export function useReport(text) {
  const ref = useContext(ToyReport)
  useEffect(() => {
    if (ref) ref.current = text
  }, [ref, text])
}

// A toy sits in its own frame with a one-line caption ("Figure 4.1, live").
export function Toy({ caption, children }) {
  const state = useRef('')
  const frame = useRef(null)
  const quote = () => {
    const part = frame.current?.closest('.part')
    addQuote({
      kind: 'toy',
      text: [caption, state.current && `Current state: ${state.current}`].filter(Boolean).join(' '),
      partId: part?.id,
      partTitle: part?.querySelector('h2')?.textContent,
    })
  }
  return (
    <figure className="toy" ref={frame}>
      {!import.meta.env.VITE_NO_ASK && <button className="quote-toy" title="Ask about this toy" onClick={quote}>
        ❝ Ask
      </button>}
      <ToyReport.Provider value={state}>{children}</ToyReport.Provider>
      {caption && <figcaption className="toy-caption">{caption}</figcaption>}
    </figure>
  )
}

// One quick inline check. q: see Question in Quiz.jsx.
export function Try({ q }) {
  return (
    <div className="try">
      <div className="try-label">Try it</div>
      <Question q={q} />
    </div>
  )
}

// Optional detail hidden by default.
export function More({ label = 'Show the proof', children }) {
  return (
    <details className="more">
      <summary>{label}</summary>
      <div className="more-body">{children}</div>
    </details>
  )
}

export function FlipCard({ front, back }) {
  const [open, setOpen] = useState(false)
  return (
    <button className={`flip ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
      <div className="flip-front">{front}</div>
      {open ? <div className="flip-back">{back}</div> : <div className="flip-tap">tap to reveal</div>}
    </button>
  )
}

// Steps revealed one at a time, each optionally gated by a question.
export function Steps({ items }) {
  const [shown, setShown] = useState(1)
  const [done, setDone] = useState(() => new Set())
  return (
    <ol className="steps">
      {items.slice(0, shown).map((it, i) => {
        const gated = it.q && !done.has(i)
        return (
          <li key={i}>
            <div className="step-prompt">{it.prompt}</div>
            {it.q && <Question q={it.q} onDone={() => setDone((d) => new Set(d).add(i))} />}
            {!gated && it.answer && <div className="step-answer">{it.answer}</div>}
            {i === shown - 1 && shown < items.length && (
              <button className="btn ghost small-btn" disabled={gated} onClick={() => setShown(shown + 1)}>
                Next part →
              </button>
            )}
          </li>
        )
      })}
    </ol>
  )
}

// Enter a vector; check(v) returns true or a hint string.
export function VectorAnswer({ n, check, labels, onCorrect }) {
  const [vals, setVals] = useState(() => Array(n).fill(''))
  const [result, setResult] = useState(null)
  const nums = vals.map((v) => Number(v))
  const ready = vals.every((v) => v.trim() !== '' && Number.isFinite(Number(v)))
  const submit = () => {
    const r = check(nums)
    setResult(r)
    if (r === true) onCorrect?.(nums)
  }
  return (
    <div className="vector-answer">
      <span className="paren">(</span>
      {vals.map((v, i) => (
        <input
          key={i}
          value={v}
          placeholder={labels?.[i] ?? ''}
          inputMode="decimal"
          onChange={(e) => {
            setVals(vals.map((x, j) => (j === i ? e.target.value : x)))
            setResult(null)
          }}
          onKeyDown={(e) => e.key === 'Enter' && ready && submit()}
        />
      ))}
      <span className="paren">)</span>
      <button className="btn primary small-btn" disabled={!ready} onClick={submit}>
        Check
      </button>
      {result === true && <span className="feedback good">✓ Works!</span>}
      {typeof result === 'string' && <span className="feedback bad">{result}</span>}
    </div>
  )
}
