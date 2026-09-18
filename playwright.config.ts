import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/ui',
  timeout: 60000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8081',
    ...devices['Pixel 7'],
    browserName: 'chromium',
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  reporter: 'list',
});
