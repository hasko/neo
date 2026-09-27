## 1. State and persistence

- [x] 1.1 Add focus state (`focusLevel`, `FOCUS_LEVELS` in cycle order) and `setFocus` / `cycleFocus` / `applyFocus` to `app.js`, writing `library.focus`
- [x] 1.2 Restore focus state on startup next to the typewriter restore in the `loadLibrary().then(...)` block, defaulting to off
- [x] 1.3 Show a toast on every focus change

## 2. Focus range computation

- [x] 2.1 Helper to find the caret's paragraph (direct `<p>` child of `.chapter-body`)
- [x] 2.2 Helpers for caret character offset and offsets → DOM `Range` across text nodes
- [x] 2.3 Sentence range via `Intl.Segmenter` (locale from `library.spellLanguage`), trimming trailing whitespace, caret-at-end belongs to the sentence
- [x] 2.4 Paragraph range (`selectNodeContents`)
- [x] 2.5 Scene range: walk siblings to the nearest `p.scene-break` or chapter edge
- [x] 2.6 `updateFocus()`: set/delete the `neo-focus` highlight; no highlight on scene-break lines; keep last highlight when caret is outside the manuscript
- [x] 2.7 Toggle `focus-cap` on the chapter body when the range covers the first character of the chapter's first paragraph
- [x] 2.8 Call `updateFocus` on `selectionchange` and `input` via `requestAnimationFrame` with try/catch

## 3. Styling

- [x] 3.1 `body.focus-mode .chapter-body, .chapter-head` dimmed with `color-mix` of ink and paper; short colour transition
- [x] 3.2 `::highlight(neo-focus)` colours for light and `body.night`
- [x] 3.3 Drop-cap rule for `.focus-cap`, mirroring the existing `::first-letter` selector exactly

## 4. Menu and help

- [x] 4.1 Add Format → Focus Mode submenu in `main.js` (Cycle with `CmdOrCtrl+Shift+O`, Sentence, Paragraph, Scene, Off)
- [x] 4.2 Handle `focus` and `focusCycle` menu messages in `app.js`
- [x] 4.3 Add ⌘⇧O to the "Modes" section of `showHelp()`

## 5. Verification

- [x] 5.1 `node --check app.js main.js`
- [ ] 5.2 Manual test of all spec scenarios in light and night mode, including German sentences with „…“ and `!`
- [ ] 5.3 Confirm saved chapter HTML contains no focus artefacts (diff a chapter file written with focus on vs. off)
- [ ] 5.4 Confirm exports (DOCX, EPUB, PDF) are unaffected
- [ ] 5.5 Check combination with typewriter scrolling, search and spellcheck
