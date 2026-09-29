// openspec/changes/add-focus-mode
const { test, expect } = require('@playwright/test');
const neo = require('./neo');

const FOCUS = ['View', 'Focus Mode'];

// paragraphs by index: 0-1 prose, 2 break, 3-4 the spec's German examples,
// 5 break, 6 prose
const CHAPTER = [
  '<p>The door was open. Nobody had come home! Was it the wind?</p>',
  '<p>Second paragraph here. It has two sentences.</p>',
  '<p class="scene-break">***</p>',
  '<p>„Wir müssen reden“, sagte sie. Dann ging sie.</p>',
  '<p>Heute fehlte einer! Das war noch nie passiert.</p>',
  '<p class="scene-break">***</p>',
  '<p>Third scene.</p>',
].join('');

let seed, run;
async function start(library = {}) {
  seed = neo.seedLibrary({ chapterHtml: CHAPTER, library });
  run = await neo.launch(seed);
}
test.afterEach(async () => { await neo.close(run); run = null; });

const state = () => run.page.evaluate(() => ({
  level: focusLevel,
  bodyClass: document.body.classList.contains('focus-mode'),
  toast: document.querySelector('#hint').textContent,
}));
const paraText = (i) => run.page.evaluate((i) => document.querySelectorAll('.chapter-body > p')[i].textContent, i);
async function caretIn(i, needle, after = false) {
  const off = await neo.offsetOf(run.page, i, needle);
  await neo.setCaret(run.page, i, off + (after ? needle.length : 1));
}

test.describe('controls', () => {
  test.beforeEach(() => start());

  test('View → Focus Mode has Cycle on ⌘⇧O and one item per level', async () => {
    const menu = await neo.menuItem(run.app, FOCUS);
    expect(menu.submenu).toEqual([
      { label: 'Cycle', type: 'normal', accelerator: 'CmdOrCtrl+Shift+O' },
      { label: '', type: 'separator', accelerator: null },
      { label: 'Sentence', type: 'radio', accelerator: null },
      { label: 'Paragraph', type: 'radio', accelerator: null },
      { label: 'Off', type: 'radio', accelerator: null },
    ]);
  });

  test('focus mode is a View setting, not a Format command', async () => {
    // Format changes the manuscript; focus mode only changes how it looks
    expect(await neo.menuItem(run.app, ['Format', 'Focus Mode'])).toBeNull();
    const view = await neo.menuItem(run.app, ['View']);
    expect(view.submenu.map((i) => i.label)).toContain('Focus Mode');
  });

  test('⌘⇧O cycles off → paragraph → sentence → off, with a toast each time', async () => {
    expect(await state()).toMatchObject({ level: 'off', bodyClass: false });
    const expected = [
      ['paragraph', 'Focus: paragraph'],
      ['sentence', 'Focus: sentence'],
      ['off', 'Focus mode off'],
    ];
    for (const [level, toast] of expected) {
      await neo.clickMenu(run.app, [...FOCUS, 'Cycle']);
      await expect.poll(state).toEqual({ level, bodyClass: level !== 'off', toast });
    }
  });

  test('the cycle continues from a level picked in the menu', async () => {
    await neo.clickMenu(run.app, [...FOCUS, 'Paragraph']);
    await expect.poll(state).toMatchObject({ level: 'paragraph', toast: 'Focus: paragraph' });
    await neo.clickMenu(run.app, [...FOCUS, 'Cycle']);
    await expect.poll(state).toMatchObject({ level: 'sentence' });
  });

  test('Help → Shortcuts explains the cycle', async () => {
    await run.page.evaluate(() => showHelp());
    const row = run.page.locator('#keyboard-shortcuts .shortcut-row', { hasText: 'Cycle focus mode' });
    await expect(row).toContainText('Off → paragraph → sentence → off.');
    await expect(row.locator('kbd')).toHaveText('⌘⇧O');
  });
});

