import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.', testMatch: /.*\.spec\.mjs/, timeout: 60000, workers: 4, retries: 0,
  reporter: [['list'], ['json', { outputFile: 'results.json' }]],
  use: { baseURL: 'http://127.0.0.1:8787/', launchOptions: { executablePath: process.env.CHROME || '/usr/bin/google-chrome' }, reducedMotion: 'reduce', acceptDownloads: true },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: { command: 'python3 -m http.server 8787 --bind 127.0.0.1', cwd: '..', url: 'http://127.0.0.1:8787/', reuseExistingServer: true },
});
