## Why

NEO can already align paragraphs (Format → Align Paragraph → Left / Center / Right / Justify), but only through the menu. Reaching for the mouse breaks the writing flow NEO is built around, and every other word processor writers come from (Pages, Word) offers keyboard shortcuts for alignment.

## What Changes

- Add keyboard accelerators to the four existing Format → Align Paragraph menu items:
  - Left: ⌘⇧L (Ctrl+Shift+L)
  - Center: ⌘⇧C (Ctrl+Shift+C)
  - Right: ⌘⇧R (Ctrl+Shift+R)
  - Justify: ⌘⇧J (Ctrl+Shift+J)
- Show the shortcuts in the menu (automatic via Electron accelerators) and in the Help → Shortcuts overview.
- No change to how alignment is applied, stored or exported.

## Capabilities

### New Capabilities
- `paragraph-alignment`: Aligning manuscript paragraphs via the Format menu and keyboard shortcuts, including persistence and export behaviour.

### Modified Capabilities
<!-- none: no existing specs in openspec/specs/ -->

## Impact

- `main.js`: `accelerator` entries on the Align Paragraph submenu items.
- `app.js`: one row per shortcut in `showHelp()`.
- No new dependencies, no data-format change. Existing documents are unaffected.
- Conflicts checked: ⌘E (email), ⌘⇧X/D/T/F/I and the other existing accelerators stay untouched. Word-style ⌘L/E/R/J was rejected because ⌘E is already "email PDF snapshot"; Pages-style ⌘{ ⌘| ⌘} was rejected because those characters need ⌥ on German and other non-US layouts.
