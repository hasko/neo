// Launch NEO against a seeded, throwaway library and drive it.
//
// Isolation: --user-data-dir points Electron's userData at a temp folder whose
// settings.json names a temp library (File → Library Folder… stores the same
// key), so the writer's real ~/Documents/NEO Library is never read or written.
const { _electron: electron, expect } = require('@playwright/test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..', '..');
const BOOK_ID = 'book-e2e';
const CHAPTER_ID = 'ch-1';

// paragraphs by index: 0-1 scene one, 2 the break, 3-4 scene two
const CHAPTER_HTML = [
  '<p>The door was open. Nobody had come home! Was it the wind?</p>',
  '<p>Second paragraph here. It has two sentences.</p>',
  '<p class="scene-break">***</p>',
  '<p>„Wer ist da?“ fragte sie. Niemand antwortete! Dann ging sie hinein.</p>',
  '<p>Last paragraph of the scene.</p>',
].join('');

function seedLibrary({ chapterHtml = CHAPTER_HTML, library: libraryExtras = {} } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'neo-e2e-'));
  const userData = path.join(root, 'userData');
  const lib = path.join(root, 'library');
  const bookDir = path.join(lib, BOOK_ID);
  fs.mkdirSync(userData, { recursive: true });
  fs.mkdirSync(path.join(bookDir, 'chapters'), { recursive: true });

  fs.writeFileSync(path.join(userData, 'settings.json'), JSON.stringify({ libraryDir: lib }));
  fs.writeFileSync(path.join(lib, 'library.json'), JSON.stringify({
    authorName: 'Test Author',
    penNames: [],
    firstRunDone: true,
    pageTheme: 'night',
    spellLanguage: 'en-US',
    shelves: [{ id: 'shelf-1', name: 'Works in Progress', bookIds: [BOOK_ID] }],
    ...libraryExtras,
  }, null, 2));
  fs.writeFileSync(path.join(bookDir, 'book.json'), JSON.stringify({
    id: BOOK_ID,
    title: 'E2E Book',
    subtitle: '',
    series: '',
    author: 'Test Author',
    wordGoal: 0,
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    chapterOrder: [CHAPTER_ID],
    tabNames: { notes: 'Notes', outline: 'Outline' },
  }, null, 2));
  fs.writeFileSync(path.join(bookDir, 'chapters', CHAPTER_ID + '.html'), chapterHtml);
  for (const f of ['notes.html', 'outline.html']) fs.writeFileSync(path.join(bookDir, f), '');
  for (const f of ['darlings.json', 'stickies.json']) fs.writeFileSync(path.join(bookDir, f), '[]');

  return { root, userData, lib, libraryFile: path.join(lib, 'library.json'), chapterFile: path.join(bookDir, 'chapters', CHAPTER_ID + '.html') };
}

// Start NEO on an existing seeded root and open the test book.
async function launch(seed) {
  // windows stay hidden unless NEO_E2E_SHOW=1 (see hide-windows.js)
  const hide = process.env.NEO_E2E_SHOW ? [] : ['-r', path.join(__dirname, 'hide-windows.js')];
  const app = await electron.launch({ args: [...hide, '.', `--user-data-dir=${seed.userData}`], cwd: REPO });
  const page = await app.firstWindow();
  await page.waitForFunction(() => typeof library !== 'undefined' && !!library);
  // hard guard: never run a test against a library outside the temp folder
  const libPath = await page.evaluate(() => window.neo.libraryPath());
  if (fs.realpathSync(libPath) !== fs.realpathSync(seed.lib)) {
    await app.close();
    throw new Error(`NEO opened ${libPath}, not the test library ${seed.lib}`);
  }
  await page.evaluate((id) => openBook(id), BOOK_ID);
  await page.waitForSelector('.chapter-body p');
  return { app, page };
}

async function close({ app }) {
  if (app) await app.close();
}

// Menu item by label path, e.g. ['Format', 'Align Paragraph', 'Center'].
async function menuItem(app, labels) {
  return app.evaluate((_electron, labels) => {
    let items = _electron.Menu.getApplicationMenu().items;
    let item = null;
    for (const label of labels) {
      item = items.find((i) => i.label === label);
      if (!item) return null;
      items = item.submenu ? item.submenu.items : [];
    }
    return {
      label: item.label,
      accelerator: item.accelerator || null,
      submenu: item.submenu ? item.submenu.items.map((i) => ({ label: i.label, type: i.type, accelerator: i.accelerator || null })) : null,
    };
  }, labels);
}

