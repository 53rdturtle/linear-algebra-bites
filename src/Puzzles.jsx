import { useCallback, useEffect, useRef, useState } from 'react'
import { MB } from './components/Tex.jsx'
import { comingPacks, pack } from './puzzles/perpendicular.jsx'
import { solvePuzzle } from './lib/progress.js'

const packs = [pack]

export const levelById = Object.fromEntries(
  packs.flatMap((p) => p.levels.map((l, i) => [l.id, { ...l, pack: p, index: i }])),
)

export function PuzzleHome({ progress }) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  return (
    <div className="puzzle-home">
      <section className="intro">
        <h1>Pick any puzzle.</h1>
        <p className="muted">
          No order, no streaks, no reading required. Solve it, and you'll find out what you just discovered.
        </p>
      </section>
      {packs.map((p) => {
        const solved = p.levels.filter((l) => progress.solved[l.id]).length
        return (
          <section key={p.id} className="pack">
            <div className="pack-head">
              <h2>{p.title}</h2>
              <span className="muted small">{p.subtitle}</span>
              <span className="pack-count">
                {solved}/{p.levels.length}
              </span>
            </div>
            <div className="level-grid">
              {p.levels.map((l, i) => {
                const s = progress.solved[l.id]
                return (
                  <a key={l.id} href={`#/play/${l.id}`} className={`level-tile ${s ? 'solved' : ''}`}>
                    <span className="tile-num">{i + 1}</span>
                    <span className="tile-title">{l.title}</span>
                    <span className="tile-stars">
                      {s ? '●' : '○'}
                      {l.starGoal && (s?.star ? ' ★' : ' ☆')}
                    </span>
                  </a>
                )
              })}
            </div>
          </section>
        )
      })}
      <section className="pack coming">
        <div className="pack-head">
          <h2>More packs</h2>
          <span className="muted small">later, if you want them</span>
        </div>
        <div className="level-grid">
          {comingPacks.map((c) => (
            <div key={c.title} className="level-tile locked">
              <span className="tile-title">{c.title}</span>
              <span className="muted small">{c.subtitle}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export function PuzzleView({ id, progress }) {
  const level = levelById[id]
  const { pack: p, index, Board, reveal } = level
  const [won, setWon] = useState(false)
  const [starNow, setStarNow] = useState(false)
  const [hints, setHints] = useState(0)
  const revealRef = useRef(null)
  const prev = p.levels[index - 1]
  const next = p.levels[index + 1]
  const already = progress.solved[id]
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const win = useCallback(() => {
    setWon(true)
    solvePuzzle(id)
  }, [id])
  const star = useCallback(() => {
    setStarNow(true)
    solvePuzzle(id, true)
  }, [id])

  // Don't scroll while the player may still be dragging; offer a banner instead
  // until the reveal card is on screen.
  const [revealVisible, setRevealVisible] = useState(false)
  useEffect(() => {
    if (!won || !revealRef.current) return
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setRevealVisible(true), { threshold: 0.3 })
    obs.observe(revealRef.current)
    return () => obs.disconnect()
  }, [won])

  return (
    <div className="puzzle">
      <div className="puzzle-nav">
        <a href="#/">← {p.title}</a>
        <span className="muted small">
          {index + 1} / {p.levels.length}
        </span>
        <span className="puzzle-arrows">
          {prev && <a href={`#/play/${prev.id}`} title={prev.title}>‹</a>}
          {next && <a href={`#/play/${next.id}`} title={next.title}>›</a>}
        </span>
      </div>
      <h1 className="puzzle-title">
        {level.title} {already && !won && <span className="solved-tag">solved before</span>}
      </h1>
      <p className="puzzle-goal">{level.goal}</p>
      {level.starGoal && (
        <p className={`star-goal ${starNow || already?.star ? 'got' : ''}`}>
          {starNow || already?.star ? '★' : '☆'} Bonus: {level.starGoal}
        </p>
      )}

      <div className="puzzle-board">
        <Board win={win} star={star} />
      </div>

      {!won && (
        <div className="hint-bar">
          {level.hints.slice(0, hints).map((h, i) => (
            <div key={i} className="hint">💡 {h}</div>
          ))}
          {hints < level.hints.length && (
            <button className="btn ghost small-btn" onClick={() => setHints(hints + 1)}>
              {hints === 0 ? 'Hint' : 'Another hint'}
            </button>
          )}
        </div>
      )}

      {won && !revealVisible && (
        <button className="solved-banner" onClick={() => revealRef.current?.scrollIntoView({ behavior: 'smooth' })}>
          ✓ Solved! See what you discovered ↓
        </button>
      )}

      {won && (
        <section className="reveal" ref={revealRef}>
          <div className="reveal-kicker">You discovered</div>
          <h2>{reveal.name}</h2>
          <p>{reveal.line}</p>
          <MB>{reveal.tex}</MB>
          {reveal.extra && <p className="muted small">{reveal.extra}</p>}
          {starNow && <div className="pill good">★ Bonus solved!</div>}
          <div className="reveal-foot">
            <span className="muted small">
              📖 Strang p. {reveal.page} · <a href={`#/book/4.1/${reveal.anchor}`}>read it in the book</a>
            </span>
            {next ? (
              <a className="btn primary" href={`#/play/${next.id}`}>
                Next: {next.title} →
              </a>
            ) : (
              <a className="btn primary" href="#/">
                Pack complete. Back to puzzles
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
