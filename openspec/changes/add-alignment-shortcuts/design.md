## Context

Alignment is implemented in `applyAlign(value)` (app.js): it sets or removes `style="text-align:…"` on every `<p>` the selection touches (scene breaks excluded) and calls `syncChapter`. The menu items in `main.js` send `{ type: 'align', value }` to the renderer. The value survives save (chapter HTML), DOCX export (`w:jc`) and EPUB export (`p.center` / `p.right`). Only the keyboard entry point is missing.

## Goals / Non-Goals

**Goals:**
- One-keystroke access to all four alignments on macOS, Windows and Linux.
- Shortcuts discoverable in the menu and in the Help overview.

**Non-Goals:**
- Changing alignment semantics, storage or export.
- A toolbar or on-page alignment UI.
- Toggle behaviour (pressing Center twice does not revert to Left).

## Decisions

- **Electron menu accelerators instead of a renderer `keydown` handler.** Accelerators show up next to the menu item automatically and reuse the existing `align` IPC message, so the renderer needs no new key handling. Alternative (keydown in app.js like ⌘⇧X) would duplicate logic and not display in the menu.
- **⌘⇧ + mnemonic letter (L/C/R/J).** Free in NEO's current accelerator set, layout-independent for letters, and easy to remember. Alternatives: Word's ⌘L/E/R/J (⌘E taken by email), Pages' ⌘{ ⌘| ⌘} (awkward on non-US keyboards).

## Risks / Trade-offs

- [Accelerator fires outside the manuscript tab] → `applyAlign` already guards with "Click into a paragraph first".
- [Future feature wants one of these letters] → Documented in Help, easy to remap in one place in `main.js`.
- [Merge conflict with the open i18n PR (#26), which rewrites the same menu labels] → Change is additive per line; resolving means keeping both the `i18n.t(...)` label and the `accelerator`.
