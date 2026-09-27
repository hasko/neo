## Context

The manuscript is a set of `contentEditable` `.chapter-body` elements containing `<p>` paragraphs; scene breaks are `<p class="scene-break">`. Chapter HTML is captured from the DOM on every edit (`syncChapter` → `captureBody`) and written to disk, so anything added to paragraph elements risks ending up in the saved manuscript. NEO already paints search results and spellcheck flags with the CSS Custom Highlight API (`neo-search`, `neo-spell`), and Typewriter Scrolling shows the pattern for a persisted editor mode (`library.typewriter`, body class, `selectionchange` listener).

## Goals / Non-Goals

**Goals:**
- iA-Writer-like focus at sentence, paragraph and scene level.
- Zero changes to the document content or saved files.
- Correct sentence boundaries for German and English prose (ellipses, `!`, `?`, quotation marks „…“ / "…").
- Fast enough to update on every keystroke and caret move.

**Non-Goals:**
- Focus in Notes, Outline or Darlings tabs.
- Configurable dim strength in the UI (a CSS value for now).
- Line-level focus or syntax highlighting (iA Writer's "Syntax Control").

## Decisions

- **CSS Custom Highlight API instead of classes/spans in the DOM.** The whole `.chapter-body` is dimmed via CSS; a `Highlight` named `neo-focus` covering the focused range repaints it at full ink via `::highlight(neo-focus) { color }`. Nothing is inserted into the editable DOM, so `captureBody` cannot save it, undo history is untouched and caret handling in `contentEditable` is not disturbed. Alternatives: wrapping the sentence in a `<span>` (would leak into saved HTML and fight the editor), toggling a class on `<p>` (leaks into saved HTML, and cannot express sentences).
- **`Intl.Segmenter` with `granularity: 'sentence'`** for sentence boundaries, locale taken from the spellcheck language. Handles abbreviations and quotes far better than a regex and is built into Chromium. The segment's trailing whitespace is trimmed so the highlight hugs the words; a caret directly after the final punctuation still counts as inside that sentence.
- **Dim by mixing ink into paper** (`color-mix(in srgb, var(--ink) 28%, var(--paper))`) rather than opacity: gives a solid colour, works for both page themes through the existing `--ink`/`--paper` variables, and does not affect the caret or selection colours.
- **Explicit highlight colours for light and night** (`#1c1c1c` / `#d6d2c6`) because custom properties inside `::highlight()` are not reliably resolved from the originating element.
- **Drop cap handled by a class on `.chapter-body`** (`focus-cap`). Highlights do not paint `::first-letter`. The class lives on the chapter body element itself, which `captureBody` does not serialise. The CSS selector mirrors the existing drop-cap selector exactly, because a broader `::first-letter` rule would make Chromium split text nodes and corrupt deletes (see existing comment in styles.css).
- **Update triggers:** `selectionchange` and `input`, each deferred to `requestAnimationFrame`, wrapped in try/catch like the typewriter handler. When the caret leaves the manuscript (title page, panels) the last highlight stays, so the page does not flash.
- **Persistence** mirrors typewriter: `library.focus` (current level), written via `window.neo.writeLibrary`.
- **Shortcut ⌘⇧O** ("fOcus") cycles off → scene → paragraph → sentence → off, widest to narrowest, so one key reaches every level without the menu. `FOCUS_LEVELS` is kept in that order and doubles as the cycle. The key is free in the current accelerator set; iA Writer's ⌘D is taken by Darlings (⌘⇧D) conventions and would be confusing.

## Risks / Trade-offs

- [Highlight API or `Intl.Segmenter` unavailable] → Feature degrades to no highlight (everything dimmed would be bad), so `updateFocus` returns early and the menu toast still shows; NEO's Electron ships both, so this is theoretical.
- [Very long scenes/paragraphs] → One `Range` per update; cost is a text walk of a single paragraph (sentence) or a sibling walk (scene). Negligible.
- [Elements with their own colour (scene break `***`, ghost outline paragraphs)] → Keep their existing colour; acceptable, they are already muted.
- [Spellcheck/search highlights overlap focus highlight] → Different highlight names; background vs. text colour, they compose.
- [Future changes to drop-cap selector] → Focus drop-cap rule must be updated in lockstep; noted in a CSS comment.
