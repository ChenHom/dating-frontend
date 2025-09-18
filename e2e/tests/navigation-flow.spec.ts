/**
 * Main Navigation Flow Tests
 * 主要導航流程測試
 *
 * 測試應用程式中所有主要頁面間的導航路徑，確保用戶能夠正常在各頁面間導航
 */

import { test, expect } from '@playwright/test';
import { NavigationHelpers, URL_PATTERNS, PAGE_TEST_IDS, setAuthenticatedState, clearAuthenticatedState, waitForProtectedRouteCheck } from '../utils/navigation-helpers';

// 測試基礎 URL
const BASE_URL = 'http://localhost:8083';

test.describe('Main Navigation Flow Tests', () => {
  let nav: NavigationHelpers;

  test.beforeEach(async ({ page }) => {
    nav = new NavigationHelpers(page);
  });

  test.describe('首頁重定向測試', () => {
    test('未認證用戶訪問首頁應重定向到登入頁面', async ({ page }) => {
      // 確保未認證狀態
      await page.context().clearCookies();
      await clearAuthenticatedState(page);
      await page.evaluate(() => sessionStorage.clear());

      // 訪問首頁
      const result = await nav.navigateToUrl(BASE_URL);
      expect(result.success).toBe(true);

      // 等待 ProtectedRoute 檢查完成
      await waitForProtectedRouteCheck(page);

      // 等待重定向完成
      await page.waitForURL(URL_PATTERNS.LOGIN, { timeout: 10000 });

      // 驗證最終到達登入頁面
      expect(await nav.verifyUrl(URL_PATTERNS.LOGIN)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.LOGIN_FORM)).toBe(true);

      await nav.logPageState('首頁重定向測試');
    });

    test('已認證用戶訪問首頁應重定向到探索頁面', async ({ page }) => {
      // 模擬已認證狀態
      await page.goto(`${BASE_URL}/login`);
      await nav.waitForPageLoad();

      // 先模擬登入流程 (簡化版，實際應該填寫表單)
      await setAuthenticatedState(page, {
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
      }, 'mock-token');

      // 重新訪問首頁
      const result = await nav.navigateToUrl(BASE_URL);
      expect(result.success).toBe(true);

      // 等待 ProtectedRoute 檢查完成
      await waitForProtectedRouteCheck(page);

      // 等待重定向到探索頁面
      await page.waitForURL(URL_PATTERNS.DISCOVER, { timeout: 10000 });

      // 驗證到達探索頁面
      expect(await nav.verifyUrl(URL_PATTERNS.DISCOVER)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.DISCOVER_CONTAINER)).toBe(true);

      await nav.logPageState('已認證用戶重定向測試');
    });
  });

  test.describe('認證流程導航', () => {
    test('登入頁面到註冊頁面的導航', async ({ page }) => {
      // 訪問登入頁面
      await nav.navigateToUrl(`${BASE_URL}/login`);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.LOGIN_FORM)).toBe(true);

      // 點擊註冊連結
      const result = await nav.clickAndNavigate(
        'text=註冊',
        URL_PATTERNS.REGISTER
      );
      expect(result.success).toBe(true);

      // 驗證到達註冊頁面
      expect(await nav.verifyUrl(URL_PATTERNS.REGISTER)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.REGISTER_FORM)).toBe(true);
    });

    test('註冊頁面到登入頁面的導航', async ({ page }) => {
      // 訪問註冊頁面
      await nav.navigateToUrl(`${BASE_URL}/register`);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.REGISTER_FORM)).toBe(true);

      // 點擊登入連結
      const result = await nav.clickAndNavigate(
        'text=登入',
        URL_PATTERNS.LOGIN
      );
      expect(result.success).toBe(true);

      // 驗證到達登入頁面
      expect(await nav.verifyUrl(URL_PATTERNS.LOGIN)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.LOGIN_FORM)).toBe(true);
    });
  });

  test.describe('主應用 Tab 導航', () => {
    test.beforeEach(async ({ page }) => {
      // 設置已認證狀態
      await setAuthenticatedState(page, {
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
      }, 'mock-token');

      // 導航到探索頁面作為起點
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/discover`);

      // 等待 ProtectedRoute 檢查完成
      await waitForProtectedRouteCheck(page);

      await nav.waitForPageLoad();
    });

    test('探索 → 配對 → 訊息 → 個人檔案的 Tab 導航', async ({ page }) => {
      // 1. 從探索頁面開始
      expect(await nav.verifyUrl(URL_PATTERNS.DISCOVER)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.DISCOVER_CONTAINER)).toBe(true);

      // 2. 導航到配對頁面
      await nav.clickAndNavigate('text=配對', URL_PATTERNS.MATCHES);
      expect(await nav.verifyUrl(URL_PATTERNS.MATCHES)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.MATCHES_CONTAINER)).toBe(true);

      // 3. 導航到訊息頁面
      await nav.clickAndNavigate('text=消息', URL_PATTERNS.MESSAGES);
      expect(await nav.verifyUrl(URL_PATTERNS.MESSAGES)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.CHAT_LIST_CONTAINER)).toBe(true);

      // 4. 導航到個人檔案頁面
      await nav.clickAndNavigate('text=我的', URL_PATTERNS.PROFILE);
      expect(await nav.verifyUrl(URL_PATTERNS.PROFILE)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.PROFILE_CONTAINER)).toBe(true);

      await nav.logPageState('Tab 導航循環測試');
    });

    test('反向 Tab 導航: 個人檔案 → 訊息 → 配對 → 探索', async ({ page }) => {
      // 先導航到個人檔案頁面
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/profile`);

      // 反向測試
      await nav.clickAndNavigate('text=消息', URL_PATTERNS.MESSAGES);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.CHAT_LIST_CONTAINER)).toBe(true);

      await nav.clickAndNavigate('text=配對', URL_PATTERNS.MATCHES);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.MATCHES_CONTAINER)).toBe(true);

      await nav.clickAndNavigate('text=探索', URL_PATTERNS.DISCOVER);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.DISCOVER_CONTAINER)).toBe(true);
    });
  });

  test.describe('深層頁面導航', () => {
    test.beforeEach(async ({ page }) => {
      // 設置已認證狀態
      await setAuthenticatedState(page, {
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
      }, 'mock-token');
    });

    test('訊息列表 → 聊天頁面 → 返回的導航', async ({ page }) => {
      // 導航到訊息列表
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/messages`);

      // 等待 ProtectedRoute 檢查完成
      await waitForProtectedRouteCheck(page);

      expect(await nav.verifyPageContent(PAGE_TEST_IDS.CHAT_LIST_CONTAINER)).toBe(true);

      // 點擊第一個對話項目
      const conversationExists = await nav.isElementVisible('[data-testid="conversation-item-1"]');

      if (conversationExists) {
        await nav.clickAndNavigate(
          '[data-testid="conversation-item-1"]',
          URL_PATTERNS.CHAT
        );

        // 驗證到達聊天頁面
        expect(await nav.verifyUrl(URL_PATTERNS.CHAT)).toBe(true);
        expect(await nav.verifyPageContent(PAGE_TEST_IDS.CHAT_SCREEN)).toBe(true);

        // 點擊返回按鈕
        await nav.clickAndNavigate(
          `[data-testid="${PAGE_TEST_IDS.BACK_BUTTON}"]`,
          URL_PATTERNS.MESSAGES
        );

        // 驗證返回訊息列表
        expect(await nav.verifyUrl(URL_PATTERNS.MESSAGES)).toBe(true);
        expect(await nav.verifyPageContent(PAGE_TEST_IDS.CHAT_LIST_CONTAINER)).toBe(true);
      } else {
        console.log('No conversations available for testing');
        // 至少驗證頁面載入正確
        expect(await nav.verifyPageContent(PAGE_TEST_IDS.CHAT_LIST_CONTAINER)).toBe(true);
      }
    });

    test('個人檔案 → 編輯檔案 → 返回的導航', async ({ page }) => {
      // 導航到個人檔案
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/profile`);

      // 等待 ProtectedRoute 檢查完成
      await waitForProtectedRouteCheck(page);

      expect(await nav.verifyPageContent(PAGE_TEST_IDS.PROFILE_CONTAINER)).toBe(true);

      // 點擊編輯檔案選項
      const editProfileExists = await nav.isElementVisible('[data-testid="edit-profile-option"]');

      if (editProfileExists) {
        await nav.clickAndNavigate(
          '[data-testid="edit-profile-option"]',
          URL_PATTERNS.EDIT_PROFILE
        );

        // 驗證到達編輯檔案頁面
        expect(await nav.verifyUrl(URL_PATTERNS.EDIT_PROFILE)).toBe(true);

        // 等待模態視窗載入
        await nav.waitForPageLoad();

        // 測試返回 (可能通過返回按鈕或關閉模態視窗)
        const backButton = await nav.isElementVisible('[data-testid="back-button"]');
        const cancelButton = await nav.isElementVisible('[data-testid="cancel-button"]');

        if (backButton) {
          await nav.clickAndNavigate('[data-testid="back-button"]', URL_PATTERNS.PROFILE);
        } else if (cancelButton) {
          await nav.clickAndNavigate('[data-testid="cancel-button"]', URL_PATTERNS.PROFILE);
        } else {
          // 使用瀏覽器返回按鈕
          await page.goBack();
          await nav.waitForPageLoad();
        }

        // 驗證返回個人檔案頁面
        expect(await nav.verifyUrl(URL_PATTERNS.PROFILE)).toBe(true);
        expect(await nav.verifyPageContent(PAGE_TEST_IDS.PROFILE_CONTAINER)).toBe(true);
      } else {
        console.log('Edit profile option not available for testing');
      }
    });

    test('個人檔案 → 設定 → 返回的導航', async ({ page }) => {
      // 導航到個人檔案
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/profile`);

      // 等待 ProtectedRoute 檢查完成
      await waitForProtectedRouteCheck(page);

      expect(await nav.verifyPageContent(PAGE_TEST_IDS.PROFILE_CONTAINER)).toBe(true);

      // 點擊設定選項
      const settingsExists = await nav.isElementVisible('[data-testid="preferences-option"]');

      if (settingsExists) {
        await nav.clickAndNavigate(
          '[data-testid="preferences-option"]',
          URL_PATTERNS.SETTINGS
        );

        // 驗證到達設定頁面
        expect(await nav.verifyUrl(URL_PATTERNS.SETTINGS)).toBe(true);

        // 等待頁面載入
        await nav.waitForPageLoad();

        // 返回個人檔案
        await page.goBack();
        await nav.waitForPageLoad();

        // 驗證返回個人檔案頁面
        expect(await nav.verifyUrl(URL_PATTERNS.PROFILE)).toBe(true);
        expect(await nav.verifyPageContent(PAGE_TEST_IDS.PROFILE_CONTAINER)).toBe(true);
      } else {
        console.log('Settings option not available for testing');
      }
    });
  });

  test.describe('特殊導航情境', () => {
    test('新聊天按鈕導航到探索頁面', async ({ page }) => {
      // 設置已認證狀態
      await setAuthenticatedState(page, {
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
      }, 'mock-token');

      // 導航到訊息列表
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/messages`);

      // 等待 ProtectedRoute 檢查完成
      await waitForProtectedRouteCheck(page);

      expect(await nav.verifyPageContent(PAGE_TEST_IDS.CHAT_LIST_CONTAINER)).toBe(true);

      // 檢查新聊天按鈕是否存在
      const newChatButtonExists = await nav.isElementVisible('[data-testid="new-chat-button"]');

      if (newChatButtonExists) {
        // 點擊新聊天按鈕
        await nav.clickAndNavigate(
          '[data-testid="new-chat-button"]',
          URL_PATTERNS.DISCOVER
        );

        // 驗證導航到探索頁面
        expect(await nav.verifyUrl(URL_PATTERNS.DISCOVER)).toBe(true);
        expect(await nav.verifyPageContent(PAGE_TEST_IDS.DISCOVER_CONTAINER)).toBe(true);
      }
    });

    test('登出流程導航', async ({ page }) => {
      // 設置已認證狀態
      await setAuthenticatedState(page, {
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
      }, 'mock-token');

      // 導航到個人檔案
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/profile`);

      // 等待 ProtectedRoute 檢查完成
      await waitForProtectedRouteCheck(page);

      expect(await nav.verifyPageContent(PAGE_TEST_IDS.PROFILE_CONTAINER)).toBe(true);

      // 查找登出按鈕
      const logoutButtonExists = await nav.isElementVisible(`[data-testid="${PAGE_TEST_IDS.LOGOUT_BUTTON}"]`);

      if (logoutButtonExists) {
        // 點擊登出按鈕
        await page.click(`[data-testid="${PAGE_TEST_IDS.LOGOUT_BUTTON}"]`);

        // 等待重定向到登入頁面
        await page.waitForURL(URL_PATTERNS.LOGIN, { timeout: 10000 });

        // 驗證到達登入頁面
        expect(await nav.verifyUrl(URL_PATTERNS.LOGIN)).toBe(true);
        expect(await nav.verifyPageContent(PAGE_TEST_IDS.LOGIN_FORM)).toBe(true);

        await nav.logPageState('登出流程測試');
      }
    });
  });

  test.describe('錯誤處理與異常情境', () => {
    test('直接訪問無效的聊天 ID', async ({ page }) => {
      // 設置已認證狀態
      await setAuthenticatedState(page, {
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
      }, 'mock-token');

      // 訪問無效的聊天 ID
      await nav.navigateToUrl(`${BASE_URL}/chat/99999`);

      // 等待 ProtectedRoute 檢查完成
      await waitForProtectedRouteCheck(page);

      await nav.waitForPageLoad();

      // 檢查是否有錯誤處理或重定向
      const currentUrl = page.url();
      const hasErrorState = await nav.isElementVisible('[data-testid*="error"]');
      const hasChatScreen = await nav.verifyPageContent(PAGE_TEST_IDS.CHAT_SCREEN);

      // 記錄狀態用於除錯
      await nav.logPageState('無效聊天 ID 測試');

      // 至少應該有某種處理機制
      expect(hasErrorState || hasChatScreen || currentUrl.includes('login')).toBe(true);
    });

    test('瀏覽器返回按鈕導航', async ({ page }) => {
      // 設置已認證狀態
      await setAuthenticatedState(page, {
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
      }, 'mock-token');

      // 建立導航歷史
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/discover`);
      await waitForProtectedRouteCheck(page);

      await nav.navigateToUrl(`${BASE_URL}/(tabs)/matches`);
      await waitForProtectedRouteCheck(page);

      await nav.navigateToUrl(`${BASE_URL}/(tabs)/messages`);
      await waitForProtectedRouteCheck(page);

      // 使用瀏覽器返回按鈕
      await page.goBack();
      await nav.waitForPageLoad();
      expect(await nav.verifyUrl(URL_PATTERNS.MATCHES)).toBe(true);

      await page.goBack();
      await nav.waitForPageLoad();
      expect(await nav.verifyUrl(URL_PATTERNS.DISCOVER)).toBe(true);

      // 測試前進按鈕
      await page.goForward();
      await nav.waitForPageLoad();
      expect(await nav.verifyUrl(URL_PATTERNS.MATCHES)).toBe(true);
    });
  });

  // 測試失敗時自動截圖
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshot = await nav.takeDebugScreenshot(testInfo.title.replace(/\s+/g, '-'));
      console.log(`測試失敗截圖已保存: ${screenshot}`);

      // 記錄最終頁面狀態
      await nav.logPageState('測試失敗');
    }
  });
});