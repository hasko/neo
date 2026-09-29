# shortcut-help Specification

## Purpose
Keep the shortcut help truthful on every keyboard layout. On macOS 12+, the system moves menu shortcuts whose character needs Shift on the current layout (⌘; becomes ⌘Ü on German, ⌘) on French, ⌘Ł on Polish) and shows the moved key only in the menu bar. There is no public API to ask for the moved key, and the moves follow no predictable rule, so the help never guesses: for the affected shortcuts it points to the menu bar, which is always right.

## Requirements
### Requirement: Punctuation shortcuts point to the menu bar on macOS
On macOS, the help overlay SHALL show the US key for the spellcheck pass (⌘;) together with a note that the Edit menu shows the key for non-US keyboards. The help SHALL NOT name a layout-specific key (such as ⌘Ü) for it. Other platforms SHALL keep the plain key label, because their menus show the accelerator unchanged.

#### Scenario: Spellcheck row on macOS
- **WHEN** the user opens Help → NEO Shortcuts on macOS
- **THEN** the spellcheck row shows ⌘; and the note "not on a US keyboard? The Edit menu shows your key"

#### Scenario: The note's target exists
- **WHEN** the help refers to the Edit menu for the spellcheck key
- **THEN** the Edit menu contains "Spellcheck Pass" with the accelerator CmdOrCtrl+;

### Requirement: The first-run hint names the Help menu
On macOS, the one-time hint that points to the shortcut help SHALL name the Help → NEO Shortcuts menu item alongside ⌘/, because ⌘/ moves on many layouts (⌘ß on German, ⌘: on French).

#### Scenario: First-run hint
- **WHEN** a library opens a book for the first time and shows the Enter hint on macOS
- **THEN** the hint reads "⌘/ (or Help → NEO Shortcuts) shows everything else"
- **AND** the Help menu contains "NEO Shortcuts" with the accelerator CmdOrCtrl+/
