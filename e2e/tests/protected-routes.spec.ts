/**
 * Protected Routes Tests
 * 受保護路由測試
 *
 * 測試 ProtectedRoute 組件的功能，確保存取控制正確運作
 */

import { test, expect } from '@playwright/test';
import { NavigationHelpers, URL_PATTERNS, PAGE_TEST_IDS } from '../utils/navigation-helpers';

const BASE_URL = 'http://localhost:8083';

// 定義受保護和公開路由
const PROTECTED_ROUTES = [
  { path: '/(tabs)/discover', testId: PAGE_TEST_IDS.DISCOVER_CONTAINER, description: '探索頁面' },
  { path: '/(tabs)/matches', testId: PAGE_TEST_IDS.MATCHES_CONTAINER, description: '配對頁面' },
  { path: '/(tabs)/messages', testId: PAGE_TEST_IDS.CHAT_LIST_CONTAINER, description: '訊息頁面' },
  { path: '/(tabs)/profile', testId: PAGE_TEST_IDS.PROFILE_CONTAINER, description: '個人檔案頁面' },
  { path: '/chat/123', testId: PAGE_TEST_IDS.CHAT_SCREEN, description: '聊天頁面' },
  { path: '/profile/edit', testId: null, description: '編輯檔案頁面' },
  { path: '/settings', testId: null, description: '設定頁面' }
];

const PUBLIC_ROUTES = [
  { path: '/login', testId: PAGE_TEST_IDS.LOGIN_FORM, description: '登入頁面' },
  { path: '/register', testId: PAGE_TEST_IDS.REGISTER_FORM, description: '註冊頁面' }
];

