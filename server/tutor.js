// Local "Ask" endpoint: answers questions by running Claude Code headless
// (`claude -p`) with the user's own Claude Code login. No tools, no settings,
// no MCP servers: it can only write text back.
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Sessions are stored by Claude Code under this working directory, away from the project.
const WORKDIR = join(tmpdir(), 'strang-interactive-tutor')

const SYSTEM_PROMPT = `You are a friendly linear algebra tutor inside an interactive edition of
Gilbert Strang's "Introduction to Linear Algebra" (5th edition, 2016). The student is reading the
section named in each message and may quote text or the current state of an interactive toy.

Style:
- Answer the actual question first, briefly. Usually 1–3 short paragraphs. No headings.
- Stay close to Strang's notation and ideas (column picture, four subspaces, C(A), N(A), C(Aᵀ), N(Aᵀ)).
- Write math in LaTeX: $...$ inline, $$...$$ on its own line. Use small integer examples.
- If the student seems confused, use one concrete example rather than more theory.

Interactive figures: when a picture would genuinely help, add at most one or two figures by writing
a fenced code block with the language "toy" containing one JSON object. Available figures:

1. 2D plane:  {"type":"plane2d","vectors":[{"v":[3,1],"label":"v","drag":true}],"lines":[{"d":[1,2],"label":"row space"}],"range":5}
   vectors: arrows from the origin; "drag": true lets the student move it. lines: lines through 0 with direction d.
2. 3D scene:  {"type":"space3d","planes":[{"u":[1,0,0],"w":[0,1,0],"label":"V"}],"lines":[{"d":[0,0,1],"label":"W"}],"vectors":[{"v":[1,1,1],"label":"x"}]}
   planes are spanned by u and w. The student can rotate it.
3. Four subspaces of a matrix (live Figure 4.2, editable): {"type":"bigpicture","A":[[1,2],[3,6]]}
4. Rows times x (student searches for nullspace vectors with steppers): {"type":"rows","A":[[1,3,4],[5,2,7]]}

Optional "caption" field on any figure: one short sentence telling the student what to try.
Use only integers or simple decimals. Never invent other figure types.`

function buildPrompt({ question, quotes = [], context = {} }) {
  const lines = []
  if (context.section) lines.push(`[Reading: Section ${context.section}${context.part ? `, part "${context.part}"` : ''}]`)
  if (context.partText) lines.push(`[Text of that part on screen]\n${context.partText.slice(0, 2500)}`)
  quotes.forEach((q, i) => lines.push(`[Quote ${i + 1}${q.kind === 'toy' ? ' (interactive toy, current state)' : ''}]\n${q.text}`))
  lines.push(`Question: ${question}`)
  return lines.join('\n\n')
}

function handle(req, res) {
  let body = ''
  req.on('data', (c) => (body += c))
  req.on('end', () => {
    let data
    try {
      data = JSON.parse(body)
    } catch {
      res.statusCode = 400
      return res.end('bad json')
    }
    if (!data.question || typeof data.question !== 'string') {
      res.statusCode = 400
      return res.end('missing question')
    }
    mkdirSync(WORKDIR, { recursive: true })
    const args = [
      '-p',
      '--output-format', 'stream-json',
      '--verbose',
      '--include-partial-messages',
      '--tools', '',
      '--setting-sources', '',
      '--strict-mcp-config',
      '--system-prompt', SYSTEM_PROMPT,
    ]
    if (data.sessionId && /^[0-9a-f-]{36}$/.test(data.sessionId)) args.push('--resume', data.sessionId)

    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache')
    const send = (obj) => res.write(JSON.stringify(obj) + '\n')

    const child = spawn('claude', args, { cwd: WORKDIR, windowsHide: true })
    child.stdin.end(buildPrompt(data))

    // Decode as UTF-8 across chunk boundaries so characters like · or ᵀ aren't split.
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    let buf = ''
    let errText = ''
    let sessionId = null
    child.stdout.on('data', (chunk) => {
      buf += chunk
      let nl
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl)
        buf = buf.slice(nl + 1)
        let ev
        try {
          ev = JSON.parse(line)
        } catch {
          continue
        }
        if (ev.session_id) sessionId = ev.session_id
        if (ev.type === 'stream_event' && ev.event?.type === 'content_block_delta' && ev.event.delta?.type === 'text_delta') {
          send({ t: 'delta', text: ev.event.delta.text })
        } else if (ev.type === 'result' && ev.is_error) {
          send({ t: 'error', text: ev.result || 'Claude Code reported an error.' })
        }
      }
    })
    child.stderr.on('data', (c) => (errText += c))
    child.on('error', (e) => {
      send({ t: 'error', text: `Could not start Claude Code (${e.message}). Is the "claude" command installed and logged in?` })
      res.end()
    })
    child.on('close', (code) => {
      if (code !== 0 && errText) send({ t: 'error', text: errText.trim().slice(0, 500) })
      send({ t: 'done', sessionId })
      res.end()
    })
    // Stop the run if the student closes the panel or reloads.
    res.on('close', () => {
      if (child.exitCode === null) child.kill()
    })
  })
}

export default function tutor() {
  // Block body on purpose: a returned value would be taken as a post-middleware hook.
  const mount = (server) => {
    server.middlewares.use('/api/ask', (req, res, next) => (req.method === 'POST' ? handle(req, res) : next()))
  }
  return { name: 'claude-code-tutor', configureServer: mount, configurePreviewServer: mount }
}
