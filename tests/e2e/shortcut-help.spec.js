// openspec/specs/shortcut-help
const { test, expect } = require('@playwright/test');
const neo = require('./neo');

test.skip(process.platform !== 'darwin', 'macOS moves punctuation shortcuts; other menus do not');

let seed, run;
test.beforeEach(async () => {
  seed = neo.seedLibrary();
  run = await neo.launch(seed);
});
test.afterEach(async () => { await neo.close(run); });

test('the spellcheck row points non-US keyboards to the Edit menu', async () => {
  await run.page.evaluate(() => showHelp());
  const row = await run.page.evaluate(() => {
    const k = [...document.querySelectorAll('.help-grid .hk')].find((el) => el.textContent === '⌘;');
    return k && k.nextElementSibling.textContent;
  });
  expect(row).toBe('Spellcheck pass (right-click squiggles for fixes) — not on a US keyboard? The Edit menu shows your key');
  expect(await neo.menuItem(run.app, ['Edit', 'Spellcheck Pass'])).toMatchObject({ accelerator: 'CmdOrCtrl+;' });
});

test('the first-run hint names Help → NEO Shortcuts next to ⌘/', async () => {
  await expect(run.page.locator('#hint')).toContainText('⌘/ (or Help → NEO Shortcuts) shows everything else');
  expect(await neo.menuItem(run.app, ['Help', 'NEO Shortcuts'])).toMatchObject({ accelerator: 'CmdOrCtrl+/' });
});
