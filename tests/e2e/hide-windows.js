// Preloaded into NEO's main process (electron -r) so e2e runs don't flash
// windows across the screen. macOS has no virtual display for Electron, so
// instead every BrowserWindow is created hidden and never shown, and the dock
// icon stays away. Set NEO_E2E_SHOW=1 to watch the tests instead.
//
// Hidden windows still render and take CDP input; background throttling is
// off so requestAnimationFrame (focus mode, typewriter) keeps running.
const Module = require('node:module');

const load = Module._load;
let patched = null;
Module._load = function (request, parent, isMain) {
  const electron = load.apply(this, arguments);
  if (request !== 'electron' || !electron.BrowserWindow) return electron;
  if (!patched) {
    // a Proxy, not a subclass: Electron's getAllWindows() only counts real
    // BrowserWindow instances, and NEO's menu relies on it
    const noop = () => {};
    const HiddenWindow = new Proxy(electron.BrowserWindow, {
      construct(Target, [opts = {}]) {
        const win = new Target({
          ...opts,
          show: false,
          webPreferences: { ...(opts.webPreferences || {}), backgroundThrottling: false },
        });
        Object.assign(win, { show: noop, showInactive: noop, focus: noop, moveTop: noop });
        return win;
      },
    });
    patched = new Proxy(electron, {
      get(target, prop) { return prop === 'BrowserWindow' ? HiddenWindow : target[prop]; },
    });
    if (electron.app && electron.app.dock) electron.app.dock.hide();
  }
  return patched;
};
