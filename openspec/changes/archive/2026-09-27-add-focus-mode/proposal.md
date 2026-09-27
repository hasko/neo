## Why

Writers coming from iA Writer rely on its Focus Mode: everything except the sentence or paragraph being written fades back, so attention stays on the current words instead of re-reading and editing what came before. NEO is built around distraction-free drafting and already has Typewriter Scrolling; a focus mode is the natural companion and is one of the most requested features of dedicated writing apps.

## What Changes

- New **Focus Mode** with three levels plus off:
  - **Sentence**: only the sentence containing the caret is shown at full ink
  - **Paragraph**: only the current paragraph
  - **Scene**: all paragraphs between the surrounding `***` scene breaks (or chapter boundaries)
- Everything else in the manuscript (prose and chapter headings) is dimmed.
- New menu **Format → Focus Mode** with *Cycle* (⌘⇧O / Ctrl+Shift+O), *Sentence*, *Paragraph*, *Scene*, *Off*.
- ⌘⇧O cycles off → scene → paragraph → sentence → off.
- The chosen level is remembered across restarts (like Typewriter Scrolling).
- Works in light and night page modes and combines with Typewriter Scrolling.
- Purely visual: the manuscript text and saved HTML are never modified.

## Capabilities

### New Capabilities
- `focus-mode`: Dimming the manuscript except the sentence, paragraph or scene holding the caret; controls, persistence and interaction with other editor features.

### Modified Capabilities
<!-- none: no existing specs in openspec/specs/ -->

## Impact

- `app.js`: new focus-mode module (state, selection tracking, highlight computation), menu message handling, startup restore, Help entry.
- `main.js`: new Format → Focus Mode submenu.
- `styles.css`: dimmed manuscript colour, `::highlight(neo-focus)` colours for light and night, drop-cap rule.
- `library.json`: one new optional key `focus`; absent means off. No migration needed.
- No new dependencies. Relies on the CSS Custom Highlight API and `Intl.Segmenter`, both available in NEO's Electron/Chromium.
