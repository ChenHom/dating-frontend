/**
 * Authentication E2E Tests
 * 認證系統的端對端測試
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { FeedPage } from '../pages/FeedPage';
import { TestDataGenerator } from '../utils/test-helpers';

test.describe('Authentication Flow', () => {
  let loginPage: LoginPage;
  let feedPage: FeedPage;

  test.beforeEach(async ({ page, baseURL }) => {
    loginPage = new LoginPage(page, baseURL || 'http://localhost:8083');
    feedPage = new FeedPage(page, baseURL || 'http://localhost:8083');
  });

  test.describe('Login Page', () => {
    test('should display login page correctly', async () => {
      await loginPage.navigateToLogin();
      await expect(loginPage.isPageLoaded()).resolves.toBe(true);
      
      // 驗證頁面元素
      await loginPage.verifyLoginPageElements();
      
      // 驗證 URL
      await loginPage.verifyLoginPageURL();
      
      // 截圖
      await loginPage.takeLoginPageScreenshot('login-page-display');
    });

    test('should show validation errors for empty form', async () => {
      await loginPage.navigateToLogin();
      await loginPage.testEmptyFormSubmission();
      
      // 驗證顯示了驗證錯誤
      const emailError = await loginPage.getLoginError();
      expect(emailError).toBeTruthy();
    });

    test('should show error for invalid credentials', async () => {
      await loginPage.navigateToLogin();
      
      const errorMessage = await loginPage.testInvalidCredentials();
      expect(errorMessage).toContain(/invalid|incorrect|wrong/i);
      
      // 確認仍在登入頁面
      await loginPage.verifyLoginPageURL();
    });

    test('should validate email format', async () => {
      await loginPage.navigateToLogin();
      
      await loginPage.fillLoginForm('invalid-email', 'password123');
      await loginPage.clickLoginButton();
      
      // 檢查是否有電子郵件格式錯誤
      const error = await loginPage.getLoginError();
      expect(error).toContain(/email|format|invalid/i);
    });
  });

  test.describe('Login Success Flow', () => {
    test('should successfully login with valid credentials', async () => {
      await loginPage.navigateToLogin();
      
      // 使用有效憑據登入（這裡需要根據實際情況調整）
      await loginPage.fillLoginForm('test@example.com', 'testpassword123');
      await loginPage.clickLoginButton();
      
      // 等待登入完成
      await loginPage.waitForLoginComplete();
      
      // 檢查是否成功登入（重定向到主頁面）
      const isSuccess = await loginPage.isLoginSuccessful();
      expect(isSuccess).toBe(true);
      
      // 驗證已導航到 feed 頁面
      await feedPage.verifyFeedPageURL();
    });

    test('should maintain login state after page refresh', async () => {
      // 先登入
      await loginPage.navigateToLogin();
      await loginPage.loginAsTestUser();
      
      // 等待登入成功
      await expect(loginPage.isLoginSuccessful()).resolves.toBe(true);
      
      // 刷新頁面
      await loginPage.reload();
      
      // 驗證仍然登入（不會重定向到登入頁面）
      const currentURL = loginPage.getCurrentURL();
      expect(currentURL).not.toContain('/login');
    });

    test('should remember me functionality', async () => {
      await loginPage.navigateToLogin();
      
      // 勾選記住我
      await loginPage.setRememberMe(true);
      
      // 登入
      await loginPage.loginAsTestUser();
      
      // 驗證登入成功
      await expect(loginPage.isLoginSuccessful()).resolves.toBe(true);
      
      // 這裡可以添加更多記住我功能的驗證
    });
  });

  test.describe('Social Login', () => {
    test('should display social login options', async () => {
      await loginPage.navigateToLogin();
      
      // 檢查社交登入按鈕是否存在
      const hasGoogle = await loginPage.isElementVisible('[data-testid="google-login"], button:has-text("Google")', 3000);
      const hasApple = await loginPage.isElementVisible('[data-testid="apple-login"], button:has-text("Apple")', 3000);
      const hasLine = await loginPage.isElementVisible('[data-testid="line-login"], button:has-text("LINE")', 3000);
      
      // 至少應該有一個社交登入選項
      expect(hasGoogle || hasApple || hasLine).toBe(true);
    });

    // 注意：社交登入的實際測試需要額外的設置和模擬
    test.skip('should initiate Google login flow', async () => {
      await loginPage.navigateToLogin();
      await loginPage.loginWithGoogle();
      
      // 這裡需要處理外部認證流程
      // 實際實施時需要模擬或使用測試帳號
    });
  });

  test.describe('Navigation and Links', () => {
    test('should navigate to register page', async () => {
      await loginPage.navigateToLogin();
      await loginPage.clickRegisterLink();
      
      // 驗證導航到註冊頁面
      const currentURL = loginPage.getCurrentURL();
      expect(currentURL).toContain('register');
    });

    test('should navigate to forgot password', async () => {
      await loginPage.navigateToLogin();
      await loginPage.clickForgotPassword();
      
      // 驗證導航到忘記密碼頁面
      const currentURL = loginPage.getCurrentURL();
      expect(currentURL).toContain(/forgot|reset/);
    });
  });

  test.describe('Form Interactions', () => {
    test('should clear form when needed', async () => {
      await loginPage.navigateToLogin();
      
      // 填寫表單
      await loginPage.fillLoginForm('test@example.com', 'password123');
      
      // 清空表單
      await loginPage.clearLoginForm();
      
      // 驗證表單已清空
      const emailValue = await loginPage.page.locator('[data-testid="email-input"], input[type="email"]').inputValue();
      const passwordValue = await loginPage.page.locator('[data-testid="password-input"], input[type="password"]').inputValue();
      
      expect(emailValue).toBe('');
      expect(passwordValue).toBe('');
    });

    test('should handle form submission with Enter key', async () => {
      await loginPage.navigateToLogin();
      
      await loginPage.fillLoginForm('test@example.com', 'password123');
      
      // 在密碼欄位按 Enter
      await loginPage.page.locator('[data-testid="password-input"], input[type="password"]').press('Enter');
      
      // 驗證表單已提交（應該看到載入狀態或錯誤）
      const isLoading = await loginPage.isLoggingIn();
      const hasError = await loginPage.getLoginError();
      
      expect(isLoading || hasError).toBeTruthy();
    });
  });

  test.describe('Loading States', () => {
    test('should show loading state during login', async () => {
      await loginPage.navigateToLogin();
      await loginPage.fillLoginForm('test@example.com', 'password123');
      
      // 點擊登入並立即檢查載入狀態
      await loginPage.clickLoginButton();
      
      // 檢查是否顯示載入狀態
      const isLoading = await loginPage.isLoggingIn();
      
      if (isLoading) {
        // 等待載入完成
        await loginPage.waitForLoginComplete();
      }
      
      // 驗證載入狀態已結束
      const stillLoading = await loginPage.isLoggingIn();
      expect(stillLoading).toBe(false);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      await loginPage.navigateToLogin();
      
      // 模擬網路錯誤
      await loginPage.page.route('**/auth/**', route => route.abort('failed'));
      
      await loginPage.fillLoginForm('test@example.com', 'password123');
      await loginPage.clickLoginButton();
      
      // 等待並檢查錯誤訊息
      const error = await loginPage.getLoginError();
      expect(error).toBeTruthy();
      expect(error).toContain(/network|connection|error/i);
    });

    test('should handle server errors', async () => {
      await loginPage.navigateToLogin();
      
      // 模擬伺服器錯誤
      await loginPage.page.route('**/auth/**', route => 
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' })
        })
      );
      
      await loginPage.fillLoginForm('test@example.com', 'password123');
      await loginPage.clickLoginButton();
      
      const error = await loginPage.getLoginError();
      expect(error).toBeTruthy();
    });
  });

  test.describe('Security', () => {
    test('should not expose password in DOM', async () => {
      await loginPage.navigateToLogin();
      await loginPage.fillLoginForm('test@example.com', 'secretpassword');
      
      // 檢查密碼是否被遮蔽
      const passwordInput = loginPage.page.locator('[data-testid="password-input"], input[type="password"]');
      const inputType = await passwordInput.getAttribute('type');
      
      expect(inputType).toBe('password');
    });

    test('should clear sensitive data on navigation', async () => {
      await loginPage.navigateToLogin();
      await loginPage.fillLoginForm('test@example.com', 'password123');
      
      // 導航到其他頁面
      await loginPage.clickRegisterLink();
      
      // 返回登入頁面
      await loginPage.navigateToLogin();
      
      // 驗證表單已清空
      const passwordValue = await loginPage.page.locator('[data-testid="password-input"], input[type="password"]').inputValue();
      expect(passwordValue).toBe('');
    });
  });
});

// 未認證狀態測試
test.describe('Unauthenticated Access', () => {
  test('should redirect to login when accessing protected pages', async ({ page, baseURL }) => {
    const feedPage = new FeedPage(page, baseURL || 'http://localhost:8083');
    
    // 嘗試直接訪問受保護的頁面
    await feedPage.navigateToFeed();
    
    // 應該被重定向到登入頁面
    const currentURL = page.url();
    expect(currentURL).toContain('login');
  });

  test('should show login page as default route when unauthenticated', async ({ page, baseURL }) => {
    const loginPage = new LoginPage(page, baseURL || 'http://localhost:8083');
    
    // 訪問應用根路徑
    await loginPage.goto('/');
    
    // 應該顯示登入頁面或重定向到登入
    await loginPage.waitForPageLoad();
    
    const isOnLogin = loginPage.getCurrentURL().includes('login');
    const isLoginPageLoaded = await loginPage.isPageLoaded();
    
    expect(isOnLogin || isLoginPageLoaded).toBe(true);
  });
});