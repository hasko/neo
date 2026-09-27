## 1. Menu accelerators

- [x] 1.1 Add `accelerator: 'CmdOrCtrl+Shift+L|C|R|J'` to the Left/Center/Right/Justify items of Format → Align Paragraph in `main.js`
- [x] 1.2 Verify no other menu item or renderer `keydown` handler uses these combinations

## 2. Help overview

- [x] 2.1 Add the four shortcuts to the "Writing" section of `showHelp()` in `app.js`, using the existing `K('⌘⇧…', 'Ctrl+Shift+…')` helper

## 3. Verification

- [x] 3.1 `node --check main.js app.js`
- [ ] 3.2 Manual test on macOS: each shortcut aligns the current paragraph and a multi-paragraph selection; scene breaks untouched
- [ ] 3.3 Manual test: alignment persists after restart and appears in DOCX and EPUB export
- [ ] 3.4 Manual test: ⌘E, ⌘⇧X, ⌘⇧D, ⌘⇧T, ⌘⇧F still work
