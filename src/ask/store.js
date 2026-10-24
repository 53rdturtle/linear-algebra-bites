// State of the Ask panel: open/closed, pending quotes, and one saved
// conversation per book section (kept in localStorage).
import { useEffect, useState } from 'react'

const KEY = 'strang-ask-v1'

function loadChats() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

let state = { open: false, quotes: [], chats: loadChats(), busy: false }
const listeners = new Set()

function set(patch) {
  state = { ...state, ...patch }
  if (patch.chats) localStorage.setItem(KEY, JSON.stringify(state.chats))
  listeners.forEach((l) => l(state))
}

export function useAsk() {
  const [s, setS] = useState(state)
  useEffect(() => {
    listeners.add(setS)
    return () => listeners.delete(setS)
  }, [])
  return s
}

export const openAsk = () => set({ open: true })
export const closeAsk = () => set({ open: false })

export function addQuote(q) {
  if (state.quotes.some((x) => x.text === q.text)) return set({ open: true })
  set({ quotes: [...state.quotes, q], open: true })
}
export const removeQuote = (i) => set({ quotes: state.quotes.filter((_, j) => j !== i) })

const chatOf = (section) => state.chats[section] || { sessionId: null, messages: [] }

function updateChat(section, fn) {
  set({ chats: { ...state.chats, [section]: fn(chatOf(section)) } })
}

export const clearChat = (section) => updateChat(section, () => ({ sessionId: null, messages: [] }))

let controller = null

export async function ask(section, question, context) {
  if (state.busy) return
  const quotes = state.quotes
  updateChat(section, (c) => ({
    ...c,
    messages: [...c.messages, { role: 'user', text: question, quotes }, { role: 'assistant', text: '', pending: true }],
  }))
  set({ quotes: [], busy: true })

  const patchLast = (fn) =>
    updateChat(section, (c) => {
      const msgs = c.messages.slice()
      msgs[msgs.length - 1] = fn(msgs[msgs.length - 1])
      return { ...c, messages: msgs }
    })

  controller = new AbortController()
  try {
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, quotes, context, sessionId: chatOf(section).sessionId }),
      signal: controller.signal,
    })
    if (!res.ok || !res.body) throw new Error(`The local Ask server answered ${res.status}. Is the app running with "npm run dev"?`)
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      let nl
      while ((nl = buf.indexOf('\n')) >= 0) {
        const ev = JSON.parse(buf.slice(0, nl))
        buf = buf.slice(nl + 1)
        if (ev.t === 'delta') patchLast((m) => ({ ...m, text: m.text + ev.text }))
        else if (ev.t === 'error') patchLast((m) => ({ ...m, error: ev.text }))
        else if (ev.t === 'done' && ev.sessionId) updateChat(section, (c) => ({ ...c, sessionId: ev.sessionId }))
      }
    }
  } catch (e) {
    if (e.name !== 'AbortError') patchLast((m) => ({ ...m, error: e.message }))
  } finally {
    patchLast((m) => ({ ...m, pending: false }))
    controller = null
    set({ busy: false })
  }
}

export const stopAsk = () => controller?.abort()
