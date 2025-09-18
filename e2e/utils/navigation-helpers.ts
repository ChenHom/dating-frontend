/**
 * Navigation Test Helpers
 * 導航測試輔助函數
 */

import { Page, expect } from '@playwright/test';

export interface NavigationResult {
  success: boolean;
  currentUrl: string;
  error?: string;
}

export class NavigationHelpers {
  constructor(private page: Page) {}

  /**
   * 等待頁面完全載入
   */
  async waitForPageLoad(timeout = 5000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout });
    await this.page.waitForTimeout(500); // 額外等待渲染完成
  }

  /**
   * 安全導航到指定 URL
   */
  async navigateToUrl(url: string, waitForLoad = true): Promise<NavigationResult> {
    try {
      await this.page.goto(url);

      if (waitForLoad) {
        await this.waitForPageLoad();
      }

      return {
        success: true,
        currentUrl: this.page.url()
      };
    } catch (error) {
      return {
        success: false,
        currentUrl: this.page.url(),
        error: error instanceof Error ? error.message : 'Unknown navigation error'
      };
    }
  }

  /**
   * 驗證當前 URL 是否符合預期
   */
  async verifyUrl(expectedUrl: string | RegExp): Promise<boolean> {
    const currentUrl = this.page.url();

    if (typeof expectedUrl === 'string') {
      return currentUrl === expectedUrl || currentUrl.endsWith(expectedUrl);
    } else {
      return expectedUrl.test(currentUrl);
    }
  }

  /**
   * 等待 URL 變化
   */
  async waitForUrlChange(timeout = 10000): Promise<string> {
    const initialUrl = this.page.url();

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`URL did not change within ${timeout}ms`));
      }, timeout);

      const checkUrl = () => {
        const currentUrl = this.page.url();
        if (currentUrl !== initialUrl) {
          clearTimeout(timer);
          resolve(currentUrl);
        } else {
          setTimeout(checkUrl, 100);
        }
      };

      checkUrl();
    });
  }

  /**
   * 點擊導航元素並等待導航完成
   */
  async clickAndNavigate(
    selector: string,
    expectedUrl?: string | RegExp,
    timeout = 10000
  ): Promise<NavigationResult> {
    try {
      const initialUrl = this.page.url();

      // 點擊元素
      await this.page.click(selector, { timeout });

      // 如果提供了預期 URL，等待 URL 變化
      if (expectedUrl) {
        await this.page.waitForURL(expectedUrl, { timeout });
      } else {
        // 等待 URL 變化
        await this.waitForUrlChange(timeout);
      }

      await this.waitForPageLoad();

      return {
        success: true,
        currentUrl: this.page.url()
      };
    } catch (error) {
      return {
        success: false,
        currentUrl: this.page.url(),
        error: error instanceof Error ? error.message : 'Click navigation failed'
      };
    }
  }

  /**
   * 檢查元素是否存在且可見
   */
  async isElementVisible(selector: string, timeout = 5000): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 檢查頁面是否在載入狀態
   */
  async isPageLoading(): Promise<boolean> {
    // 檢查是否有載入指示器
    const loadingSelectors = [
      '[data-testid*="loading"]',
      '[data-testid*="spinner"]',
      '.loading',
      '.spinner'
    ];

    for (const selector of loadingSelectors) {
      if (await this.isElementVisible(selector, 1000)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 等待載入狀態結束
   */
  async waitForLoadingToComplete(maxWait = 10000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      if (!(await this.isPageLoading())) {
        break;
      }
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * 驗證頁面內容是否正確載入
   */
  async verifyPageContent(testId: string, timeout = 5000): Promise<boolean> {
    try {
      await this.page.waitForSelector(`[data-testid="${testId}"]`, {
        state: 'visible',
        timeout
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 取得頁面標題或主要識別元素的文字
   */
  async getPageIdentifier(): Promise<string> {
    const identifierSelectors = [
      '[data-testid*="title"]',
      '[data-testid*="header"]',
      'h1', 'h2',
      '[data-testid*="container"]'
    ];

    for (const selector of identifierSelectors) {
      try {
        const element = await this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          const text = await element.textContent();
          if (text && text.trim()) {
            return text.trim();
          }
        }
      } catch {
        // 繼續下一個選擇器
      }
    }

    return 'Unknown Page';
  }

  /**
   * 截圖並保存 (用於測試失敗時的除錯)
   */
  async takeDebugScreenshot(name: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `debug-${name}-${timestamp}.png`;
    const path = `test-results/${filename}`;

    await this.page.screenshot({ path, fullPage: true });
    return path;
  }

  /**
   * 記錄頁面狀態 (用於除錯)
   */
  async logPageState(context = 'Navigation Test'): Promise<void> {
    const url = this.page.url();
    const title = await this.page.title();
    const identifier = await this.getPageIdentifier();
    const isLoading = await this.isPageLoading();

    console.log(`[${context}] Page State:`, {
      url,
      title,
      identifier,
      isLoading,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 設定已認證狀態 (使用正確的 Zustand 格式)
   */
  async setAuthenticatedState(user = {
    id: 'test-user-1',
    email: 'test@example.com',
    name: 'Test User'
  }, token = 'mock-jwt-token'): Promise<void> {
    console.log('🔐 Setting authenticated state with Zustand format...');

    await this.page.evaluate(({ user, token }) => {
      // 設定正確的 Zustand 持久化格式
      const authStorage = {
        state: {
          user,
          token,
          isAuthenticated: true
        },
        version: 0
      };

      localStorage.setItem('auth-storage', JSON.stringify(authStorage));

      // 觸發 storage 事件讓 Zustand 重新水化
      window.dispatchEvent(new Event('storage'));

      console.log('💾 Auth state set:', authStorage);
    }, { user, token });

    // 等待 Zustand store 重新水化
    await this.page.waitForTimeout(200);
  }

  /**
   * 清除認證狀態
   */
  async clearAuthenticatedState(): Promise<void> {
    console.log('🚪 Clearing authenticated state...');

    await this.page.evaluate(() => {
      localStorage.removeItem('auth-storage');
      localStorage.removeItem('auth-token');
      localStorage.removeItem('auth-user');

      // 觸發 storage 事件
      window.dispatchEvent(new Event('storage'));
    });

    // 等待狀態變化
    await this.page.waitForTimeout(200);
  }

  /**
   * 等待 ProtectedRoute 檢查完成
   * ProtectedRoute 有 100ms 的導航準備延遲
   */
  async waitForProtectedRouteCheck(timeout = 3000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      // 檢查是否還在載入狀態
      const isLoading = await this.isElementVisible('[data-testid="auth-loading"]', 500).catch(() => false);
      const isRedirecting = await this.isElementVisible('[data-testid="auth-redirect"]', 500).catch(() => false);

      if (!isLoading && !isRedirecting) {
        // 額外等待確保導航完成
        await this.page.waitForTimeout(300);
        break;
      }

      await this.page.waitForTimeout(100);
    }
  }

  /**
   * 驗證認證狀態是否正確設定
   */
  async verifyAuthState(): Promise<{ isAuthenticated: boolean, hasToken: boolean, hasUser: boolean }> {
    return await this.page.evaluate(() => {
      const authStorage = localStorage.getItem('auth-storage');

      if (!authStorage) {
        return { isAuthenticated: false, hasToken: false, hasUser: false };
      }

      try {
        const parsed = JSON.parse(authStorage);
        const state = parsed.state || {};

        return {
          isAuthenticated: Boolean(state.isAuthenticated),
          hasToken: Boolean(state.token),
          hasUser: Boolean(state.user)
        };
      } catch (error) {
        console.error('Failed to parse auth storage:', error);
        return { isAuthenticated: false, hasToken: false, hasUser: false };
      }
    });
  }
}

/**
 * 常用的 URL 模式
 */
export const URL_PATTERNS = {
  HOME: /\/$/,
  LOGIN: /\/login$/,
  REGISTER: /\/register$/,
  DISCOVER: /\/\(tabs\)\/discover$/,
  MATCHES: /\/\(tabs\)\/matches$/,
  MESSAGES: /\/\(tabs\)\/messages$/,
  PROFILE: /\/\(tabs\)\/profile$/,
  CHAT: /\/chat\/\d+$/,
  EDIT_PROFILE: /\/profile\/edit$/,
  SETTINGS: /\/settings$/,
  MATCH_SUCCESS: /\/match\/success$/,
  NOT_FOUND: /\/\+not-found$/
} as const;

/**
 * 常用的頁面 TestID
 */
export const PAGE_TEST_IDS = {
  // 認證頁面
  LOGIN_FORM: 'login-form',
  REGISTER_FORM: 'register-form',

  // 主要頁面
  DISCOVER_CONTAINER: 'discover-container',
  MATCHES_CONTAINER: 'matches-container',
  CHAT_LIST_CONTAINER: 'chat-list-container',
  PROFILE_CONTAINER: 'profile-container',

  // 聊天相關
  CHAT_SCREEN: 'chat-screen',

  // 載入狀態
  APP_LOADING: 'app-loading',
  AUTH_LOADING: 'auth-loading',
  AUTH_REDIRECT: 'auth-redirect',

  // 按鈕
  LOGIN_BUTTON: 'login-button',
  REGISTER_BUTTON: 'register-button',
  LOGOUT_BUTTON: 'logout-button',
  BACK_BUTTON: 'back-button'
} as const;

/**
 * 獨立的認證輔助函數
 * 可直接在測試檔案中使用，無需 NavigationHelpers 實例
 */

/**
 * 設定已認證狀態 (獨立函數版本)
 */
export async function setAuthenticatedState(
  page: Page,
  user = {
    id: 'test-user-1',
    email: 'test@example.com',
    name: 'Test User'
  },
  token = 'mock-jwt-token'
): Promise<void> {
  console.log('🔐 Setting authenticated state with Zustand format...');

  // 先等待頁面完全載入
  await page.waitForLoadState('networkidle');

  // 確保導航到正確的頁面以避免 CORS 問題
  const currentUrl = page.url();
  if (!currentUrl.includes('localhost:8083')) {
    await page.goto('http://localhost:8083');
    await page.waitForLoadState('networkidle');
  }

  try {
    await page.evaluate(({ user, token }) => {
      // 檢查 localStorage 是否可用
      if (typeof Storage === 'undefined') {
        throw new Error('localStorage not available');
      }

      // 設定正確的 Zustand 持久化格式
      const authStorage = {
        state: {
          user,
          token,
          isAuthenticated: true
        },
        version: 0
      };

      localStorage.setItem('auth-storage', JSON.stringify(authStorage));

      // 觸發 storage 事件讓 Zustand 重新水化
      window.dispatchEvent(new Event('storage'));

      console.log('💾 Auth state set:', authStorage);
    }, { user, token });

    // 等待 Zustand store 重新水化
    await page.waitForTimeout(300);
  } catch (error) {
    console.error('❌ Failed to set authenticated state:', error);
    // 如果 localStorage 方法失敗，嘗試使用 Playwright 的 context.addInitScript
    await page.context().addInitScript(({ user, token }) => {
      const authStorage = {
        state: {
          user,
          token,
          isAuthenticated: true
        },
        version: 0
      };
      localStorage.setItem('auth-storage', JSON.stringify(authStorage));
    }, { user, token });

    // 重新載入頁面以確保 script 執行
    await page.reload();
    await page.waitForLoadState('networkidle');
  }
}

/**
 * 清除認證狀態 (獨立函數版本)
 */
export async function clearAuthenticatedState(page: Page): Promise<void> {
  console.log('🚪 Clearing authenticated state...');

  // 先等待頁面完全載入
  await page.waitForLoadState('networkidle');

  // 確保導航到正確的頁面以避免 CORS 問題
  const currentUrl = page.url();
  if (!currentUrl.includes('localhost:8083')) {
    await page.goto('http://localhost:8083');
    await page.waitForLoadState('networkidle');
  }

  try {
    await page.evaluate(() => {
      // 檢查 localStorage 是否可用
      if (typeof Storage === 'undefined') {
        throw new Error('localStorage not available');
      }

      localStorage.removeItem('auth-storage');
      localStorage.removeItem('auth-token');
      localStorage.removeItem('auth-user');

      // 觸發 storage 事件
      window.dispatchEvent(new Event('storage'));
    });
  } catch (error) {
    console.error('❌ Failed to clear authenticated state:', error);
    // 如果直接清除失敗，重新載入頁面
    await page.reload();
    await page.waitForLoadState('networkidle');
  }

  // 等待狀態變化
  await page.waitForTimeout(200);
}

/**
 * 等待 ProtectedRoute 檢查完成 (獨立函數版本)
 */
export async function waitForProtectedRouteCheck(page: Page, timeout = 3000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    // 檢查是否還在載入狀態
    try {
      const isLoading = await page.isVisible('[data-testid="auth-loading"]', { timeout: 500 });
      const isRedirecting = await page.isVisible('[data-testid="auth-redirect"]', { timeout: 500 });

      if (!isLoading && !isRedirecting) {
        // 額外等待確保導航完成
        await page.waitForTimeout(300);
        break;
      }
    } catch {
      // 元素不存在，可能已經完成載入
      await page.waitForTimeout(300);
      break;
    }

    await page.waitForTimeout(100);
  }
}

/**
 * 驗證認證狀態是否正確設定 (獨立函數版本)
 */
export async function verifyAuthState(page: Page): Promise<{ isAuthenticated: boolean, hasToken: boolean, hasUser: boolean }> {
  return await page.evaluate(() => {
    const authStorage = localStorage.getItem('auth-storage');

    if (!authStorage) {
      return { isAuthenticated: false, hasToken: false, hasUser: false };
    }

    try {
      const parsed = JSON.parse(authStorage);
      const state = parsed.state || {};

      return {
        isAuthenticated: Boolean(state.isAuthenticated),
        hasToken: Boolean(state.token),
        hasUser: Boolean(state.user)
      };
    } catch (error) {
      console.error('Failed to parse auth storage:', error);
      return { isAuthenticated: false, hasToken: false, hasUser: false };
    }
  });
}