/**
 * Login Page Object
 * 登入頁面的頁面對象模式實現
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  // 頁面特有選擇器
  private readonly pageSelectors = {
    // 標題和標語
    title: '[data-testid="login-title"], :text("Welcome Back")',
    subtitle: '[data-testid="login-subtitle"], :text("Sign in to continue")',
    
    // 表單欄位
    emailInput: '[data-testid="email-input"], input[placeholder="Email"]',
    passwordInput: '[data-testid="password-input"], input[placeholder="Password"]',
    
    // 按鈕
    loginButton: '[data-testid="login-button"], :text("Login")',
    forgotPasswordLink: '[data-testid="forgot-password"], :text("Forgot")',
    registerLink: '[data-testid="register-link"], :text("Register")',
    
    // 社交登入 (not implemented yet in component)
    googleLoginButton: '[data-testid="google-login"], :text("Google")',
    appleLoginButton: '[data-testid="apple-login"], :text("Apple")',
    lineLoginButton: '[data-testid="line-login"], :text("LINE")',
    
    // 錯誤訊息
    emailError: '[data-testid="email-error"]',
    passwordError: '[data-testid="password-error"]',
    generalError: '[data-testid="login-error"]',
    
    // 記住我 (not implemented yet in component)
    rememberMeCheckbox: '[data-testid="remember-me"], input[name="remember"]',
    
    // 載入狀態
    loginLoading: '[data-testid="login-button"][disabled=""], :text("Logging in...")'
  };

  constructor(page: Page, baseURL: string) {
    super(page, baseURL);
  }

  /**
   * 導航到登入頁面
   */
  async navigateToLogin(): Promise<void> {
    await this.goto('/login');
    await this.waitForPageLoad();
  }

  /**
   * 檢查頁面是否已載入
   */
  async isPageLoaded(): Promise<boolean> {
    try {
      await Promise.all([
        this.waitForElement(this.pageSelectors.title, { timeout: 10000 }),
        this.waitForElement(this.pageSelectors.emailInput, { timeout: 10000 }),
        this.waitForElement(this.pageSelectors.passwordInput, { timeout: 10000 }),
        this.waitForElement(this.pageSelectors.loginButton, { timeout: 10000 })
      ]);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 填寫登入表單
   */
  async fillLoginForm(email: string, password: string): Promise<void> {
    await this.fill(this.pageSelectors.emailInput, email);
    await this.fill(this.pageSelectors.passwordInput, password);
  }

  /**
   * 點擊登入按鈕
   */
  async clickLoginButton(): Promise<void> {
    // Use filtered selector to get the exact login button
    const loginButton = this.page.locator('div:has-text("Login")').filter({ hasText: /^Login$/ }).first();
    await loginButton.click();
  }

  /**
   * 執行登入操作
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillLoginForm(email, password);
    await this.clickLoginButton();
    
    // 等待登入完成（可能是導航到其他頁面或顯示錯誤）
    await Promise.race([
      // 成功登入 - 頁面改變
      this.page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 }),
      // 登入失敗 - 顯示錯誤訊息
      this.waitForElement(this.pageSelectors.generalError, { timeout: 15000 }).catch(() => null),
      // 載入狀態結束
      this.page.locator(this.pageSelectors.loginLoading).waitFor({ state: 'hidden', timeout: 15000 }).catch(() => null)
    ]);
  }

  /**
   * 使用測試用戶登入
   */
  async loginAsTestUser(): Promise<void> {
    const testEmail = 'test@example.com';
    const testPassword = 'TestPassword123!';
    await this.login(testEmail, testPassword);
  }

  /**
   * 檢查登入是否成功
   */
  async isLoginSuccessful(): Promise<boolean> {
    try {
      // 等待導航到非登入頁面 (最多等待10秒)
      await this.page.waitForURL(url => !url.includes('/login'), { 
        timeout: 10000 
      });
      return true;
    } catch {
      // 如果超時，檢查當前 URL
      const currentURL = this.page.url();
      return !currentURL.includes('/login');
    }
  }

  /**
   * 獲取登入錯誤訊息
   */
  async getLoginError(): Promise<string | null> {
    const selectors = [
      this.pageSelectors.generalError,
      this.pageSelectors.emailError,
      this.pageSelectors.passwordError
    ];

    for (const selector of selectors) {
      try {
        const element = await this.page.locator(selector).first();
        if (await element.isVisible()) {
          return await element.textContent();
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * 驗證電子郵件欄位錯誤
   */
  async verifyEmailError(expectedError: string | RegExp): Promise<void> {
    const errorElement = await this.waitForElement(this.pageSelectors.emailError);
    
    if (typeof expectedError === 'string') {
      await expect(errorElement).toHaveText(expectedError);
    } else {
      await expect(errorElement).toHaveText(expectedError);
    }
  }

  /**
   * 驗證密碼欄位錯誤
   */
  async verifyPasswordError(expectedError: string | RegExp): Promise<void> {
    const errorElement = await this.waitForElement(this.pageSelectors.passwordError);
    
    if (typeof expectedError === 'string') {
      await expect(errorElement).toHaveText(expectedError);
    } else {
      await expect(errorElement).toHaveText(expectedError);
    }
  }

  /**
   * 點擊忘記密碼連結
   */
  async clickForgotPassword(): Promise<void> {
    await this.click(this.pageSelectors.forgotPasswordLink);
  }

  /**
   * 點擊註冊連結
   */
  async clickRegisterLink(): Promise<void> {
    await this.click(this.pageSelectors.registerLink);
  }

  /**
   * 使用 Google 登入
   */
  async loginWithGoogle(): Promise<void> {
    await this.click(this.pageSelectors.googleLoginButton);
    // 注意：這裡可能需要處理外部認證流程
  }

  /**
   * 使用 Apple 登入
   */
  async loginWithApple(): Promise<void> {
    await this.click(this.pageSelectors.appleLoginButton);
    // 注意：這裡可能需要處理外部認證流程
  }

  /**
   * 使用 LINE 登入
   */
  async loginWithLine(): Promise<void> {
    await this.click(this.pageSelectors.lineLoginButton);
    // 注意：這裡可能需要處理外部認證流程
  }

  /**
   * 設定記住我選項
   */
  async setRememberMe(remember: boolean = true): Promise<void> {
    const checkbox = await this.waitForElement(this.pageSelectors.rememberMeCheckbox);
    const isChecked = await checkbox.isChecked();
    
    if (remember !== isChecked) {
      await checkbox.click();
    }
  }

  /**
   * 檢查是否正在載入
   */
  async isLoggingIn(): Promise<boolean> {
    return this.isElementVisible(this.pageSelectors.loginLoading, 1000);
  }

  /**
   * 等待登入完成
   */
  async waitForLoginComplete(timeout = 15000): Promise<void> {
    // 等待載入狀態結束
    try {
      await this.page.locator(this.pageSelectors.loginLoading).waitFor({ 
        state: 'hidden', 
        timeout 
      });
    } catch {
      // 如果沒有載入狀態，直接返回
    }
  }

  /**
   * 驗證登入頁面元素
   */
  async verifyLoginPageElements(): Promise<void> {
    // 檢查標題
    await expect(this.page.locator(this.pageSelectors.title)).toBeVisible();
    
    // 檢查表單欄位
    await expect(this.page.locator(this.pageSelectors.emailInput)).toBeVisible();
    await expect(this.page.locator(this.pageSelectors.passwordInput)).toBeVisible();
    
    // 檢查按鈕
    await expect(this.page.locator(this.pageSelectors.loginButton)).toBeVisible();
    await expect(this.page.locator(this.pageSelectors.registerLink)).toBeVisible();
  }

  /**
   * 測試無效的登入憑據
   */
  async testInvalidCredentials(): Promise<string> {
    await this.login('invalid@email.com', 'wrongpassword');
    const error = await this.getLoginError();
    return error || '';
  }

  /**
   * 測試空的表單提交
   */
  async testEmptyFormSubmission(): Promise<void> {
    await this.clickLoginButton();
    // 驗證驗證錯誤顯示
    const hasEmailError = await this.isElementVisible(this.pageSelectors.emailError, 3000);
    const hasPasswordError = await this.isElementVisible(this.pageSelectors.passwordError, 3000);
    
    expect(hasEmailError || hasPasswordError).toBeTruthy();
  }

  /**
   * 清空登入表單
   */
  async clearLoginForm(): Promise<void> {
    await this.page.locator(this.pageSelectors.emailInput).clear();
    await this.page.locator(this.pageSelectors.passwordInput).clear();
  }

  /**
   * 驗證頁面 URL
   */
  async verifyLoginPageURL(): Promise<void> {
    await this.verifyURL(/\/login$/);
  }

  /**
   * 截圖登入頁面
   */
  async takeLoginPageScreenshot(name: string = 'login-page'): Promise<void> {
    await this.takeScreenshot(name, { fullPage: true });
  }
}