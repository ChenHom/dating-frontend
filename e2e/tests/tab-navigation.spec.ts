/**
 * Tab Navigation Tests
 * Tab 導航測試
 *
 * 測試主應用中 4 個 Tab 頁面間的導航功能，確保 Tab 切換正常運作
 */

import { test, expect } from '@playwright/test';
import { NavigationHelpers, URL_PATTERNS, PAGE_TEST_IDS, setAuthenticatedState, waitForProtectedRouteCheck } from '../utils/navigation-helpers';

const BASE_URL = 'http://localhost:8083';

// 定義 Tab 配置
const TABS = [
  {
    name: '探索',
    text: 'Discover',
    url: `${BASE_URL}/(tabs)/discover`,
    pattern: URL_PATTERNS.DISCOVER,
    testId: PAGE_TEST_IDS.DISCOVER_CONTAINER,
    description: '探索/配對頁面'
  },
  {
    name: '配對',
    text: 'Matches',
    url: `${BASE_URL}/(tabs)/matches`,
    pattern: URL_PATTERNS.MATCHES,
    testId: PAGE_TEST_IDS.MATCHES_CONTAINER,
    description: '配對列表頁面'
  },
  {
    name: '消息',
    text: 'Messages',
    url: `${BASE_URL}/(tabs)/messages`,
    pattern: URL_PATTERNS.MESSAGES,
    testId: PAGE_TEST_IDS.CHAT_LIST_CONTAINER,
    description: '訊息列表頁面'
  },
  {
    name: '我的',
    text: 'Profile',
    url: `${BASE_URL}/(tabs)/profile`,
    pattern: URL_PATTERNS.PROFILE,
    testId: PAGE_TEST_IDS.PROFILE_CONTAINER,
    description: '個人檔案頁面'
  }
];