test.describe('focused range', () => {
  test.beforeEach(() => start());

  test('sentence: only the sentence holding the caret', async () => {
    await neo.clickMenu(run.app, [...FOCUS, 'Sentence']);
    await caretIn(0, 'Nobody');
    expect(await neo.focusText(run.page)).toBe('Nobody had come home!');
  });

  test('sentence: a caret right after the full stop keeps that sentence', async () => {
    await neo.clickMenu(run.app, [...FOCUS, 'Sentence']);
    await caretIn(0, 'open.', true);
    expect(await neo.focusText(run.page)).toBe('The door was open.');
  });

  test('sentence: focus follows the caret', async () => {
    await neo.clickMenu(run.app, [...FOCUS, 'Sentence']);
    await caretIn(0, 'door');
    expect(await neo.focusText(run.page)).toBe('The door was open.');
    await caretIn(0, 'wind');
    expect(await neo.focusText(run.page)).toBe('Was it the wind?');
  });

  test('sentence: typing past ". " moves focus to the new sentence', async () => {
    await neo.clickMenu(run.app, [...FOCUS, 'Sentence']);
    await caretIn(1, 'sentences.', true);
    await run.page.keyboard.type(' And');
    expect(await neo.focusText(run.page)).toBe('And');
  });

  test('paragraph: the whole paragraph', async () => {
    await neo.clickMenu(run.app, [...FOCUS, 'Paragraph']);
    await caretIn(1, 'two');
    expect(await neo.focusText(run.page)).toBe(await paraText(1));
  });

  test('a caret on a *** line highlights nothing, but focus mode stays on', async () => {
    await neo.clickMenu(run.app, [...FOCUS, 'Paragraph']);
    await caretIn(1, 'two');
    expect(await neo.focusText(run.page)).not.toBe('');
    await neo.setCaret(run.page, 2, 1);
    expect(await neo.focusText(run.page)).toBe('');
    expect((await state()).bodyClass).toBe(true);
  });

  test('off: no highlight and no dimming', async () => {
    await neo.clickMenu(run.app, [...FOCUS, 'Sentence']);
    await caretIn(0, 'Nobody');
    await neo.clickMenu(run.app, [...FOCUS, 'Off']);
    await expect.poll(state).toMatchObject({ level: 'off', bodyClass: false });
    expect(await neo.focusText(run.page)).toBe('');
  });

  test('selected text stays at full ink after dragging the focus into the next paragraph', async () => {
    await neo.clickMenu(run.app, [...FOCUS, 'Paragraph']);
    // what a drag leaves behind: anchor in paragraph 1, focus moved up into 0
    await run.page.evaluate(() => {
      const ps = document.querySelectorAll('.chapter-body > p');
      ps[1].closest('.chapter-body').focus();
      getSelection().collapse(ps[1].firstChild, 10);
      getSelection().extend(ps[0].firstChild, 5);
    });
    expect(await neo.focusText(run.page)).toBe(await paraText(0));
    // paragraph 1 is dimmed now, but its selected part is painted at full ink
    const selColor = () => run.page.evaluate(() =>
      getComputedStyle(document.querySelectorAll('.chapter-body > p')[1], '::selection').color);
    expect(await selColor()).toBe('rgb(214, 210, 198)');   // night ink
    await run.page.evaluate(() => document.body.classList.remove('night'));
    expect(await selColor()).toBe('rgb(28, 28, 28)');      // day ink
  });

  test('focus mode dims the manuscript colour', async () => {
    const ink = () => run.page.evaluate(() => getComputedStyle(document.querySelector('.chapter-body')).color);
    const normal = await ink();
    await neo.clickMenu(run.app, [...FOCUS, 'Sentence']);
    // the colour has a 0.25s transition
    await expect.poll(ink).not.toBe(normal);
  });

  test('drop cap: full ink only while its paragraph is in focus', async () => {
    const hasCap = () => run.page.evaluate(() => document.querySelector('.chapter-body').classList.contains('focus-cap'));
    await neo.clickMenu(run.app, [...FOCUS, 'Paragraph']);
    await caretIn(0, 'Nobody');
    await neo.focusText(run.page);
    expect(await hasCap()).toBe(true);
    await caretIn(1, 'two');
    await neo.focusText(run.page);
    expect(await hasCap()).toBe(false);
  });
});

test.describe('German sentences (spellcheck language de)', () => {
  test.beforeEach(() => start({ spellLanguage: 'de-DE' }));

  test('a quotation followed by ", sagte sie." is one sentence', async () => {
    await neo.clickMenu(run.app, [...FOCUS, 'Sentence']);
    await caretIn(3, 'sagte');
    expect(await neo.focusText(run.page)).toBe('„Wir müssen reden“, sagte sie.');
  });

  test('an exclamation mark ends the sentence', async () => {
    await neo.clickMenu(run.app, [...FOCUS, 'Sentence']);
    await caretIn(4, 'fehlte');
    expect(await neo.focusText(run.page)).toBe('Heute fehlte einer!');
  });
});

test.describe('persistence and purity', () => {
  test('an older library without focus keys starts with focus off', async () => {
    await start();
    expect(await state()).toMatchObject({ level: 'off', bodyClass: false });
  });

  test('a stored level that is no longer offered starts with focus off', async () => {
    await start({ focus: 'scene' });
    expect(await state()).toMatchObject({ level: 'off', bodyClass: false });
  });

  test('the level is stored in library.json and restored on restart', async () => {
    await start();
    await neo.clickMenu(run.app, [...FOCUS, 'Paragraph']);
    await expect.poll(() => neo.readJSON(seed.libraryFile).focus).toBe('paragraph');
    expect(neo.readJSON(seed.libraryFile)).not.toHaveProperty('focusLastOn');

    await neo.close(run);
    run = await neo.launch(seed);
    expect(await state()).toMatchObject({ level: 'paragraph', bodyClass: true });
  });

  test('saved chapter HTML carries no trace of focus mode', async () => {
    await start();
    await neo.clickMenu(run.app, [...FOCUS, 'Paragraph']);
    await caretIn(1, 'sentences.', true);
    await run.page.keyboard.type(' Typed while dimmed.');
    // exactly the seeded chapter plus the typed words: no classes, spans or
    // attributes from the highlight, the dimming or the drop-cap class
    const expected = CHAPTER.replace('two sentences.', 'two sentences. Typed while dimmed.');
    const html = await neo.waitForChapterFile(seed, (h) => h.includes('Typed while dimmed.'));
    expect(html).toBe(expected);
    // …and the in-memory copy the exporters read is the same
    expect(await run.page.evaluate(() => chapterHTML['ch-1'])).toBe(expected);
  });
});
