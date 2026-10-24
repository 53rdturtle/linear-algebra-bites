import { useState } from 'react'
import { recordAnswer } from '../lib/progress.js'

// question: { id, prompt, type: 'choice'|'number', options, answer, tol, hint, explain }
export function Question({ q, index, onDone }) {
  const [picked, setPicked] = useState(null)
  const [text, setText] = useState('')
  const [result, setResult] = useState(null) // 'right' | 'wrong'
  const [tries, setTries] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const check = () => {
    let ok
    if (q.type === 'choice') ok = picked === q.answer
    else {
      const v = Number(text.trim())
      ok = text.trim() !== '' && Number.isFinite(v) && Math.abs(v - q.answer) <= (q.tol ?? 1e-6)
    }
    if (tries === 0) recordAnswer(q.id, ok)
    setTries((t) => t + 1)
    setResult(ok ? 'right' : 'wrong')
    if (ok) onDone?.()
  }

  const finished = result === 'right' || revealed
  const canCheck = q.type === 'choice' ? picked !== null : text.trim() !== ''

  return (
    <div className={`question ${result || ''}`}>
      <div className="q-prompt">
        {index != null && <span className="q-num">{index + 1}</span>}
        <div>{q.prompt}</div>
      </div>
      {q.type === 'choice' ? (
        <div className="choices">
          {q.options.map((opt, i) => (
            <button
              key={i}
              className={`choice ${picked === i ? 'picked' : ''} ${finished && i === q.answer ? 'correct' : ''}`}
              disabled={finished}
              onClick={() => {
                setPicked(i)
                setResult(null)
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <input
          className="num-input"
          inputMode="decimal"
          value={text}
          disabled={finished}
          placeholder="your answer"
          onChange={(e) => {
            setText(e.target.value)
            setResult(null)
          }}
          onKeyDown={(e) => e.key === 'Enter' && canCheck && check()}
        />
      )}
      {!finished && (
        <div className="q-actions">
          <button className="btn primary" disabled={!canCheck} onClick={check}>
            Check
          </button>
          {q.hint && !showHint && (
            <button className="btn ghost" onClick={() => setShowHint(true)}>
              Hint
            </button>
          )}
          {tries >= 2 && (
            <button className="btn ghost" onClick={() => { setRevealed(true); onDone?.() }}>
              Show answer
            </button>
          )}
        </div>
      )}
      {showHint && !finished && <div className="hint">💡 {q.hint}</div>}
      {result === 'wrong' && !revealed && <div className="feedback bad">Not quite. Try again.</div>}
      {finished && (
        <div className="feedback good">
          {result === 'right' ? (tries === 1 ? '✓ Correct!' : '✓ Got it.') : q.type === 'choice' ? 'The right answer is highlighted above.' : `Answer: ${q.answer}`}
          {q.explain && <div className="explain">{q.explain}</div>}
        </div>
      )}
    </div>
  )
}
