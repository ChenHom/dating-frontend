import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright Configuration for 交友聊天遊戲 APP
 * 
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  // 測試目錄
  testDir: './e2e',
  
  // 全局設置文件
  globalSetup: './e2e/utils/global-setup.ts',
  globalTeardown: './e2e/utils/global-teardown.ts',

  // 每個測試的超時時間 (30 秒)
  timeout: 30 * 1000,

  // 斷言超時時間 (5 秒)
  expect: {
    // 每個 expect() 調用的最大等待時間
    timeout: 5000,
    // 截圖比較的閾值
    threshold: 0.2,
    // 視覺測試模式
    mode: 'strict'
  },

  // 平行測試配置
  fullyParallel: true,
  
  // 失敗重試次數
  retries: process.env.CI ? 2 : 0,
  
  // 平行工作進程數
  workers: process.env.CI ? 1 : undefined,

  // 測試報告配置
  reporter: [
    // 命令行輸出
    ['list'],
    // JSON 報告
    ['json', { outputFile: './e2e/reports/test-results.json' }],
    // HTML 報告
    ['html', { 
      open: 'never',
      outputFolder: './e2e/reports/html-report'
    }],
    // 用於 CI 的 JUnit 報告
    ['junit', { outputFile: './e2e/reports/junit-results.xml' }]
  ],

  // 全局配置
  use: {
    // 基礎 URL
    baseURL: process.env.BASE_URL || 'http://localhost:8083',

    // 追蹤設定 - 僅在失敗時保留
    trace: 'on-first-retry',
    
    // 截圖設定 - 僅在失敗時截圖
    screenshot: 'only-on-failure',
    
    // 錄影設定 - 僅在失敗時錄影
    video: 'retain-on-failure',

    // 瀏覽器內容設定
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // 等待設定
    actionTimeout: 0,
    navigationTimeout: 30 * 1000,

    // 存儲狀態 - 用於保持認證狀態
    storageState: undefined // 將在測試中動態設置
  },

  // 測試項目配置 - 多瀏覽器支援
  projects: [
    // 設置項目 - 準備認證狀態
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      teardown: 'cleanup'
    },

    // 清理項目
    {
      name: 'cleanup',
      testMatch: /.*\.teardown\.ts/
    },

    // Desktop Chrome
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './e2e/fixtures/auth.json' // 使用已認證狀態
      },
      dependencies: ['setup'],
      teardown: 'cleanup'
    },

    // Desktop Firefox
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        storageState: './e2e/fixtures/auth.json'
      },
      dependencies: ['setup'],
      teardown: 'cleanup'
    },

    // Desktop Safari
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        storageState: './e2e/fixtures/auth.json'
      },
      dependencies: ['setup'],
      teardown: 'cleanup'
    },

    // Microsoft Edge
    {
      name: 'msedge',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'msedge',
        storageState: './e2e/fixtures/auth.json'
      },
      dependencies: ['setup'],
      teardown: 'cleanup'
    },

    // Mobile Chrome
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        storageState: './e2e/fixtures/auth.json'
      },
      dependencies: ['setup'],
      teardown: 'cleanup'
    },

    // Mobile Safari
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        storageState: './e2e/fixtures/auth.json'
      },
      dependencies: ['setup'],
      teardown: 'cleanup'
    },

    // 未認證測試 - 用於測試登入流程
    {
      name: 'unauthenticated',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: { cookies: [], origins: [] } // 清空狀態
      },
      testMatch: /.*\.unauthenticated\.spec\.ts/
    }
  ],

  // 開發服務器配置
  webServer: process.env.CI ? undefined : {
    command: 'CI=1 npx expo start --web --port 8083',
    port: 8083,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 分鐘啟動時間
    stdout: 'ignore',
    stderr: 'pipe'
  },

  // 輸出目錄
  outputDir: './e2e/test-results/',

  // 禁用並行測試的特定檔案模式
  forbidOnly: !!process.env.CI,
  
  // 保持測試失敗時的瀏覽器開啟（開發時有用）
  preserveOutput: process.env.CI ? 'failures-only' : 'always'
});