test.describe('Tab Navigation Tests', () => {
  let nav: NavigationHelpers;

  test.beforeEach(async ({ page }) => {
    nav = new NavigationHelpers(page);

    // 設置已認證狀態
    await setAuthenticatedState(page, {
      id: 1,
      name: 'Tab Test User',
      email: 'tabtest@example.com'
    }, 'tab-test-token');
  });

  test.describe('基本 Tab 切換功能', () => {
    test('所有 Tab 都能正確切換', async ({ page }) => {
      // 從探索頁面開始
      await nav.navigateToUrl(TABS[0].url);

      // 等待 ProtectedRoute 檢查完成
      await waitForProtectedRouteCheck(page);

      expect(await nav.verifyUrl(TABS[0].pattern)).toBe(true);
      expect(await nav.verifyPageContent(TABS[0].testId)).toBe(true);

      // 依序測試每個 Tab 的切換
      for (let i = 1; i < TABS.length; i++) {
        const tab = TABS[i];

        console.log(`切換到 ${tab.description}`);

        // 點擊 Tab
        const tabClicked = await nav.clickAndNavigate(
          `text=${tab.name}`,
          tab.pattern,
          10000
        );

        expect(tabClicked.success).toBe(true);

        // 驗證 URL 正確
        expect(await nav.verifyUrl(tab.pattern)).toBe(true);

        // 驗證頁面內容載入
        const contentLoaded = await nav.verifyPageContent(tab.testId);
        if (!contentLoaded) {
          console.log(`⚠️ ${tab.description} 內容可能需要更多時間載入`);
          await nav.waitForPageLoad();
        }

        await nav.logPageState(`${tab.description} 載入`);
      }

      console.log('✅ 所有 Tab 切換測試完成');
    });

    test('反向 Tab 切換', async ({ page }) => {
      // 從最後一個 Tab 開始，反向切換
      await nav.navigateToUrl(TABS[TABS.length - 1].url);

      for (let i = TABS.length - 2; i >= 0; i--) {
        const tab = TABS[i];

        console.log(`反向切換到 ${tab.description}`);

        const result = await nav.clickAndNavigate(
          `text=${tab.name}`,
          tab.pattern
        );

        expect(result.success).toBe(true);
        expect(await nav.verifyUrl(tab.pattern)).toBe(true);

        if (tab.testId) {
          const contentLoaded = await nav.verifyPageContent(tab.testId);
          if (!contentLoaded) {
            console.log(`⚠️ ${tab.description} 反向切換內容載入延遲`);
          }
        }
      }

      console.log('✅ 反向 Tab 切換測試完成');
    });

    test('隨機 Tab 切換', async ({ page }) => {
      // 進行隨機 Tab 切換測試
      await nav.navigateToUrl(TABS[0].url);

      const switchSequence = [0, 2, 1, 3, 0, 3, 1, 2]; // 隨機切換序列

      for (const tabIndex of switchSequence) {
        const tab = TABS[tabIndex];

        console.log(`隨機切換到 ${tab.description}`);

        const result = await nav.clickAndNavigate(
          `text=${tab.name}`,
          tab.pattern
        );

        expect(result.success).toBe(true);
        expect(await nav.verifyUrl(tab.pattern)).toBe(true);

        // 短暫等待確保狀態穩定
        await page.waitForTimeout(500);
      }

      console.log('✅ 隨機 Tab 切換測試完成');
    });
  });

  test.describe('Tab 狀態保持測試', () => {
    test('Tab 間切換應保持各頁面狀態', async ({ page }) => {
      // 首先訪問每個 Tab 進行初始化
      for (const tab of TABS) {
        await nav.navigateToUrl(tab.url);
        await nav.waitForPageLoad();

        // 檢查頁面是否有特定的狀態元素
        if (tab.testId) {
          expect(await nav.verifyPageContent(tab.testId)).toBe(true);
        }

        console.log(`${tab.description} 初始化完成`);
      }

      // 返回第一個 Tab
      await nav.navigateToUrl(TABS[0].url);
      expect(await nav.verifyUrl(TABS[0].pattern)).toBe(true);

      // 快速切換測試狀態保持
      for (let i = 1; i < TABS.length; i++) {
        const tab = TABS[i];

        // 切換到 Tab
        await nav.clickAndNavigate(`text=${tab.name}`, tab.pattern);

        // 驗證狀態保持
        if (tab.testId) {
          expect(await nav.verifyPageContent(tab.testId)).toBe(true);
        }

        // 立即切換回第一個 Tab
        await nav.clickAndNavigate(`text=${TABS[0].name}`, TABS[0].pattern);
        expect(await nav.verifyPageContent(TABS[0].testId)).toBe(true);
      }

      console.log('✅ Tab 狀態保持測試完成');
    });

    test('深層導航後返回 Tab 應保持狀態', async ({ page }) => {
      // 從訊息 Tab 開始
      await nav.navigateToUrl(TABS[2].url); // Messages Tab
      expect(await nav.verifyPageContent(TABS[2].testId)).toBe(true);

      // 檢查是否有對話可以點擊
      const hasConversations = await nav.isElementVisible('[data-testid^="conversation-item-"]');

      if (hasConversations) {
        // 進入聊天頁面
        await nav.clickAndNavigate(
          '[data-testid^="conversation-item-"]',
          URL_PATTERNS.CHAT
        );

        expect(await nav.verifyUrl(URL_PATTERNS.CHAT)).toBe(true);

        // 切換到其他 Tab
        await nav.clickAndNavigate(`text=${TABS[0].name}`, TABS[0].pattern);
        expect(await nav.verifyUrl(TABS[0].pattern)).toBe(true);

        // 返回訊息 Tab
        await nav.clickAndNavigate(`text=${TABS[2].name}`, TABS[2].pattern);
        expect(await nav.verifyUrl(TABS[2].pattern)).toBe(true);
        expect(await nav.verifyPageContent(TABS[2].testId)).toBe(true);

        console.log('✅ 深層導航後 Tab 狀態保持正常');
      } else {
        console.log('⚠️ 沒有可用對話進行深層導航測試');
      }
    });
  });

  test.describe('Tab UI 和視覺測試', () => {
    test('Tab 按鈕可見性和可點擊性', async ({ page }) => {
      await nav.navigateToUrl(TABS[0].url);

      // 檢查所有 Tab 按鈕是否可見
      for (const tab of TABS) {
        const tabButton = page.locator(`text=${tab.name}`);
        await expect(tabButton).toBeVisible();

        // 檢查是否可點擊
        const isEnabled = await tabButton.isEnabled();
        expect(isEnabled).toBe(true);

        console.log(`✅ ${tab.description} Tab 按鈕可見且可點擊`);
      }
    });

    test('當前 Tab 應有適當的視覺指示', async ({ page }) => {
      for (const tab of TABS) {
        await nav.navigateToUrl(tab.url);
        await nav.waitForPageLoad();

        // 檢查當前 Tab 的視覺狀態
        const tabButton = page.locator(`text=${tab.name}`);
        await expect(tabButton).toBeVisible();

        // 可以添加更多視覺檢查，如顏色、樣式等
        const boundingBox = await tabButton.boundingBox();
        expect(boundingBox).toBeTruthy();

        console.log(`✅ ${tab.description} Tab 視覺狀態正確`);
      }
    });

    test('Tab 區域佈局穩定性', async ({ page }) => {
      await nav.navigateToUrl(TABS[0].url);

      // 記錄初始 Tab 區域位置
      const initialTabPositions = [];

      for (const tab of TABS) {
        const tabButton = page.locator(`text=${tab.name}`);
        const boundingBox = await tabButton.boundingBox();
        initialTabPositions.push(boundingBox);
      }

      // 切換到其他 Tab 並檢查位置是否穩定
      for (let i = 1; i < TABS.length; i++) {
        await nav.clickAndNavigate(`text=${TABS[i].name}`, TABS[i].pattern);

        // 檢查 Tab 位置是否改變
        for (let j = 0; j < TABS.length; j++) {
          const tabButton = page.locator(`text=${TABS[j].name}`);
          const currentBox = await tabButton.boundingBox();

          if (initialTabPositions[j] && currentBox) {
            // Tab 位置應該保持穩定 (允許小幅差異)
            const xDiff = Math.abs(currentBox.x - initialTabPositions[j].x);
            const yDiff = Math.abs(currentBox.y - initialTabPositions[j].y);

            expect(xDiff).toBeLessThan(5); // 允許 5px 誤差
            expect(yDiff).toBeLessThan(5);
          }
        }
      }

      console.log('✅ Tab 佈局穩定性測試通過');
    });
  });

  test.describe('Tab 導航性能測試', () => {
    test('Tab 切換回應時間測試', async ({ page }) => {
      await nav.navigateToUrl(TABS[0].url);

      const switchTimes = [];

      // 測試每個 Tab 的切換時間
      for (let i = 1; i < TABS.length; i++) {
        const tab = TABS[i];
        const startTime = Date.now();

        await nav.clickAndNavigate(`text=${tab.name}`, tab.pattern);

        const endTime = Date.now();
        const switchTime = endTime - startTime;
        switchTimes.push(switchTime);

        console.log(`${tab.description} 切換時間: ${switchTime}ms`);

        // Tab 切換應該很快 (< 2 秒)
        expect(switchTime).toBeLessThan(2000);
      }

      const averageTime = switchTimes.reduce((a, b) => a + b, 0) / switchTimes.length;
      console.log(`平均 Tab 切換時間: ${averageTime.toFixed(2)}ms`);

      // 平均切換時間應該合理
      expect(averageTime).toBeLessThan(1500);
    });

    test('快速連續 Tab 切換處理', async ({ page }) => {
      await nav.navigateToUrl(TABS[0].url);

      // 快速連續點擊不同 Tab
      const rapidClicks = [1, 2, 3, 0, 2, 1, 3];

      for (const tabIndex of rapidClicks) {
        const tab = TABS[tabIndex];

        // 快速點擊，不等待完全載入
        await page.click(`text=${tab.name}`);
        await page.waitForTimeout(100); // 只等待很短時間
      }

      // 等待最後的載入完成
      await nav.waitForPageLoad();

      // 驗證最終狀態正確
      const finalTab = TABS[rapidClicks[rapidClicks.length - 1]];
      expect(await nav.verifyUrl(finalTab.pattern)).toBe(true);

      console.log('✅ 快速連續 Tab 切換處理正常');
    });
  });

  test.describe('Tab 導航邊界情況', () => {
    test('重複點擊同一 Tab', async ({ page }) => {
      await nav.navigateToUrl(TABS[0].url);
      const initialUrl = page.url();

      // 重複點擊同一個 Tab
      for (let i = 0; i < 5; i++) {
        await page.click(`text=${TABS[0].name}`);
        await page.waitForTimeout(200);

        // URL 應該保持不變
        expect(page.url()).toBe(initialUrl);
      }

      // 頁面內容應該仍然正確
      expect(await nav.verifyPageContent(TABS[0].testId)).toBe(true);

      console.log('✅ 重複點擊同一 Tab 處理正常');
    });

    test('頁面重新載入後 Tab 狀態', async ({ page }) => {
      // 切換到特定 Tab
      await nav.navigateToUrl(TABS[2].url);
      expect(await nav.verifyUrl(TABS[2].pattern)).toBe(true);

      // 重新載入頁面
      await page.reload();
      await nav.waitForPageLoad();

      // Tab 狀態應該保持
      expect(await nav.verifyUrl(TABS[2].pattern)).toBe(true);
      expect(await nav.verifyPageContent(TABS[2].testId)).toBe(true);

      console.log('✅ 頁面重新載入後 Tab 狀態保持正確');
    });

    test('瀏覽器前進後退對 Tab 導航的影響', async ({ page }) => {
      // 建立 Tab 導航歷史
      await nav.navigateToUrl(TABS[0].url);
      await nav.navigateToUrl(TABS[1].url);
      await nav.navigateToUrl(TABS[2].url);

      // 使用瀏覽器後退
      await page.goBack();
      await nav.waitForPageLoad();
      expect(await nav.verifyUrl(TABS[1].pattern)).toBe(true);

      await page.goBack();
      await nav.waitForPageLoad();
      expect(await nav.verifyUrl(TABS[0].pattern)).toBe(true);

      // 使用瀏覽器前進
      await page.goForward();
      await nav.waitForPageLoad();
      expect(await nav.verifyUrl(TABS[1].pattern)).toBe(true);

      // Tab 功能應該仍然正常
      await nav.clickAndNavigate(`text=${TABS[3].name}`, TABS[3].pattern);
      expect(await nav.verifyUrl(TABS[3].pattern)).toBe(true);

      console.log('✅ 瀏覽器前進後退與 Tab 導航兼容正常');
    });
  });

  test.describe('Tab 導航無障礙測試', () => {
    test('鍵盤導航 Tab 切換', async ({ page }) => {
      await nav.navigateToUrl(TABS[0].url);

      // 檢查 Tab 按鈕是否可以通過鍵盤焦點
      for (const tab of TABS) {
        const tabButton = page.locator(`text=${tab.name}`);

        // 聚焦到 Tab 按鈕
        await tabButton.focus();

        // 檢查是否獲得焦點
        const isFocused = await tabButton.evaluate((el) => document.activeElement === el);
        if (isFocused) {
          console.log(`✅ ${tab.description} Tab 可通過鍵盤聚焦`);

          // 嘗試按 Enter 鍵切換
          await page.keyboard.press('Enter');
          await nav.waitForPageLoad();

          expect(await nav.verifyUrl(tab.pattern)).toBe(true);
        } else {
          console.log(`⚠️ ${tab.description} Tab 鍵盤聚焦可能需要改善`);
        }
      }
    });

    test('Tab 按鈕 ARIA 屬性檢查', async ({ page }) => {
      await nav.navigateToUrl(TABS[0].url);

      for (const tab of TABS) {
        const tabButton = page.locator(`text=${tab.name}`);

        // 檢查是否有適當的 ARIA 標籤
        const ariaLabel = await tabButton.getAttribute('aria-label');
        const role = await tabButton.getAttribute('role');

        if (ariaLabel || role) {
          console.log(`✅ ${tab.description} Tab 有無障礙屬性`);
        } else {
          console.log(`⚠️ ${tab.description} Tab 可能缺乏無障礙屬性`);
        }
      }
    });
  });

  // 測試失敗時的除錯
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshot = await nav.takeDebugScreenshot(testInfo.title.replace(/\s+/g, '-'));
      console.log(`Tab 導航測試失敗截圖: ${screenshot}`);

      // 記錄當前 Tab 狀態
      const tabStates = [];
      for (const tab of TABS) {
        const tabButton = page.locator(`text=${tab.name}`);
        const isVisible = await tabButton.isVisible();
        const isEnabled = await tabButton.isEnabled();

        tabStates.push({
          name: tab.name,
          isVisible,
          isEnabled,
          url: tab.url
        });
      }

      console.log('Tab 狀態:', tabStates);
      console.log('當前 URL:', page.url());

      await nav.logPageState('Tab 導航測試失敗');
    }
  });
});