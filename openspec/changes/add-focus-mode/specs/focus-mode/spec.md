## ADDED Requirements

### Requirement: Focus levels
The system SHALL offer a focus mode with the levels sentence, paragraph and scene, and an off state. While focus mode is on, all manuscript prose and chapter headings SHALL be dimmed except the focused range, which SHALL be shown at the normal ink colour.

#### Scenario: Sentence focus
- **WHEN** focus level is sentence and the caret is inside the second sentence of a paragraph
- **THEN** only that sentence is shown at full ink and the rest of the manuscript, including the other sentences of the same paragraph, is dimmed

#### Scenario: Paragraph focus
- **WHEN** focus level is paragraph and the caret is in a paragraph
- **THEN** the entire paragraph is shown at full ink and all other paragraphs are dimmed

#### Scenario: Scene focus
- **WHEN** focus level is scene and the caret is in a paragraph between two `***` scene breaks
- **THEN** all paragraphs between those scene breaks are shown at full ink and paragraphs beyond them are dimmed

#### Scenario: Scene bounded by chapter
- **WHEN** focus level is scene and the current chapter has no scene break before the caret
- **THEN** the focused scene starts at the first paragraph of the chapter and never extends into another chapter

#### Scenario: Focus off
- **WHEN** focus mode is off
- **THEN** the manuscript is rendered exactly as without this feature

### Requirement: Focus follows the caret
The focused range SHALL be recomputed whenever the caret moves or the text changes in the manuscript.

#### Scenario: Typing into the next sentence
- **WHEN** focus level is sentence and the user finishes a sentence with ". " and keeps typing
- **THEN** the focus moves to the new sentence as soon as its first character is typed

#### Scenario: Caret at the end of a sentence
- **WHEN** the caret sits directly after a sentence's final punctuation mark
- **THEN** that sentence stays focused

#### Scenario: Caret leaves the manuscript
- **WHEN** the user clicks into the title page or a side panel
- **THEN** the last focused range stays highlighted

#### Scenario: Caret on a scene break
- **WHEN** the caret is on a `***` scene break line
- **THEN** no prose is highlighted and the whole manuscript is dimmed

### Requirement: Language-aware sentence detection
Sentence boundaries SHALL be determined with locale-aware sentence segmentation using the spellcheck language, so that ellipses, question and exclamation marks and quotation marks do not produce wrong boundaries.

#### Scenario: German quotation
- **WHEN** the paragraph is `„Wir müssen reden“, sagte sie. Dann ging sie.` and the caret is in "sagte"
- **THEN** the focused sentence is `„Wir müssen reden“, sagte sie.`

#### Scenario: Exclamation mark
- **WHEN** the paragraph is `Heute fehlte einer! Das war noch nie passiert.` and the caret is in "fehlte"
- **THEN** the focused sentence is `Heute fehlte einer!`

### Requirement: Controls
The system SHALL provide a Format → Focus Mode menu with items Cycle, Sentence, Paragraph, Scene and Off. The shortcut CmdOrCtrl+Shift+O (menu item Cycle) SHALL step through the levels in the order off → scene → paragraph → sentence → off. Every change SHALL be confirmed with a short toast naming the new state, and the shortcut SHALL be listed in the Help overview.

#### Scenario: Choose a level from the menu
- **WHEN** the user selects Format → Focus Mode → Paragraph
- **THEN** paragraph focus is active and a toast "Focus: paragraph" appears

#### Scenario: Cycle from off
- **WHEN** focus mode is off and the user presses ⌘⇧O
- **THEN** scene focus is active and a toast "Focus: scene" appears

#### Scenario: Cycle through all levels
- **WHEN** scene focus is active and the user presses ⌘⇧O three times
- **THEN** focus goes to paragraph, then sentence, then off

#### Scenario: Cycle continues from a menu choice
- **WHEN** the user selected Format → Focus Mode → Paragraph and then presses ⌘⇧O
- **THEN** sentence focus is active

### Requirement: Persistence
The current focus level SHALL be stored in the library settings and restored on the next start.

#### Scenario: Restart
- **WHEN** the user quits NEO with paragraph focus active and starts it again
- **THEN** paragraph focus is active after opening a book

#### Scenario: Older library file
- **WHEN** the library settings contain no focus keys
- **THEN** focus mode starts off

### Requirement: Manuscript content is never modified
Focus mode SHALL be purely visual. It MUST NOT insert, remove or alter elements, attributes or text inside chapter bodies, and MUST NOT affect saved chapter files, undo history or exports.

#### Scenario: Saved HTML unchanged
- **WHEN** the user writes with sentence focus active and the chapter is saved
- **THEN** the saved chapter HTML is identical to what it would be with focus mode off

#### Scenario: Export unaffected
- **WHEN** the user exports to DOCX, EPUB or PDF with focus mode active
- **THEN** the exported text has normal, undimmed formatting

### Requirement: Theme and feature compatibility
Focus mode SHALL work in the light and night page modes, keep the drop cap consistent with its paragraph's focus state, and combine with Typewriter Scrolling, search and spellcheck highlights.

#### Scenario: Night mode
- **WHEN** night mode and focus mode are both on
- **THEN** the focused range uses the night ink colour and the rest is dimmed towards the night paper colour

#### Scenario: Drop cap follows its paragraph
- **WHEN** scene focus is active and the focused scene includes the chapter's first paragraph
- **THEN** the drop cap is shown at full ink; otherwise it is dimmed

#### Scenario: With typewriter scrolling
- **WHEN** typewriter scrolling and sentence focus are both on
- **THEN** the current line stays vertically centred and the current sentence is highlighted