// Clicks the real menu item: the same sendToWindow path its accelerator takes.
async function clickMenu(app, labels) {
  await app.evaluate((_electron, labels) => {
    let items = _electron.Menu.getApplicationMenu().items;
    let item = null;
    for (const label of labels) {
      item = items.find((i) => i.label === label);
      if (!item) throw new Error('No menu item ' + labels.join(' → '));
      items = item.submenu ? item.submenu.items : [];
    }
    item.click();
  }, labels);
}

// Every accelerator in the application menu, with its label path.
async function allAccelerators(app) {
  return app.evaluate((_electron) => {
    const out = [];
    const walk = (items, trail) => {
      for (const i of items) {
        if (i.accelerator) out.push({ accelerator: i.accelerator, path: [...trail, i.label].join(' → ') });
        if (i.submenu) walk(i.submenu.items, [...trail, i.label]);
      }
    };
    walk(_electron.Menu.getApplicationMenu().items, []);
    return out;
  });
}

// Put the caret at a character offset inside manuscript paragraph `index`.
async function setCaret(page, index, offset = 0) {
  await page.evaluate(([index, offset]) => {
    const p = document.querySelectorAll('.chapter-body > p')[index];
    p.closest('.chapter-body').focus();
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    let n, pos = 0;
    while ((n = walker.nextNode())) {
      if (offset <= pos + n.textContent.length) break;
      pos += n.textContent.length;
    }
    const r = document.createRange();
    r.setStart(n, offset - pos);
    r.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
  }, [index, offset]);
}

// Select from the start of paragraph `from` to the end of paragraph `to`.
async function selectParagraphs(page, from, to) {
  await page.evaluate(([from, to]) => {
    const ps = document.querySelectorAll('.chapter-body > p');
    ps[from].closest('.chapter-body').focus();
    const r = document.createRange();
    r.setStart(ps[from].firstChild, 0);
    r.setEnd(ps[to].lastChild, ps[to].lastChild.textContent.length);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
  }, [from, to]);
}

// Offset of `needle` in paragraph `index`, for readable caret placement.
async function offsetOf(page, index, needle) {
  const off = await page.evaluate(([index, needle]) =>
    document.querySelectorAll('.chapter-body > p')[index].textContent.indexOf(needle), [index, needle]);
  if (off < 0) throw new Error(`"${needle}" not in paragraph ${index}`);
  return off;
}

async function paragraphAligns(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('.chapter-body > p')].map((p) => p.style.textAlign || ''));
}

// Text painted at full ink by focus mode ('' when there is no highlight).
async function focusText(page) {
  // selectionchange → requestAnimationFrame → highlight; wait two frames
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  return page.evaluate(() => {
    const h = CSS.highlights.get('neo-focus');
    if (!h) return '';
    return [...h].map((r) => r.toString()).join('');
  });
}

// Keys only app.js's own keydown listeners handle (no menu item), which a
// menu accelerator must not take over. ⌘/ and ⌘Z are both menu items and
// renderer keys on purpose, so they are not listed.
const RENDERER_SHORTCUTS = ['CmdOrCtrl+Shift+X', 'CmdOrCtrl+Shift+D', 'CmdOrCtrl+B', 'CmdOrCtrl+I'];

// 'Shift+CommandOrControl+Z' and 'CmdOrCtrl+Shift+Z' are the same key; on the
// Mac 'Command+…' also collides with 'CmdOrCtrl+…'.
function normalizeAccelerator(accel) {
  const alias = { commandorcontrol: 'mod', cmdorctrl: 'mod', command: 'mod', cmd: 'mod',
    control: 'ctrl', ctrl: 'ctrl', alt: 'alt', option: 'alt', shift: 'shift' };
  const parts = accel.split('+').map((p) => p.trim().toLowerCase());
  const key = parts.pop();
  const mods = [...new Set(parts.map((p) => alias[p] || p))].sort();
  return [...mods, key].join('+');
}

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// Wait until the debounced chapter save has written something matching `test`.
async function waitForChapterFile(seed, test) {
  await expect.poll(() => test(fs.readFileSync(seed.chapterFile, 'utf8')), { timeout: 10_000 }).toBe(true);
  return fs.readFileSync(seed.chapterFile, 'utf8');
}

module.exports = {
  seedLibrary, launch, close, menuItem, clickMenu, allAccelerators,
  setCaret, selectParagraphs, offsetOf, paragraphAligns, focusText,
  readJSON, waitForChapterFile, normalizeAccelerator, RENDERER_SHORTCUTS, CHAPTER_HTML,
};
