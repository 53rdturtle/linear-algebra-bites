// Answers and solved puzzles, kept in localStorage.

import { useEffect, useState } from 'react'

const KEY = 'la-bites-progress-v1'

const empty = () => ({
  answers: {}, // questionId -> { wrong, right } (first tries only)
  solved: {}, // puzzleId -> { star: boolean }
})

function load() {
  try {
    return { ...empty(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return empty()
  }
}

let state = load()
const listeners = new Set()

function commit(next) {
  state = next
  localStorage.setItem(KEY, JSON.stringify(state))
  listeners.forEach((l) => l(state))
}

export function useProgress() {
  const [s, setS] = useState(state)
  useEffect(() => {
    listeners.add(setS)
    return () => listeners.delete(setS)
  }, [])
  return s
}

export function recordAnswer(qid, correct) {
  const prev = state.answers[qid] || { wrong: 0, right: 0 }
  const entry = { wrong: prev.wrong + (correct ? 0 : 1), right: prev.right + (correct ? 1 : 0) }
  commit({ ...state, answers: { ...state.answers, [qid]: entry } })
}

export function solvePuzzle(id, star = false) {
  const prev = state.solved[id]
  if (prev && (prev.star || !star)) return
  commit({ ...state, solved: { ...state.solved, [id]: { star: star || !!prev?.star } } })
}
