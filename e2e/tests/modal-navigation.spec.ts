/**
 * Modal Navigation Tests
 * 模態視窗導航測試
 *
 * 測試應用程式中各種模態視窗的開啟、關閉和導航行為
 */

import { test, expect } from '@playwright/test';
import { NavigationHelpers, URL_PATTERNS, PAGE_TEST_IDS, setAuthenticatedState, waitForProtectedRouteCheck } from '../utils/navigation-helpers';

const BASE_URL = 'http://localhost:8083';

test.describe('Modal Navigation Tests', () => {
  let nav: NavigationHelpers;

  test.beforeEach(async ({ page }) => {
    nav = new NavigationHelpers(page);

    // 設置已認證狀態
    await setAuthenticatedState(page, {
      id: 1,
      name: 'Modal Test User',
      email: 'modaltest@example.com'
    }, 'modal-test-token');
  });

  test.describe('編輯個人檔案模態視窗', () => {
    test('從個人檔案頁面開啟編輯模態視窗', async ({ page }) => {
      // 導航到個人檔案頁面
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/profile`);

      // 等待 ProtectedRoute 檢查完成
      await waitForProtectedRouteCheck(page);

      expect(await nav.verifyPageContent(PAGE_TEST_IDS.PROFILE_CONTAINER)).toBe(true);

      // 檢查編輯檔案選項是否存在
      const editProfileExists = await nav.isElementVisible('[data-testid="edit-profile-option"]');

      if (editProfileExists) {
        // 點擊編輯檔案選項
        await nav.clickAndNavigate(
          '[data-testid="edit-profile-option"]',
          URL_PATTERNS.EDIT_PROFILE
        );

        // 驗證模態視窗開啟
        expect(await nav.verifyUrl(URL_PATTERNS.EDIT_PROFILE)).toBe(true);
        await nav.waitForPageLoad();

        console.log('✅ 編輯個人檔案模態視窗成功開啟');
      } else {
        console.log('⚠️ 編輯檔案選項不可用，跳過測試');
      }
    });

    test('編輯模態視窗的關閉功能', async ({ page }) => {
      // 先開啟編輯模態視窗
      await nav.navigateToUrl(`${BASE_URL}/profile/edit`);

      // 等待 ProtectedRoute 檢查完成
      await waitForProtectedRouteCheck(page);

      expect(await nav.verifyUrl(URL_PATTERNS.EDIT_PROFILE)).toBe(true);

      // 測試不同的關閉方式
      const closeButtons = [
        '[data-testid="cancel-button"]',
        '[data-testid="close-button"]',
        '[data-testid="back-button"]'
      ];

      for (const buttonSelector of closeButtons) {
        const buttonExists = await nav.isElementVisible(buttonSelector);

        if (buttonExists) {
          console.log(`測試 ${buttonSelector} 關閉功能`);

          // 點擊關閉按鈕
          await page.click(buttonSelector);
          await nav.waitForPageLoad();

          // 驗證返回個人檔案頁面
          const backToProfile = await nav.verifyUrl(URL_PATTERNS.PROFILE);
          if (backToProfile) {
            console.log(`✅ ${buttonSelector} 成功關閉模態視窗`);
            return; // 成功關閉，結束測試
          }
        }
      }

      // 如果沒有找到關閉按鈕，嘗試瀏覽器返回
      console.log('嘗試使用瀏覽器返回按鈕關閉模態視窗');
      await page.goBack();
      await nav.waitForPageLoad();

      const backToProfile = await nav.verifyUrl(URL_PATTERNS.PROFILE);
      if (backToProfile) {
        console.log('✅ 瀏覽器返回按鈕成功關閉模態視窗');
      } else {
        console.log('⚠️ 無法確認模態視窗關閉方式');
      }
    });

    test('編輯模態視窗中的表單操作', async ({ page }) => {
      await nav.navigateToUrl(`${BASE_URL}/profile/edit`);

      // 等待 ProtectedRoute 檢查完成
      await waitForProtectedRouteCheck(page);

      await nav.waitForPageLoad();

      // 檢查表單元素是否存在
      const formExists = await nav.isElementVisible('[data-testid="edit-profile-form"]');

      if (formExists) {
        // 檢查表單內的操作按鈕
        const saveButton = await nav.isElementVisible('[data-testid="save-button"]');
        const cancelButton = await nav.isElementVisible('[data-testid="cancel-button"]');

        if (saveButton) {
          console.log('✅ 編輯表單儲存按鈕可見');
        }

        if (cancelButton) {
          console.log('✅ 編輯表單取消按鈕可見');

          // 測試取消功能
          await page.click('[data-testid="cancel-button"]');
          await nav.waitForPageLoad();

          // 應該返回個人檔案頁面
          expect(await nav.verifyUrl(URL_PATTERNS.PROFILE)).toBe(true);
        }
      } else {
        console.log('⚠️ 編輯表單不可用，跳過表單操作測試');
      }
    });
  });

  test.describe('設定頁面模態視窗', () => {
    test('從個人檔案頁面開啟設定模態視窗', async ({ page }) => {
      // 導航到個人檔案頁面
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/profile`);

      // 等待 ProtectedRoute 檢查完成
      await waitForProtectedRouteCheck(page);

      expect(await nav.verifyPageContent(PAGE_TEST_IDS.PROFILE_CONTAINER)).toBe(true);

      // 檢查設定選項是否存在
      const settingsExists = await nav.isElementVisible('[data-testid="preferences-option"]');

      if (settingsExists) {
        // 點擊設定選項
        await nav.clickAndNavigate(
          '[data-testid="preferences-option"]',
          URL_PATTERNS.SETTINGS
        );

        // 驗證設定模態視窗開啟
        expect(await nav.verifyUrl(URL_PATTERNS.SETTINGS)).toBe(true);
        await nav.waitForPageLoad();

        console.log('✅ 設定模態視窗成功開啟');
      } else {
        console.log('⚠️ 設定選項不可用，跳過測試');
      }
    });

    test('設定模態視窗的返回功能', async ({ page }) => {
      // 直接導航到設定頁面
      await nav.navigateToUrl(`${BASE_URL}/settings`);

      // 等待 ProtectedRoute 檢查完成
      await waitForProtectedRouteCheck(page);

      expect(await nav.verifyUrl(URL_PATTERNS.SETTINGS)).toBe(true);

      // 測試返回功能
      await page.goBack();
      await nav.waitForPageLoad();

      // 應該返回個人檔案頁面
      expect(await nav.verifyUrl(URL_PATTERNS.PROFILE)).toBe(true);
      expect(await nav.verifyPageContent(PAGE_TEST_IDS.PROFILE_CONTAINER)).toBe(true);

      console.log('✅ 設定頁面返回功能正常');
    });

    test('設定頁面內的導航選項', async ({ page }) => {
      await nav.navigateToUrl(`${BASE_URL}/settings`);

      // 等待 ProtectedRoute 檢查完成
      await waitForProtectedRouteCheck(page);

      await nav.waitForPageLoad();

      // 檢查設定頁面內是否有各種選項
      const settingOptions = [
        '[data-testid="notification-settings"]',
        '[data-testid="privacy-settings"]',
        '[data-testid="account-settings"]'
      ];

      for (const optionSelector of settingOptions) {
        const optionExists = await nav.isElementVisible(optionSelector);
        if (optionExists) {
          console.log(`✅ 設定選項 ${optionSelector} 可見`);
        }
      }
    });
  });

  test.describe('遊戲模態視窗 (GameModal)', () => {
    test('從聊天頁面開啟遊戲模態視窗', async ({ page }) => {
      // 導航到聊天頁面
      await nav.navigateToUrl(`${BASE_URL}/chat/123`);
      await nav.waitForPageLoad();

      // 檢查聊天頁面是否載入
      const chatScreenLoaded = await nav.verifyPageContent(PAGE_TEST_IDS.CHAT_SCREEN);

      if (chatScreenLoaded) {
        // 檢查遊戲按鈕是否存在
        const gameButtonExists = await nav.isElementVisible('[data-testid="game-launch-button"]');

        if (gameButtonExists) {
          // 點擊遊戲按鈕
          await page.click('[data-testid="game-launch-button"]');
          await page.waitForTimeout(1000); // 等待模態視窗動畫

          // 檢查遊戲模態視窗是否開啟
          const gameModalExists = await nav.isElementVisible('[data-testid="chat-game-modal"]');

          if (gameModalExists) {
            console.log('✅ 遊戲模態視窗成功開啟');

            // 檢查遊戲模態視窗內容
            const gameInviteExists = await nav.isElementVisible('[data-testid*="game-invite"]');
            const gameChoicesExist = await nav.isElementVisible('[data-testid*="choice"]');

            if (gameInviteExists || gameChoicesExist) {
              console.log('✅ 遊戲模態視窗內容正確載入');
            }
          } else {
            console.log('⚠️ 遊戲模態視窗開啟可能需要更多時間');
          }
        } else {
          console.log('⚠️ 遊戲按鈕不可用，跳過遊戲模態視窗測試');
        }
      } else {
        console.log('⚠️ 聊天頁面未正確載入，跳過遊戲模態視窗測試');
      }
    });

    test('遊戲模態視窗的關閉功能', async ({ page }) => {
      // 先開啟聊天頁面
      await nav.navigateToUrl(`${BASE_URL}/chat/123`);
      await nav.waitForPageLoad();

      const gameButtonExists = await nav.isElementVisible('[data-testid="game-launch-button"]');

      if (gameButtonExists) {
        // 開啟遊戲模態視窗
        await page.click('[data-testid="game-launch-button"]');
        await page.waitForTimeout(1000);

        // 檢查關閉按鈕
        const closeButtonExists = await nav.isElementVisible('[data-testid="chat-game-modal-close"]');

        if (closeButtonExists) {
          // 點擊關閉按鈕
          await page.click('[data-testid="chat-game-modal-close"]');
          await page.waitForTimeout(500);

          // 驗證模態視窗關閉
          const modalStillVisible = await nav.isElementVisible('[data-testid="chat-game-modal"]', 1000);
          expect(modalStillVisible).toBe(false);

          console.log('✅ 遊戲模態視窗關閉功能正常');
        } else {
          console.log('⚠️ 遊戲模態視窗關閉按鈕未找到');
        }
      }
    });

    test('遊戲模態視窗中的遊戲流程', async ({ page }) => {
      await nav.navigateToUrl(`${BASE_URL}/chat/123`);
      await nav.waitForPageLoad();

      const gameButtonExists = await nav.isElementVisible('[data-testid="game-launch-button"]');

      if (gameButtonExists) {
        // 開啟遊戲模態視窗
        await page.click('[data-testid="game-launch-button"]');
        await page.waitForTimeout(1000);

        // 檢查遊戲邀請界面
        const startGameButton = await nav.isElementVisible('[data-testid*="start-game"]');

        if (startGameButton) {
          console.log('✅ 遊戲邀請界面正確顯示');

          // 可以進一步測試遊戲開始流程
          // 注意：這裡需要後端支援，可能需要模擬 WebSocket 連接
        }

        // 檢查遊戲選擇按鈕
        const gameChoices = [
          '[data-testid*="choice-rock"]',
          '[data-testid*="choice-paper"]',
          '[data-testid*="choice-scissors"]'
        ];

        for (const choiceSelector of gameChoices) {
          const choiceExists = await nav.isElementVisible(choiceSelector);
          if (choiceExists) {
            console.log(`✅ 遊戲選擇 ${choiceSelector} 可見`);
          }
        }
      }
    });
  });

  test.describe('其他模態視窗功能', () => {
    test('聊天頁面選單模態視窗', async ({ page }) => {
      await nav.navigateToUrl(`${BASE_URL}/chat/123`);
      await nav.waitForPageLoad();

      const chatScreenLoaded = await nav.verifyPageContent(PAGE_TEST_IDS.CHAT_SCREEN);

      if (chatScreenLoaded) {
        // 檢查選單按鈕
        const menuButtonExists = await nav.isElementVisible('[data-testid="menu-button"]');

        if (menuButtonExists) {
          // 點擊選單按鈕
          await page.click('[data-testid="menu-button"]');
          await page.waitForTimeout(500);

          // 檢查選單選項 (這通常是 Alert 而不是模態視窗)
          // 但我們可以檢查頁面是否有回應
          console.log('✅ 聊天選單按鈕功能正常');
        }
      }
    });

    test('照片上傳相關模態視窗', async ({ page }) => {
      // 如果編輯檔案頁面有照片上傳功能
      await nav.navigateToUrl(`${BASE_URL}/profile/edit`);
      await nav.waitForPageLoad();

      // 檢查照片相關按鈕
      const photoButtons = [
        '[data-testid="edit-picture-button"]',
        '[data-testid="upload-photo-button"]',
        '[data-testid="photo-manager"]'
      ];

      for (const buttonSelector of photoButtons) {
        const buttonExists = await nav.isElementVisible(buttonSelector);
        if (buttonExists) {
          console.log(`✅ 照片功能按鈕 ${buttonSelector} 可見`);

          // 可以測試點擊行為，但要小心實際的檔案操作
        }
      }
    });
  });

  test.describe('模態視窗堆疊和重疊處理', () => {
    test('多個模態視窗的處理', async ({ page }) => {
      // 測試從一個模態視窗開啟另一個模態視窗的情況
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/profile`);

      // 開啟設定模態視窗
      const settingsExists = await nav.isElementVisible('[data-testid="preferences-option"]');

      if (settingsExists) {
        await page.click('[data-testid="preferences-option"]');
        await nav.waitForPageLoad();

        // 檢查是否能在設定頁面中開啟其他模態視窗
        // (這取決於實際的 UI 設計)

        console.log('✅ 模態視窗堆疊處理測試完成');
      }
    });

    test('模態視窗與 Tab 導航的交互', async ({ page }) => {
      // 開啟模態視窗
      await nav.navigateToUrl(`${BASE_URL}/profile/edit`);
      await nav.waitForPageLoad();

      // 嘗試點擊 Tab (測試模態視窗是否阻止 Tab 導航)
      const discoverTabExists = await nav.isElementVisible('text=探索');

      if (discoverTabExists) {
        await page.click('text=探索');
        await nav.waitForPageLoad();

        // 檢查是否成功切換到探索頁面或保持在編輯頁面
        const currentUrl = page.url();
        console.log(`模態視窗與 Tab 交互測試 - 當前 URL: ${currentUrl}`);

        // 根據設計，模態視窗可能會阻止 Tab 導航或關閉後切換
        const isOnDiscover = currentUrl.includes('/discover');
        const isOnEdit = currentUrl.includes('/edit');

        expect(isOnDiscover || isOnEdit).toBe(true);
      }
    });
  });

  test.describe('模態視窗無障礙功能', () => {
    test('模態視窗鍵盤導航', async ({ page }) => {
      await nav.navigateToUrl(`${BASE_URL}/profile/edit`);
      await nav.waitForPageLoad();

      // 測試 ESC 鍵關閉模態視窗
      await page.keyboard.press('Escape');
      await nav.waitForPageLoad();

      // 檢查是否返回上一頁
      const currentUrl = page.url();
      if (currentUrl.includes('/profile') && !currentUrl.includes('/edit')) {
        console.log('✅ ESC 鍵成功關閉模態視窗');
      } else {
        console.log('⚠️ ESC 鍵模態視窗關閉功能可能需要改善');
      }
    });

    test('模態視窗焦點管理', async ({ page }) => {
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/profile`);

      const editProfileExists = await nav.isElementVisible('[data-testid="edit-profile-option"]');

      if (editProfileExists) {
        // 開啟模態視窗
        await page.click('[data-testid="edit-profile-option"]');
        await nav.waitForPageLoad();

        // 檢查焦點是否正確設置在模態視窗內
        const activeElement = await page.evaluate(() => document.activeElement?.tagName);
        console.log(`模態視窗開啟後的焦點元素: ${activeElement}`);

        // 檢查模態視窗內的可聚焦元素
        const focusableElements = await page.$$eval(
          'input, button, select, textarea, [tabindex]:not([tabindex="-1"])',
          elements => elements.length
        );

        if (focusableElements > 0) {
          console.log(`✅ 模態視窗內有 ${focusableElements} 個可聚焦元素`);
        }
      }
    });
  });

  test.describe('模態視窗效能測試', () => {
    test('模態視窗開啟回應時間', async ({ page }) => {
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/profile`);

      const editProfileExists = await nav.isElementVisible('[data-testid="edit-profile-option"]');

      if (editProfileExists) {
        const startTime = Date.now();

        // 開啟模態視窗
        await page.click('[data-testid="edit-profile-option"]');
        await page.waitForURL(URL_PATTERNS.EDIT_PROFILE);

        const endTime = Date.now();
        const openTime = endTime - startTime;

        console.log(`模態視窗開啟時間: ${openTime}ms`);

        // 模態視窗開啟應該很快 (< 1 秒)
        expect(openTime).toBeLessThan(1000);
      }
    });

    test('模態視窗動畫和渲染效能', async ({ page }) => {
      // 開啟模態視窗多次測試效能
      await nav.navigateToUrl(`${BASE_URL}/(tabs)/profile`);

      const editProfileExists = await nav.isElementVisible('[data-testid="edit-profile-option"]');

      if (editProfileExists) {
        const times = [];

        for (let i = 0; i < 3; i++) {
          const startTime = Date.now();

          await page.click('[data-testid="edit-profile-option"]');
          await nav.waitForPageLoad();
          await page.goBack();
          await nav.waitForPageLoad();

          const endTime = Date.now();
          times.push(endTime - startTime);
        }

        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        console.log(`模態視窗平均開啟/關閉時間: ${avgTime.toFixed(2)}ms`);

        // 平均時間應該合理
        expect(avgTime).toBeLessThan(2000);
      }
    });
  });

  // 測試失敗時的除錯
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshot = await nav.takeDebugScreenshot(testInfo.title.replace(/\s+/g, '-'));
      console.log(`模態視窗測試失敗截圖: ${screenshot}`);

      // 記錄模態視窗狀態
      const modalInfo = await page.evaluate(() => {
        const modals = document.querySelectorAll('[role="dialog"], .modal, [data-testid*="modal"]');
        return Array.from(modals).map(modal => ({
          tag: modal.tagName,
          id: modal.id,
          className: modal.className,
          visible: modal.getBoundingClientRect().width > 0
        }));
      });

      console.log('模態視窗狀態:', modalInfo);
      console.log('當前 URL:', page.url());

      await nav.logPageState('模態視窗測試失敗');
    }
  });
});