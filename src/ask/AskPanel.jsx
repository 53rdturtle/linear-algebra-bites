import { useEffect, useRef, useState } from 'react'
import Answer from './Answer.jsx'
import { addQuote, ask, clearChat, closeAsk, openAsk, removeQuote, stopAsk, useAsk } from './store.js'

// Selected text, with rendered formulas turned back into their LaTeX source.
function selectionText(range) {
  const div = document.createElement('div')
  div.appendChild(range.cloneContents())
  div.querySelectorAll('.katex').forEach((k) => {
    const tex = k.querySelector('annotation[encoding="application/x-tex"]')?.textContent
    if (tex) k.replaceWith(`$${tex}$`)
  })
  div.querySelectorAll('.katex-mathml').forEach((m) => m.remove())
  return div.textContent.replace(/\s+/g, ' ').trim()
}

// Floating "Ask about this" bubble for selected text inside the book page.
export function SelectionQuote() {
  const [sel, setSel] = useState(null)
  useEffect(() => {
    const onUp = (e) => {
      if (e.target.closest?.('.ask-panel, .quote-bubble')) return
      setTimeout(() => {
        const s = window.getSelection()
        const node = s?.anchorNode?.parentElement
        if (!s || s.isCollapsed || !node?.closest('.book-section')) return setSel(null)
        const range = s.getRangeAt(0)
        const text = selectionText(range)
        if (text.length < 2) return setSel(null)
        const part = node.closest('.part')
        const r = range.getBoundingClientRect()
        setSel({
          text: text.slice(0, 1500),
          partId: part?.id,
          partTitle: part?.querySelector('h2')?.textContent,
          x: r.left + r.width / 2,
          y: r.top,
        })
      }, 0)
    }
    const onScroll = () => setSel(null)
    document.addEventListener('mouseup', onUp)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      document.removeEventListener('mouseup', onUp)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])
  if (!sel) return null
  return (
    <button
      className="quote-bubble"
      style={{ left: sel.x, top: sel.y }}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => {
        addQuote({ kind: 'text', text: sel.text, partId: sel.partId, partTitle: sel.partTitle })
        window.getSelection()?.removeAllRanges()
        setSel(null)
      }}
    >
      ❝ Ask about this
    </button>
  )
}

export default function AskPanel({ section, partTitle, partId }) {
  const s = useAsk()
  const chat = s.chats[section] || { messages: [] }
  const [text, setText] = useState('')
  const listRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [chat.messages])
  useEffect(() => {
    if (s.open) inputRef.current?.focus()
  }, [s.open, s.quotes.length])

  const send = () => {
    const q = text.trim()
    if (!q || s.busy) return
    // Quotes say which part the question is about; otherwise use the part on screen.
    const quoted = s.quotes.find((x) => x.partId)
    const id = quoted?.partId || partId
    const partText = document.getElementById(id)?.innerText || ''
    ask(section, q, { section, part: quoted?.partTitle || partTitle, partText })
    setText('')
  }

  if (!s.open)
    return (
      <button className="ask-fab" onClick={openAsk}>
        ✦ Ask
      </button>
    )

  return (
    <aside className="ask-panel">
      <div className="ask-head">
        <div>
          <div className="ask-title">Ask about {section}</div>
          <div className="small muted">reading: {partTitle}</div>
        </div>
        <div className="ask-head-actions">
          {chat.messages.length > 0 && (
            <button className="linklike" disabled={s.busy} onClick={() => clearChat(section)}>
              New chat
            </button>
          )}
          <button className="ask-close" onClick={closeAsk} aria-label="Close">
            ×
          </button>
        </div>
      </div>

      <div className="ask-list" ref={listRef}>
        {chat.messages.length === 0 && (
          <div className="ask-empty small muted">
            Ask anything about this section. Tip: select text on the page, or press <b>❝ Ask</b> on a toy, to quote it.
            Answers come from your Claude Code and may include figures you can play with.
          </div>
        )}
        {chat.messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="msg user">
              {m.quotes?.map((q, j) => (
                <blockquote key={j} className={`quote ${q.kind}`}>
                  {q.text}
                </blockquote>
              ))}
              <div>{m.text}</div>
            </div>
          ) : (
            <div key={i} className="msg assistant">
              {m.text ? <Answer text={m.text} /> : m.pending && <div className="thinking">Thinking…</div>}
              {m.error && <div className="feedback bad small">{m.error}</div>}
            </div>
          ),
        )}
      </div>

      <div className="ask-input">
        {s.quotes.length > 0 && (
          <div className="quote-chips">
            {s.quotes.map((q, i) => (
              <span key={i} className="quote-chip" title={q.text}>
                ❝ {q.text.length > 60 ? q.text.slice(0, 60) + '…' : q.text}
                <button onClick={() => removeQuote(i)} aria-label="Remove quote">
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <textarea
          ref={inputRef}
          rows={3}
          value={text}
          placeholder="Your question…  (Enter to send, Shift+Enter for a new line)"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
        />
        <div className="ask-send-row">
          {s.busy ? (
            <button className="btn ghost small-btn" onClick={stopAsk}>
              Stop
            </button>
          ) : (
            <button className="btn primary small-btn" disabled={!text.trim()} onClick={send}>
              Send
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
