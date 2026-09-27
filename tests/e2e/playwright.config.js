// Fork-only end-to-end tests: drive the real Electron app against a
// throwaway library. Not part of upstream PRs.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: __dirname,
  timeout: 60_000,
  // one Electron window at a time: menu clicks go to the focused window
  workers: 1,
  fullyParallel: false,
  reporter: [['list']],
  outputDir: 'test-results',
});
