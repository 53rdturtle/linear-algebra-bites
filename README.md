# Strang, Interactive

An interactive edition of Gilbert Strang, *Introduction to Linear Algebra* (5th ed., 2016).
Each section follows the book's own order (same headings, definitions, examples, figures and
problems) with short text and toys you can play with. The Puzzles tab has a separate,
game-like pack for the same material.

```
npm install
npm run dev
```

Then open the URL it prints (usually http://localhost:5173). Answers and puzzles are saved in the browser.

Online (no Ask): https://53rdturtle.github.io/linear-algebra-bites/ — every push to `main` rebuilds it
(`.github/workflows/pages.yml`, built with `VITE_NO_ASK=1`).

## Ask

On a book page, press **✦ Ask** (bottom right) to ask a question. Select text on the page, or press
**❝ Ask** on a toy, to quote it. Answers come from your own Claude Code: the dev server runs
`claude -p` headless with no tools (it can't read or change files), using your Claude Code login,
so it counts against your Claude Code usage. Answers can include live figures. Needs the
`claude` command installed and logged in. Code: `server/tutor.js`, `src/ask/`.

- Book sections: `src/book/` (`s4-1.jsx` is the page, `toys.jsx` the interactive figures, `ui.jsx` the building blocks)
- Puzzle packs: `src/puzzles/`
