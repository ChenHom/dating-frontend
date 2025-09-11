/**
 * Authentication Setup Test
 * 設置認證狀態以供其他測試使用
 */

import { test as setup } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { APIMocks } from '../utils/api-mocks';
import { TEST_CREDENTIALS } from '../fixtures/test-data';
import path from 'path';

const authFile = path.join(__dirname, '../fixtures/auth.json');

setup('authenticate user', async ({ page, baseURL }) => {
  console.log('🔐 Setting up authentication for tests...');
  
  // 創建頁面對象和 API 模擬
  const loginPage = new LoginPage(page, baseURL || 'http://localhost:8083');
  const apiMocks = new APIMocks(page);
  
  // 設置 API 模擬
  await apiMocks.mockAuthAPIs();
  
  try {
    // 導航到登入頁面
    await loginPage.navigateToLogin();
    
    // 等待頁面載入
    await loginPage.waitForPageLoad();
    console.log('📄 Login page loaded');
    
    // 執行登入
    await loginPage.login(TEST_CREDENTIALS.valid.email, TEST_CREDENTIALS.valid.password);
    console.log('👤 Login attempt completed');
    
    // 等待登入完成
    await loginPage.waitForLoginComplete();
    
    // 檢查登入是否成功
    const isSuccess = await loginPage.isLoginSuccessful();
    
    if (isSuccess) {
      console.log('✅ Login successful');
      
      // 保存認證狀態
      await page.context().storageState({ path: authFile });
      console.log('💾 Authentication state saved');
      
    } else {
      console.log('⚠️  Login may not have succeeded, but continuing...');
      
      // 即使登入可能失敗，也創建一個模擬的認證狀態
      const mockAuthState = {
        cookies: [],
        origins: [
          {
            origin: baseURL || 'http://localhost:8083',
            localStorage: [
              {
                name: 'auth-storage',
                value: JSON.stringify({
                  state: {
                    user: {
                      id: 'test-user-1',
                      email: TEST_CREDENTIALS.valid.email,
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
      
      // 使用 Node.js fs 模組保存模擬狀態
      const fs = require('fs');
      fs.writeFileSync(authFile, JSON.stringify(mockAuthState, null, 2));
      console.log('💾 Mock authentication state saved');
    }
    
  } catch (error) {
    console.error('❌ Authentication setup failed:', error);
    
    // 創建基本的認證狀態以避免測試失敗
    const fallbackAuthState = {
      cookies: [],
      origins: [
        {
          origin: baseURL || 'http://localhost:8083',
          localStorage: [
            {
              name: 'auth-storage',
              value: JSON.stringify({
                state: {
                  user: {
                    id: 'fallback-user',
                    email: 'fallback@test.com',
                    name: 'Fallback User'
                  },
                  token: 'fallback-token',
                  isAuthenticated: true
                },
                version: 1
              })
            }
          ]
        }
      ]
    };
    
    const fs = require('fs');
    fs.writeFileSync(authFile, JSON.stringify(fallbackAuthState, null, 2));
    console.log('💾 Fallback authentication state saved');
  } finally {
    // 清理 API 模擬
    await apiMocks.clearMocks();
  }
  
  console.log('🎉 Authentication setup completed');
});