// Renders a tutor answer: Markdown text, LaTeX math, and ```toy blocks as live figures.
import { useState } from 'react'
import katex from 'katex'
import { marked } from 'marked'
import Plane2D from '../components/Plane2D.jsx'
import Space3D from '../components/Space3D.jsx'
import { BigPictureToy, RowsTimesX } from '../book/toys.jsx'

// Show raw HTML in answers as text instead of rendering it.
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
marked.use({ renderer: { html: ({ text }) => escapeHtml(text) } })

const PALETTE = ['#2563eb', '#ea580c', '#16a34a', '#9333ea', '#0f172a', '#dc2626']

function renderMarkdown(text) {
  const math = []
  const stash = (tex, display) => {
    math.push(katex.renderToString(tex, { displayMode: display, throwOnError: false }))
    return `@@MATH${math.length - 1}@@`
  }
  const src = text
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, t) => stash(t, true))
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, t) => stash(t, true))
    .replace(/\\\((.+?)\\\)/g, (_, t) => stash(t, false))
    .replace(/\$([^$\n]+?)\$/g, (_, t) => stash(t, false))
  const html = marked.parse(src, { breaks: false })
  return html.replace(/@@MATH(\d+)@@/g, (_, i) => math[Number(i)])
}

// Split into text and toy segments. An unfinished toy block (still streaming) is held back.
function segments(text) {
  const out = []
  const re = /```toy\s*\n([\s\S]*?)```/g
  let last = 0
  let m
  while ((m = re.exec(text))) {
    out.push({ kind: 'text', text: text.slice(last, m.index) })
    out.push({ kind: 'toy', json: m[1] })
    last = re.lastIndex
  }
  const rest = text.slice(last)
  const open = rest.indexOf('```toy')
  if (open >= 0) {
    out.push({ kind: 'text', text: rest.slice(0, open) })
    out.push({ kind: 'drawing' })
  } else out.push({ kind: 'text', text: rest })
  return out
}

const isNum = (x) => typeof x === 'number' && Number.isFinite(x) && Math.abs(x) <= 100
const isVec = (v, n) => Array.isArray(v) && v.length === n && v.every(isNum)
const isMatrix = (A) =>
  Array.isArray(A) && A.length >= 1 && A.length <= 4 && A.every((r) => Array.isArray(r) && r.length === A[0].length && r.length <= 4 && r.every(isNum))

function ChatPlane({ spec }) {
  const [vecs, setVecs] = useState(() => (spec.vectors || []).filter((x) => isVec(x.v, 2)).map((x) => x.v))
  const range = isNum(spec.range) && spec.range >= 2 && spec.range <= 20 ? Math.round(spec.range) : 5
  const defs = (spec.vectors || []).filter((x) => isVec(x.v, 2))
  return (
    <Plane2D
      size={300}
      range={range}
      lines={(spec.lines || [])
        .filter((l) => isVec(l.d, 2))
        .map((l, i) => ({ d: l.d, label: String(l.label || ''), color: PALETTE[(i + 2) % PALETTE.length] }))}
      vectors={defs.map((x, i) => ({
        id: String(i),
        v: vecs[i],
        label: String(x.label || ''),
        color: PALETTE[i % PALETTE.length],
        drag: !!x.drag,
      }))}
      onDrag={(id, p) => setVecs((vs) => vs.map((v, i) => (String(i) === id ? p : v)))}
    />
  )
}

function ChatToy({ json }) {
  let spec
  try {
    spec = JSON.parse(json)
  } catch {
    return <div className="chat-toy-bad">(couldn't draw this figure)</div>
  }
  let body = null
  if (spec.type === 'plane2d') body = <ChatPlane spec={spec} />
  else if (spec.type === 'space3d')
    body = (
      <Space3D
        size={300}
        planes={(spec.planes || []).filter((p) => isVec(p.u, 3) && isVec(p.w, 3)).map((p, i) => ({ u: p.u, w: p.w, label: String(p.label || ''), color: PALETTE[i % PALETTE.length] }))}
        lines={(spec.lines || []).filter((l) => isVec(l.d, 3)).map((l, i) => ({ d: l.d, label: String(l.label || ''), color: PALETTE[(i + 1) % PALETTE.length] }))}
        vectors={(spec.vectors || []).filter((v) => isVec(v.v, 3)).map((v, i) => ({ v: v.v, label: String(v.label || ''), color: PALETTE[(i + 3) % PALETTE.length] }))}
      />
    )
  else if (spec.type === 'bigpicture' && isMatrix(spec.A)) body = <BigPictureToy initial={spec.A} />
  else if (spec.type === 'rows' && isMatrix(spec.A)) body = <RowsTimesX A={spec.A} />
  if (!body) return <div className="chat-toy-bad">(couldn't draw this figure)</div>
  return (
    <figure className="chat-toy">
      {body}
      {spec.caption && <figcaption className="toy-caption">{String(spec.caption)}</figcaption>}
    </figure>
  )
}

export default function Answer({ text }) {
  return (
    <div className="answer">
      {segments(text).map((s, i) =>
        s.kind === 'text' ? (
          <div key={i} dangerouslySetInnerHTML={{ __html: renderMarkdown(s.text) }} />
        ) : s.kind === 'toy' ? (
          <ChatToy key={i} json={s.json} />
        ) : (
          <div key={i} className="chat-toy-bad">drawing a figure…</div>
        ),
      )}
    </div>
  )
}
