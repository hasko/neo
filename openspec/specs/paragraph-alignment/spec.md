# paragraph-alignment Specification

## Purpose
Let writers align manuscript paragraphs (left, center, right, justify) from the Format menu and from the keyboard, without reaching for the mouse, and keep those shortcuts discoverable and free of conflicts with the rest of NEO.

## Requirements
### Requirement: Keyboard shortcuts for paragraph alignment
The system SHALL provide keyboard shortcuts for the four paragraph alignments: CmdOrCtrl+Shift+L for left, CmdOrCtrl+Shift+C for center, CmdOrCtrl+Shift+R for right and CmdOrCtrl+Shift+J for justify. Each shortcut SHALL have exactly the same effect as choosing the corresponding item under Format → Align Paragraph.

#### Scenario: Center the current paragraph
- **WHEN** the caret is inside a manuscript paragraph and the user presses ⌘⇧C
- **THEN** that paragraph is rendered centered and the chapter is marked for saving

#### Scenario: Align a multi-paragraph selection
- **WHEN** a selection spans three paragraphs and the user presses ⌘⇧R
- **THEN** all three paragraphs are right-aligned

#### Scenario: Scene breaks are not affected
- **WHEN** a selection includes a `***` scene break and the user presses ⌘⇧J
- **THEN** the prose paragraphs are justified and the scene break keeps its own centered style

#### Scenario: Back to default
- **WHEN** the caret is in a centered paragraph and the user presses ⌘⇧L
- **THEN** the paragraph's explicit alignment is removed and it renders with the default left alignment

#### Scenario: Caret outside the manuscript
- **WHEN** the Notes, Outline or Darlings tab is active, or the caret is not in a chapter body, and the user presses an alignment shortcut
- **THEN** no text changes and NEO shows the hint "Click into a paragraph first"

### Requirement: Shortcuts are discoverable
The alignment shortcuts SHALL be displayed next to their items in the Format → Align Paragraph menu and listed in the Help → Shortcuts overview.

#### Scenario: Menu shows shortcuts
- **WHEN** the user opens Format → Align Paragraph
- **THEN** each of Left, Center, Right and Justify shows its key combination

#### Scenario: Help lists shortcuts
- **WHEN** the user opens the shortcuts overview (⌘/)
- **THEN** the alignment shortcuts are listed in one row: the platform-appropriate modifier (⌘⇧ on macOS, Ctrl+Shift elsewhere) in the key column, and the letters L, C, R, J with their alignments in the description, so the key fits the overview's fixed-width key column

### Requirement: Shortcuts do not collide with existing shortcuts
The alignment shortcuts SHALL NOT replace or shadow any existing NEO shortcut.

#### Scenario: Existing shortcuts keep working
- **WHEN** the user presses ⌘E, ⌘⇧X, ⌘⇧D, ⌘⇧T or ⌘⇧F
- **THEN** email snapshot, placeholder, darling, typewriter and fullscreen behave as before

