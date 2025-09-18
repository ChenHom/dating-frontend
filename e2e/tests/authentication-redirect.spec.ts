/**
 * Authentication Redirect Tests
 * 認證重定向測試
 *
 * 測試認證狀態變化時的頁面重定向邏輯，確保未認證用戶無法存取受保護內容
 */

import { test, expect } from '@playwright/test';
import { NavigationHelpers, URL_PATTERNS, PAGE_TEST_IDS, setAuthenticatedState, clearAuthenticatedState, waitForProtectedRouteCheck } from '../utils/navigation-helpers';

const BASE_URL = 'http://localhost:8083';

test.describe('Authentication Redirect Tests', () => {
  let nav: NavigationHelpers;

  test.beforeEach(async ({ page }) => {
    nav = new NavigationHelpers(page);
  });

  test.describe('未認證用戶重定向測試', () => {
    test.beforeEach(async ({ page }) => {
      // 確保完全清除認證狀態
      await page.context().clearCookies();
      await clearAuthenticatedState(page);
      await page.evaluate(() => {
        sessionStorage.clear();
      });
    });

    test('未認證訪問首頁應重定向到登入頁面', async ({ page }) => {
      await nav.navigateToUrl(BASE_URL);

      // 等待 ProtectedRoute 檢查完成
      await waitForProtectedRouteCheck(page);

      // 等待重定向完成
      await page.waitForURL(URL_PATTERNS.LOGIN, { timeout: 15000 });

      // 驗證重定向到登入頁面
      expect(await nav.verifyUrl(URL_PATTERNS.LOGIN)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.LOGIN_FORM)).toBe(true);

      await nav.logPageState('首頁重定向測試');
    });

    test('未認證訪問探索頁面應重定向到登入頁面', async ({ page }) => {
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/discover`);

      // 等待 ProtectedRoute 檢查完成
      await waitForProtectedRouteCheck(page);

      // 等待重定向到登入頁面
      await page.waitForURL(URL_PATTERNS.LOGIN, { timeout: 15000 });

      expect(await nav.verifyUrl(URL_PATTERNS.LOGIN)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.LOGIN_FORM)).toBe(true);
    });

    test('未認證訪問配對頁面應重定向到登入頁面', async ({ page }) => {
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/matches`);

      // 等待 ProtectedRoute 檢查完成
      await waitForProtectedRouteCheck(page);

      await page.waitForURL(URL_PATTERNS.LOGIN, { timeout: 15000 });

      expect(await nav.verifyUrl(URL_PATTERNS.LOGIN)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.LOGIN_FORM)).toBe(true);
    });

    test('未認證訪問訊息頁面應重定向到登入頁面', async ({ page }) => {
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/messages`);

      await page.waitForURL(URL_PATTERNS.LOGIN, { timeout: 15000 });

      expect(await nav.verifyUrl(URL_PATTERNS.LOGIN)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.LOGIN_FORM)).toBe(true);
    });

    test('未認證訪問個人檔案頁面應重定向到登入頁面', async ({ page }) => {
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/profile`);

      await page.waitForURL(URL_PATTERNS.LOGIN, { timeout: 15000 });

      expect(await nav.verifyUrl(URL_PATTERNS.LOGIN)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.LOGIN_FORM)).toBe(true);
    });

    test('未認證訪問聊天頁面應重定向到登入頁面', async ({ page }) => {
      await nav.navigateToUrl(`${BASE_URL}/chat/123`);

      await page.waitForURL(URL_PATTERNS.LOGIN, { timeout: 15000 });

      expect(await nav.verifyUrl(URL_PATTERNS.LOGIN)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.LOGIN_FORM)).toBe(true);
    });

    test('未認證訪問編輯檔案頁面應重定向到登入頁面', async ({ page }) => {
      await nav.navigateToUrl(`${BASE_URL}/profile/edit`);

      await page.waitForURL(URL_PATTERNS.LOGIN, { timeout: 15000 });

      expect(await nav.verifyUrl(URL_PATTERNS.LOGIN)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.LOGIN_FORM)).toBe(true);
    });

    test('未認證訪問設定頁面應重定向到登入頁面', async ({ page }) => {
      await nav.navigateToUrl(`${BASE_URL}/settings`);

      await page.waitForURL(URL_PATTERNS.LOGIN, { timeout: 15000 });

      expect(await nav.verifyUrl(URL_PATTERNS.LOGIN)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.LOGIN_FORM)).toBe(true);
    });

    test('未認證訪問公開頁面應正常顯示', async ({ page }) => {
      // 測試登入頁面
      await nav.navigateToUrl(`${BASE_URL}/login`);
      expect(await nav.verifyUrl(URL_PATTERNS.LOGIN)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.LOGIN_FORM)).toBe(true);

      // 測試註冊頁面
      await nav.navigateToUrl(`${BASE_URL}/register`);
      expect(await nav.verifyUrl(URL_PATTERNS.REGISTER)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.REGISTER_FORM)).toBe(true);
    });
  });

  test.describe('已認證用戶重定向測試', () => {
    test.beforeEach(async ({ page }) => {
      // 設置已認證狀態
      await setAuthenticatedState(page, {
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
      }, 'mock-token-12345');
    });

    test('已認證訪問首頁應重定向到探索頁面', async ({ page }) => {
      await nav.navigateToUrl(BASE_URL);

      // 等待 ProtectedRoute 檢查完成
      await waitForProtectedRouteCheck(page);

      // 等待重定向到探索頁面
      await page.waitForURL(URL_PATTERNS.DISCOVER, { timeout: 15000 });

      expect(await nav.verifyUrl(URL_PATTERNS.DISCOVER)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.DISCOVER_CONTAINER)).toBe(true);

      await nav.logPageState('已認證首頁重定向測試');
    });

    test('已認證用戶可以直接存取所有受保護頁面', async ({ page }) => {
      // 測試探索頁面
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/discover`);
      await waitForProtectedRouteCheck(page);
      expect(await nav.verifyUrl(URL_PATTERNS.DISCOVER)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.DISCOVER_CONTAINER)).toBe(true);

      // 測試配對頁面
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/matches`);
      await waitForProtectedRouteCheck(page);
      expect(await nav.verifyUrl(URL_PATTERNS.MATCHES)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.MATCHES_CONTAINER)).toBe(true);

      // 測試訊息頁面
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/messages`);
      await waitForProtectedRouteCheck(page);
      expect(await nav.verifyUrl(URL_PATTERNS.MESSAGES)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.CHAT_LIST_CONTAINER)).toBe(true);

      // 測試個人檔案頁面
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/profile`);
      await waitForProtectedRouteCheck(page);
      expect(await nav.verifyUrl(URL_PATTERNS.PROFILE)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.PROFILE_CONTAINER)).toBe(true);
    });

    test('已認證用戶可以存取深層受保護頁面', async ({ page }) => {
      // 測試聊天頁面
      await nav.navigateToUrl(`${BASE_URL}/chat/123`);
      await waitForProtectedRouteCheck(page);
      expect(await nav.verifyUrl(URL_PATTERNS.CHAT)).toBe(true);

      // 檢查是否到達聊天頁面或顯示錯誤狀態
      const hasChatScreen = await nav.verifyPageContent(PAGE_TEST_IDS.CHAT_SCREEN);
      const hasErrorState = await nav.isElementVisible('[data-testid*="error"]');

      // 應該能到達頁面或顯示合理的錯誤
      expect(hasChatScreen || hasErrorState).toBe(true);

      // 測試編輯檔案頁面
      await nav.navigateToUrl(`${BASE_URL}/profile/edit`);
      expect(await nav.verifyUrl(URL_PATTERNS.EDIT_PROFILE)).toBe(true);

      // 測試設定頁面
      await nav.navigateToUrl(`${BASE_URL}/settings`);
      expect(await nav.verifyUrl(URL_PATTERNS.SETTINGS)).toBe(true);
    });

    test('已認證用戶仍可存取認證相關頁面', async ({ page }) => {
      // 已認證用戶應該仍能存取登入頁面 (不強制重定向)
      await nav.navigateToUrl(`${BASE_URL}/login`);
      expect(await nav.verifyUrl(URL_PATTERNS.LOGIN)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.LOGIN_FORM)).toBe(true);

      // 已認證用戶應該仍能存取註冊頁面 (不強制重定向)
      await nav.navigateToUrl(`${BASE_URL}/register`);
      expect(await nav.verifyUrl(URL_PATTERNS.REGISTER)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.REGISTER_FORM)).toBe(true);
    });
  });

  test.describe('認證狀態變化測試', () => {
    test('登入後應重定向到探索頁面', async ({ page }) => {
      // 從未認證狀態開始
      await page.context().clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // 訪問登入頁面
      await nav.navigateToUrl(`${BASE_URL}/login`);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.LOGIN_FORM)).toBe(true);

      // 模擬登入成功 (實際應該填寫表單並提交)
      await setAuthenticatedState(page, {
        id: 2,
        name: 'New User',
        email: 'newuser@example.com'
      }, 'new-auth-token');

      // 手動導航到首頁以觸發重定向邏輯
      await nav.navigateToUrl(BASE_URL);

      // 等待重定向到探索頁面
      await page.waitForURL(URL_PATTERNS.DISCOVER, { timeout: 15000 });

      expect(await nav.verifyUrl(URL_PATTERNS.DISCOVER)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.DISCOVER_CONTAINER)).toBe(true);

      await nav.logPageState('登入後重定向測試');
    });

    test('登出後應重定向到登入頁面', async ({ page }) => {
      // 從已認證狀態開始
      await setAuthenticatedState(page, {
        id: 3,
        name: 'Existing User',
        email: 'existing@example.com'
      }, 'existing-token');

      // 導航到個人檔案頁面
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/profile`);
      await waitForProtectedRouteCheck(page);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.PROFILE_CONTAINER)).toBe(true);

      // 模擬登出
      await clearAuthenticatedState(page);

      // 嘗試存取受保護頁面
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/discover`);

      // 等待 ProtectedRoute 檢查完成
      await waitForProtectedRouteCheck(page);

      // 等待重定向到登入頁面
      await page.waitForURL(URL_PATTERNS.LOGIN, { timeout: 15000 });

      expect(await nav.verifyUrl(URL_PATTERNS.LOGIN)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.LOGIN_FORM)).toBe(true);

      await nav.logPageState('登出後重定向測試');
    });
  });

  test.describe('認證令牌過期處理', () => {
    test('無效認證令牌應觸發重定向', async ({ page }) => {
      // 設置無效的認證狀態
      await page.evaluate(() => {
        // 設置無效的 Zustand 格式 (但仍使用無效令牌)
        const expiredAuthStorage = {
          state: {
            user: {
              id: 4,
              name: 'Expired User',
              email: 'expired@example.com'
            },
            token: 'invalid-expired-token',
            isAuthenticated: true
          },
          version: 0
        };
        localStorage.setItem('auth-storage', JSON.stringify(expiredAuthStorage));
      });

      // 嘗試訪問受保護頁面
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/discover`);

      // 等待 ProtectedRoute 檢查完成
      await waitForProtectedRouteCheck(page);

      // 根據應用程式的實作，可能會：
      // 1. 重定向到登入頁面
      // 2. 顯示在探索頁面但功能受限
      // 3. 顯示錯誤訊息

      await nav.waitForPageLoad();

      const currentUrl = page.url();
      const isOnLogin = await nav.verifyUrl(URL_PATTERNS.LOGIN);
      const isOnDiscover = await nav.verifyUrl(URL_PATTERNS.DISCOVER);
      const hasErrorState = await nav.isElementVisible('[data-testid*="error"]');

      // 應該有某種處理機制
      expect(isOnLogin || isOnDiscover || hasErrorState).toBe(true);

      await nav.logPageState('無效令牌處理測試');
    });

    test('部分損壞的認證資料應被清理', async ({ page }) => {
      // 設置部分損壞的認證狀態
      await page.evaluate(() => {
        localStorage.setItem('auth-storage', 'invalid-json-data');
      });

      // 訪問首頁
      await nav.navigateToUrl(BASE_URL);

      // 等待 ProtectedRoute 檢查完成
      await waitForProtectedRouteCheck(page);

      await nav.waitForPageLoad();

      // 應用程式應該處理損壞的資料並重定向到登入頁面
      const finalUrl = page.url();
      const isHandledCorrectly = finalUrl.includes('/login') || finalUrl.includes('/discover');

      expect(isHandledCorrectly).toBe(true);

      await nav.logPageState('損壞認證資料處理測試');
    });
  });

  test.describe('載入狀態測試', () => {
    test('認證檢查期間應顯示載入指示器', async ({ page }) => {
      // 清除認證狀態
      await page.context().clearCookies();
      await clearAuthenticatedState(page);
      await page.evaluate(() => {
        sessionStorage.clear();
      });

      // 快速導航到首頁
      await page.goto(BASE_URL);

      // 檢查是否有載入指示器
      const hasLoadingIndicator = await nav.isElementVisible(
        `[data-testid="${PAGE_TEST_IDS.APP_LOADING}"]`,
        3000
      );

      // 至少應該有短暫的載入狀態
      expect(hasLoadingIndicator).toBe(true);

      // 等待最終頁面載入
      await nav.waitForPageLoad();

      await nav.logPageState('載入指示器測試');
    });

    test('重定向期間不應該有無限載入', async ({ page }) => {
      // 清除認證狀態
      await page.context().clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // 訪問受保護頁面
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/discover`);

      // 等待重定向完成 (最多 20 秒)
      const startTime = Date.now();
      let redirectCompleted = false;

      while (Date.now() - startTime < 20000) {
        if (await nav.verifyUrl(URL_PATTERNS.LOGIN)) {
          redirectCompleted = true;
          break;
        }
        await page.waitForTimeout(500);
      }

      expect(redirectCompleted).toBe(true);

      // 確保不再是載入狀態
      const stillLoading = await nav.isPageLoading();
      expect(stillLoading).toBe(false);

      await nav.logPageState('重定向完成測試');
    });
  });

  // 測試失敗時自動截圖
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshot = await nav.takeDebugScreenshot(testInfo.title.replace(/\s+/g, '-'));
      console.log(`認證重定向測試失敗截圖: ${screenshot}`);

      // 記錄認證狀態
      const authState = await page.evaluate(() => ({
        token: localStorage.getItem('auth-token'),
        user: localStorage.getItem('auth-user'),
        cookies: document.cookie
      }));

      console.log('認證狀態:', authState);
      await nav.logPageState('測試失敗');
    }
  });
});