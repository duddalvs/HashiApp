import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/auth-ui',
  timeout: 60000,
  workers: 1,
  retries: 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8085',
    ...devices['Pixel 7'],
    browserName: 'chromium',
    channel: 'chrome',
    trace: 'off',
  },
  reporter: 'list',
});
