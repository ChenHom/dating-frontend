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