import { useEffect, useState } from 'react'
import { Section41, section as s41 } from './book/s4-1.jsx'
import { PuzzleHome, PuzzleView, levelById } from './Puzzles.jsx'
import { useProgress } from './lib/progress.js'
import AskPanel, { SelectionQuote } from './ask/AskPanel.jsx'
import { useAsk } from './ask/store.js'

// The static GitHub Pages build has no dev server, so no Ask.
const ASK = !import.meta.env.VITE_NO_ASK

const sections = { '4.1': { ...s41, Page: Section41 } }

const contents = [
  {
    num: 4,
    title: 'Orthogonality',
    sections: [
      { num: '4.1', title: 'Orthogonality of the Four Subspaces' },
      { num: '4.2', title: 'Projections' },
      { num: '4.3', title: 'Least Squares Approximations' },
      { num: '4.4', title: 'Orthonormal Bases and Gram-Schmidt' },
    ],
  },
  { num: 5, title: 'Determinants', sections: [] },
  { num: 6, title: 'Eigenvalues and Eigenvectors', sections: [] },
  { num: 7, title: 'The Singular Value Decomposition (SVD)', sections: [] },
]

function useHash() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const on = () => setHash(window.location.hash)
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return hash
}

export default function App() {
  const hash = useHash()
  const progress = useProgress()
  const book = hash.match(/^#\/book\/([\d.]+)(?:\/(.+))?$/)
  const play = hash.match(/^#\/play\/(.+)$/)
  let page
  let tab = 'book'
  if (book && sections[book[1]]) page = <SectionView sec={sections[book[1]]} anchor={book[2]} />
  else if (play && levelById[play[1]]) {
    page = <PuzzleView key={play[1]} id={play[1]} progress={progress} />
    tab = 'puzzles'
  } else if (hash === '#/puzzles') {
    page = <PuzzleHome progress={progress} />
    tab = 'puzzles'
  } else page = <Contents />
  return (
    <div className="app">
      <header className="topbar">
        <a href="#/" className="brand">
          <span className="brand-mark">⟂</span> Strang, Interactive
        </a>
        <nav>
          <a href="#/" className={`nav-link ${tab === 'book' ? 'active' : ''}`}>Book</a>
          <a href="#/puzzles" className={`nav-link ${tab === 'puzzles' ? 'active' : ''}`}>Puzzles</a>
        </nav>
      </header>
      <main className={book ? 'wide' : ''}>{page}</main>
    </div>
  )
}

function Contents() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  return (
    <div className="contents">
      <h1>Introduction to Linear Algebra</h1>
      <p className="muted">
        Gilbert Strang, 5th edition. Section by section in the book's own order, with less text and more to play with.
      </p>
      {contents.map((ch) => (
        <section key={ch.num} className={`chapter ${ch.sections.length ? '' : 'locked'}`}>
          <h2>
            Chapter {ch.num} <span className="muted">· {ch.title}</span>
          </h2>
          {ch.sections.length === 0 && <p className="muted small">later</p>}
          {ch.sections.map((s) =>
            sections[s.num] ? (
              <a key={s.num} href={`#/book/${s.num}`} className="toc-row">
                <span className="section-num">{s.num}</span>
                <span className="section-title">{s.title}</span>
                <span className="section-meta">pp. {sections[s.num].pages}</span>
              </a>
            ) : (
              <div key={s.num} className="toc-row locked">
                <span className="section-num">{s.num}</span>
                <span className="section-title">{s.title}</span>
                <span className="section-meta">coming</span>
              </div>
            ),
          )}
        </section>
      ))}
    </div>
  )
}

function SectionView({ sec, anchor }) {
  const { Page } = sec
  const [active, setActive] = useState(sec.parts[0].id)
  const { open } = useAsk()
  const activeTitle = sec.parts.find((p) => p.id === active)?.title

  useEffect(() => {
    const el = anchor && document.getElementById(anchor)
    if (el) el.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [anchor])

  // Highlight the part currently on screen in the side contents.
  useEffect(() => {
    const els = sec.parts.map((p) => document.getElementById(p.id)).filter(Boolean)
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-20% 0px -70% 0px' },
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [sec])

  return (
    <div className={`section-layout ${open ? 'with-ask' : ''}`}>
      <nav className="side-toc">
        <a href="#/" className="small">← Contents</a>
        <div className="side-toc-title">{sec.num}</div>
        {sec.parts.map((p) => (
          <a
            key={p.id}
            href={`#/book/${sec.num}/${p.id}`}
            className={p.id === active ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault()
              document.getElementById(p.id)?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            {p.title}
          </a>
        ))}
      </nav>
      <Page />
      {ASK && <SelectionQuote />}
      {ASK && <AskPanel section={sec.num} partTitle={activeTitle} partId={active} />}
    </div>
  )
}
