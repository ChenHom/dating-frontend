/**
 * Global Setup for Playwright Tests
 * 在所有測試開始前執行的設置
 */

import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');

  // 確保報告目錄存在
  const reportsDir = path.resolve(__dirname, '../reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // 確保測試結果目錄存在
  const testResultsDir = path.resolve(__dirname, '../test-results');
  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true });
  }

  // 確保固件目錄存在
  const fixturesDir = path.resolve(__dirname, '../fixtures');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  // 等待應用服務器啟動
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:8083';
  console.log(`⏳ Waiting for server at ${baseURL}...`);
  
  await waitForServer(baseURL);
  console.log('✅ Server is ready!');

  // 創建測試用戶認證狀態（用於需要認證的測試）
  await setupAuthState(baseURL);
  
  console.log('🎉 Global setup completed successfully!');
}

/**
 * 等待服務器啟動
 */
async function waitForServer(baseURL: string, timeout = 60000) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const response = await page.goto(baseURL, { 
        waitUntil: 'domcontentloaded',
        timeout: 5000 
      });
      
      if (response && response.ok()) {
        await browser.close();
        return;
      }
    } catch (error) {
      // 繼續等待
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  await browser.close();
  throw new Error(`Server at ${baseURL} did not start within ${timeout}ms`);
}

/**
 * 設置測試用戶認證狀態
 * 為需要認證的測試創建登入狀態
 */
async function setupAuthState(baseURL: string) {
  console.log('🔐 Setting up authentication state...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 訪問應用首頁
    await page.goto(baseURL);
    
    // 等待頁面載入並檢查是否需要登入
    await page.waitForLoadState('networkidle');
    
    // 檢查是否出現登入頁面
    const hasLoginForm = await page.locator('text=login', { hasText: /login/i }).isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasLoginForm) {
      console.log('📝 Login form detected, creating authenticated state...');
      
      // 這裡可以實際執行登入流程
      // 由於目前是開發階段，我們創建一個模擬的認證狀態
      const mockAuthState = {
        cookies: [],
        origins: [
          {
            origin: baseURL,
            localStorage: [
              {
                name: 'auth-storage',
                value: JSON.stringify({
                  state: {
                    user: {
                      id: 'test-user-1',
                      email: 'test@example.com',
                      name: 'Test User'
                    },
                    token: 'mock-jwt-token',
                    isAuthenticated: true
                  },
                  version: 1
                })
              }
            ]
          }
        ]
      };

      // 保存認證狀態到文件
      const authFile = path.resolve(__dirname, '../fixtures/auth.json');
      fs.writeFileSync(authFile, JSON.stringify(mockAuthState, null, 2));
      
      console.log('✅ Authentication state saved to fixtures/auth.json');
    } else {
      console.log('ℹ️  No login required, skipping auth setup');
    }

  } catch (error) {
    console.warn('⚠️  Could not set up authentication state:', error);
    
    // 創建空的認證狀態文件
    const emptyAuthState = { cookies: [], origins: [] };
    const authFile = path.resolve(__dirname, '../fixtures/auth.json');
    fs.writeFileSync(authFile, JSON.stringify(emptyAuthState, null, 2));
  } finally {
    await browser.close();
  }
}

export default globalSetup;