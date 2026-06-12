import { defineConfig, devices } from '@playwright/test'
import { TEST_CONFIG } from './code/test.config'

process.env.AUDIT_RUN_ID =
  process.env.AUDIT_RUN_ID ||
  new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace(/[:\s]/g, '-')

export default defineConfig({
  testDir: './code/case',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: './playwright-report' }],
  ],
  use: {
    baseURL: TEST_CONFIG.baseUrl,
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on-first-retry',
    actionTimeout: TEST_CONFIG.timeout.action,
    navigationTimeout: TEST_CONFIG.timeout.navigation,
  },
  expect: {
    timeout: TEST_CONFIG.timeout.expect,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  preserveOutput: 'never',
  outputDir: './test-results',
})