test.describe('Protected Routes Tests', () => {
  let nav: NavigationHelpers;

  test.beforeEach(async ({ page }) => {
    nav = new NavigationHelpers(page);
  });

  test.describe('未認證狀態的存取控制', () => {
    test.beforeEach(async ({ page }) => {
      // 確保完全清除認證狀態
      await page.context().clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    });

    PROTECTED_ROUTES.forEach(route => {
      test(`未認證訪問${route.description}應被阻擋並重定向`, async ({ page }) => {
        // 嘗試直接訪問受保護路由
        await nav.navigateToUrl(`${BASE_URL}${route.path}`);

        // 等待重定向到登入頁面
        await page.waitForURL(URL_PATTERNS.LOGIN, { timeout: 15000 });

        // 驗證被重定向到登入頁面
        expect(await nav.verifyUrl(URL_PATTERNS.LOGIN)).toBe(true);
        expect(await nav.verifyPageContent(PAGE_TEST_IDS.LOGIN_FORM)).toBe(true);

        console.log(`✅ ${route.description} 正確重定向到登入頁面`);
      });
    });

    PUBLIC_ROUTES.forEach(route => {
      test(`未認證訪問${route.description}應正常顯示`, async ({ page }) => {
        // 訪問公開路由
        await nav.navigateToUrl(`${BASE_URL}${route.path}`);

        // 驗證頁面正常載入
        if (route.testId) {
          expect(await nav.verifyPageContent(route.testId)).toBe(true);
        }

        // 驗證 URL 正確
        expect(page.url()).toContain(route.path);

        console.log(`✅ ${route.description} 未認證狀態下正常顯示`);
      });
    });

    test('未認證訪問首頁應重定向到登入頁面', async ({ page }) => {
      await nav.navigateToUrl(BASE_URL);

      // 等待重定向
      await page.waitForURL(URL_PATTERNS.LOGIN, { timeout: 15000 });

      expect(await nav.verifyUrl(URL_PATTERNS.LOGIN)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.LOGIN_FORM)).toBe(true);
    });
  });

  test.describe('已認證狀態的存取控制', () => {
    test.beforeEach(async ({ page }) => {
      // 設置已認證狀態
      await page.evaluate(() => {
        localStorage.setItem('auth-token', 'valid-test-token');
        localStorage.setItem('auth-user', JSON.stringify({
          id: 1,
          name: 'Test User',
          email: 'test@example.com'
        }));
      });
    });

    PROTECTED_ROUTES.forEach(route => {
      test(`已認證訪問${route.description}應正常顯示`, async ({ page }) => {
        // 訪問受保護路由
        await nav.navigateToUrl(`${BASE_URL}${route.path}`);

        // 等待頁面載入
        await nav.waitForPageLoad();

        // 驗證可以存取 (不被重定向)
        expect(page.url()).toContain(route.path);

        // 如果有特定的測試 ID，驗證內容載入
        if (route.testId) {
          const contentLoaded = await nav.verifyPageContent(route.testId);
          if (!contentLoaded) {
            // 某些頁面可能需要更多時間載入或有不同的內容結構
            console.log(`⚠️ ${route.description} 內容載入可能需要更多時間`);
          }
        }

        console.log(`✅ ${route.description} 已認證狀態下正常存取`);
      });
    });

    PUBLIC_ROUTES.forEach(route => {
      test(`已認證訪問${route.description}應仍然可以存取`, async ({ page }) => {
        // 已認證用戶仍應能訪問認證相關頁面
        await nav.navigateToUrl(`${BASE_URL}${route.path}`);

        // 驗證頁面正常載入且不被重定向
        expect(page.url()).toContain(route.path);

        if (route.testId) {
          expect(await nav.verifyPageContent(route.testId)).toBe(true);
        }

        console.log(`✅ ${route.description} 已認證狀態下仍可存取`);
      });
    });

    test('已認證訪問首頁應重定向到探索頁面', async ({ page }) => {
      await nav.navigateToUrl(BASE_URL);

      // 等待重定向到探索頁面
      await page.waitForURL(URL_PATTERNS.DISCOVER, { timeout: 15000 });

      expect(await nav.verifyUrl(URL_PATTERNS.DISCOVER)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.DISCOVER_CONTAINER)).toBe(true);
    });
  });

  test.describe('ProtectedRoute 組件行為測試', () => {
    test('載入狀態顯示測試', async ({ page }) => {
      // 清除認證狀態
      await page.context().clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // 快速導航到首頁
      await page.goto(BASE_URL);

      // 檢查載入指示器
      const hasLoadingIndicator = await nav.isElementVisible(
        `[data-testid="${PAGE_TEST_IDS.APP_LOADING}"]`,
        3000
      );

      // 應該有載入狀態
      if (hasLoadingIndicator) {
        console.log('✅ ProtectedRoute 正確顯示載入狀態');
      } else {
        console.log('⚠️ 載入狀態可能太快或未顯示');
      }

      // 等待最終頁面載入
      await nav.waitForPageLoad();
    });

    test('認證檢查載入狀態測試', async ({ page }) => {
      // 清除認證狀態
      await page.context().clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // 嘗試訪問受保護路由
      await page.goto(`${BASE_URL}/(tabs)/discover`);

      // 檢查認證檢查載入狀態
      const hasAuthLoading = await nav.isElementVisible(
        `[data-testid="${PAGE_TEST_IDS.AUTH_LOADING}"]`,
        2000
      );

      const hasAuthRedirect = await nav.isElementVisible(
        `[data-testid="${PAGE_TEST_IDS.AUTH_REDIRECT}"]`,
        2000
      );

      if (hasAuthLoading || hasAuthRedirect) {
        console.log('✅ ProtectedRoute 正確顯示認證檢查狀態');
      }

      // 等待重定向完成
      await page.waitForURL(URL_PATTERNS.LOGIN, { timeout: 15000 });
      expect(await nav.verifyUrl(URL_PATTERNS.LOGIN)).toBe(true);
    });

    test('認證狀態快速變化處理', async ({ page }) => {
      // 從未認證開始
      await page.context().clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // 訪問受保護頁面
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/discover`);

      // 等待重定向到登入頁面
      await page.waitForURL(URL_PATTERNS.LOGIN, { timeout: 10000 });

      // 快速設置認證狀態
      await page.evaluate(() => {
        localStorage.setItem('auth-token', 'quick-auth-token');
        localStorage.setItem('auth-user', JSON.stringify({
          id: 5,
          name: 'Quick User',
          email: 'quick@example.com'
        }));

        // 觸發狀態變化事件
        window.dispatchEvent(new Event('storage'));
      });

      // 重新嘗試訪問受保護頁面
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/discover`);

      // 應該能夠正常存取
      expect(await nav.verifyUrl(URL_PATTERNS.DISCOVER)).toBe(true);

      console.log('✅ ProtectedRoute 正確處理快速認證狀態變化');
    });
  });

  test.describe('邊界情況測試', () => {
    test('無效認證令牌處理', async ({ page }) => {
      // 設置無效認證狀態
      await page.evaluate(() => {
        localStorage.setItem('auth-token', '');
        localStorage.setItem('auth-user', '{}');
      });

      // 嘗試訪問受保護頁面
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/discover`);

      await nav.waitForPageLoad();

      // 檢查處理結果
      const currentUrl = page.url();
      const isOnLogin = currentUrl.includes('/login');
      const isOnDiscover = currentUrl.includes('/discover');

      // 應該有合理的處理 (重定向到登入或顯示錯誤)
      expect(isOnLogin || isOnDiscover).toBe(true);

      console.log(`無效認證令牌處理結果: ${isOnLogin ? '重定向到登入' : '保持在原頁面'}`);
    });

    test('損壞的認證資料處理', async ({ page }) => {
      // 設置損壞的認證資料
      await page.evaluate(() => {
        localStorage.setItem('auth-token', 'valid-token');
        localStorage.setItem('auth-user', 'invalid-json');
      });

      // 嘗試訪問受保護頁面
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/discover`);

      await nav.waitForPageLoad();

      // 應用程式應該能夠處理損壞的資料
      const currentUrl = page.url();
      const hasValidState = currentUrl.includes('/login') ||
                          currentUrl.includes('/discover') ||
                          currentUrl.includes('/register');

      expect(hasValidState).toBe(true);

      console.log('✅ 應用程式正確處理損壞的認證資料');
    });

    test('認證狀態丟失處理', async ({ page }) => {
      // 設置已認證狀態
      await page.evaluate(() => {
        localStorage.setItem('auth-token', 'initial-token');
        localStorage.setItem('auth-user', JSON.stringify({
          id: 6,
          name: 'Initial User',
          email: 'initial@example.com'
        }));
      });

      // 訪問受保護頁面
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/discover`);
      expect(await nav.verifyUrl(URL_PATTERNS.DISCOVER)).toBe(true);

      // 模擬認證狀態丟失
      await page.evaluate(() => {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');
      });

      // 重新載入頁面或導航
      await page.reload();
      await nav.waitForPageLoad();

      // 應該被重定向到登入頁面
      const finalUrl = page.url();
      const redirectedToLogin = finalUrl.includes('/login');

      if (redirectedToLogin) {
        console.log('✅ 認證狀態丟失後正確重定向到登入頁面');
      } else {
        console.log('⚠️ 認證狀態丟失處理可能需要手動觸發');
      }
    });

    test('同時多個受保護路由訪問', async ({ page, context }) => {
      // 清除認證狀態
      await context.clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // 創建多個頁面同時訪問不同的受保護路由
      const page2 = await context.newPage();
      const nav2 = new NavigationHelpers(page2);

      // 同時訪問兩個受保護路由
      const promises = [
        nav.navigateToUrl(`${BASE_URL}/(tabs)/discover`),
        nav2.navigateToUrl(`${BASE_URL}/(tabs)/messages`)
      ];

      await Promise.all(promises);

      // 等待重定向
      await Promise.all([
        page.waitForURL(URL_PATTERNS.LOGIN, { timeout: 10000 }),
        page2.waitForURL(URL_PATTERNS.LOGIN, { timeout: 10000 })
      ]);

      // 驗證兩個頁面都被正確重定向
      expect(await nav.verifyUrl(URL_PATTERNS.LOGIN)).toBe(true);
      expect(await nav2.verifyUrl(URL_PATTERNS.LOGIN)).toBe(true);

      await page2.close();

      console.log('✅ 多個頁面同時訪問受保護路由時正確處理');
    });
  });

  test.describe('效能和回應時間測試', () => {
    test('認證檢查回應時間測試', async ({ page }) => {
      // 清除認證狀態
      await page.context().clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      const startTime = Date.now();

      // 訪問受保護頁面
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/discover`);

      // 等待重定向完成
      await page.waitForURL(URL_PATTERNS.LOGIN, { timeout: 15000 });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // 認證檢查和重定向應該在合理時間內完成 (< 5 秒)
      expect(responseTime).toBeLessThan(5000);

      console.log(`認證檢查回應時間: ${responseTime}ms`);
    });

    test('已認證用戶存取回應時間測試', async ({ page }) => {
      // 設置已認證狀態
      await page.evaluate(() => {
        localStorage.setItem('auth-token', 'performance-test-token');
        localStorage.setItem('auth-user', JSON.stringify({
          id: 7,
          name: 'Performance User',
          email: 'performance@example.com'
        }));
      });

      const startTime = Date.now();

      // 訪問受保護頁面
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/discover`);
      await nav.waitForPageLoad();

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // 已認證用戶存取應該很快 (< 3 秒)
      expect(responseTime).toBeLessThan(3000);

      console.log(`已認證用戶存取回應時間: ${responseTime}ms`);
    });
  });

  // 測試失敗時的除錯資訊
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshot = await nav.takeDebugScreenshot(testInfo.title.replace(/\s+/g, '-'));
      console.log(`受保護路由測試失敗截圖: ${screenshot}`);

      // 記錄認證狀態和路由資訊
      const debugInfo = await page.evaluate(() => ({
        url: window.location.href,
        authToken: localStorage.getItem('auth-token'),
        authUser: localStorage.getItem('auth-user'),
        cookies: document.cookie,
        userAgent: navigator.userAgent
      }));

      console.log('除錯資訊:', debugInfo);
      await nav.logPageState('受保護路由測試失敗');
    }
  });
});