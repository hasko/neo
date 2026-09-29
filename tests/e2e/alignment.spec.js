// openspec/changes/add-alignment-shortcuts
const { test, expect } = require('@playwright/test');
const neo = require('./neo');

const ALIGN = ['Format', 'Align Paragraph'];

let seed, run;
test.beforeEach(async () => {
  seed = neo.seedLibrary();
  run = await neo.launch(seed);
});
test.afterEach(async () => { await neo.close(run); });

test('Align Paragraph items carry ⌘⇧L / C / R / J', async () => {
  const menu = await neo.menuItem(run.app, ALIGN);
  expect(menu.submenu).toEqual([
    { label: 'Left', type: 'normal', accelerator: 'CmdOrCtrl+Shift+L' },
    { label: 'Center', type: 'normal', accelerator: 'CmdOrCtrl+Shift+C' },
    { label: 'Right', type: 'normal', accelerator: 'CmdOrCtrl+Shift+R' },
    { label: 'Justify', type: 'normal', accelerator: 'CmdOrCtrl+Shift+J' },
  ]);
});

test('no shortcut is taken twice, in the menu or by the editor itself', async () => {
  const all = await neo.allAccelerators(run.app);
  const seen = new Map();
  const dupes = [];
  for (const { accelerator, path } of all) {
    const key = neo.normalizeAccelerator(accelerator);
    if (seen.has(key)) dupes.push(`${accelerator}: ${seen.get(key)} / ${path}`);
    else seen.set(key, path);
  }
  expect(dupes).toEqual([]);

  // the shortcuts the design checked for conflicts are still in the menu
  for (const a of ['CmdOrCtrl+E', 'CmdOrCtrl+Shift+T', 'CmdOrCtrl+Shift+F']) {
    expect(seen.has(neo.normalizeAccelerator(a))).toBe(true);
  }
  // …and none of the menu's shortcuts shadows one the renderer handles itself
  const clashes = neo.RENDERER_SHORTCUTS.filter((a) => seen.has(neo.normalizeAccelerator(a)));
  expect(clashes).toEqual([]);
});

test('⌘⇧X still drops a placeholder note', async () => {
  await neo.setCaret(run.page, 0, 4);
  await run.page.keyboard.press('ControlOrMeta+Shift+KeyX');
  await expect(run.page.locator('.chapter-body .ph-mark')).toHaveCount(1);
});

test('aligns the paragraph holding the caret, and Left clears it', async () => {
  await neo.setCaret(run.page, 1, 3);
  await neo.clickMenu(run.app, [...ALIGN, 'Center']);
  await expect.poll(() => neo.paragraphAligns(run.page)).toEqual(['', 'center', '', '', '']);

  await neo.clickMenu(run.app, [...ALIGN, 'Left']);
  await expect.poll(() => neo.paragraphAligns(run.page)).toEqual(['', '', '', '', '']);
  // left is the default: no leftover empty style attribute
  expect(await run.page.evaluate(() => document.querySelectorAll('.chapter-body > p')[1].hasAttribute('style'))).toBe(false);
});

test('a multi-paragraph selection aligns every paragraph but leaves the scene break', async () => {
  await neo.selectParagraphs(run.page, 1, 3);
  await neo.clickMenu(run.app, [...ALIGN, 'Justify']);
  await expect.poll(() => neo.paragraphAligns(run.page)).toEqual(['', 'justify', '', 'justify', '']);
});

test('alignment is saved to the chapter file and survives a restart', async () => {
  await neo.setCaret(run.page, 0, 0);
  await neo.clickMenu(run.app, [...ALIGN, 'Right']);
  await neo.waitForChapterFile(seed, (html) => /text-align:\s*right/.test(html));

  await neo.close(run);
  run = await neo.launch(seed);
  expect(await neo.paragraphAligns(run.page)).toEqual(['right', '', '', '', '']);
});

test('Help → Shortcuts lists the alignment keys, and every key fits its row', async () => {
  await run.page.evaluate(() => showHelp());
  const rows = await run.page.evaluate(() =>
    Object.fromEntries([...document.querySelectorAll('#keyboard-shortcuts .shortcut-row')]
      .map((r) => [r.querySelector('dt').textContent, r.querySelector('dd').textContent])));
  expect(rows).toMatchObject({
    'Align paragraph left': '⌘⇧L',
    'Center paragraph': '⌘⇧C',
    'Align paragraph right': '⌘⇧R',
    'Justify paragraph': '⌘⇧J',
  });
  const overflowing = await run.page.evaluate(() =>
    [...document.querySelectorAll('#keyboard-shortcuts kbd')]
      .filter((k) => k.scrollWidth > k.clientWidth + 1)
      .map((k) => k.textContent));
  expect(overflowing).toEqual([]);
});
