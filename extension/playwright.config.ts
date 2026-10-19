import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 180000,
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    viewport: { width: 1280, height: 800 },
    acceptDownloads: true,
    trace: 'off',
  },
  webServer: {
    command: 'python3 -m http.server 8799 --bind 127.0.0.1',
    cwd: 'tests/fixtures',
    url: 'http://127.0.0.1:8799/table.html',
    reuseExistingServer: true,
  },
});
