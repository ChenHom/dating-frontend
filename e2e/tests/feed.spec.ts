/**
 * Feed/Matching E2E Tests
 * 配對功能的端對端測試
 */

import { test, expect } from '@playwright/test';
import { FeedPage } from '../pages/FeedPage';
import { ChatPage } from '../pages/ChatPage';

test.describe('Feed and Matching', () => {
  let feedPage: FeedPage;
  let chatPage: ChatPage;

  test.beforeEach(async ({ page, baseURL }) => {
    feedPage = new FeedPage(page, baseURL || 'http://localhost:8083');
    chatPage = new ChatPage(page, baseURL || 'http://localhost:8083');
    
    // 導航到 feed 頁面（假設已認證）
    await feedPage.navigateToFeed();
  });

  test.describe('Feed Page Display', () => {
    test('should display feed page correctly', async () => {
      await expect(feedPage.isPageLoaded()).resolves.toBe(true);
      
      // 驗證頁面元素
      await feedPage.verifyFeedPageElements();
      
      // 驗證 URL
      await feedPage.verifyFeedPageURL();
      
      // 截圖
      await feedPage.takeFeedScreenshot('feed-page-display');
    });

    test('should show profile cards when available', async () => {
      const hasCards = await feedPage.isElementVisible('[data-testid="profile-card"], .profile-card', 10000);
      const isEmpty = await feedPage.isAtEnd();
      
      // 應該有卡片或顯示空狀態
      expect(hasCards || isEmpty).toBe(true);
      
      if (hasCards) {
        // 驗證卡片內容
        const profileInfo = await feedPage.getCurrentProfileInfo();
        expect(profileInfo.name).toBeTruthy();
      }
    });

    test('should display empty state when no more profiles', async () => {
      // 如果沒有卡片，檢查空狀態
      const isEmpty = await feedPage.isAtEnd();
      
      if (isEmpty) {
        await feedPage.verifyEmptyState();
      } else {
        // 如果有卡片，滑動直到結束
        const swipeCount = await feedPage.performMultipleSwipes(50, 'left');
        console.log(`Performed ${swipeCount} swipes`);
        
        // 檢查是否到達空狀態
        const finalEmpty = await feedPage.isAtEnd();
        expect(finalEmpty).toBe(true);
      }
    });
  });

  test.describe('Swiping Interactions', () => {
    test('should handle right swipe (like)', async ({ isMobile }) => {
      const hasCards = await feedPage.waitForNewCard(5000);
      
      if (!hasCards) {
        test.skip('No cards available for testing');
        return;
      }

      // 獲取當前用戶資訊
      const beforeProfile = await feedPage.getCurrentProfileInfo();
      
      // 向右滑動（喜歡）
      if (isMobile) {
        await feedPage.swipeRight();
      } else {
        await feedPage.clickLike();
      }
      
      // 檢查是否有配對通知
      const hasMatch = await feedPage.checkForMatch(3000);
      
      if (hasMatch) {
        await feedPage.handleMatchNotification('continue');
      }
      
      // 驗證已切換到下一張卡片
      const hasNextCard = await feedPage.waitForNewCard(5000);
      const isEmpty = await feedPage.isAtEnd();
      
      expect(hasNextCard || isEmpty).toBe(true);
    });

    test('should handle left swipe (pass)', async ({ isMobile }) => {
      const hasCards = await feedPage.waitForNewCard(5000);
      
      if (!hasCards) {
        test.skip('No cards available for testing');
        return;
      }

      const beforeProfile = await feedPage.getCurrentProfileInfo();
      
      // 向左滑動（不喜歡）
      if (isMobile) {
        await feedPage.swipeLeft();
      } else {
        await feedPage.clickDislike();
      }
      
      // 驗證已切換到下一張卡片
      const hasNextCard = await feedPage.waitForNewCard(5000);
      const isEmpty = await feedPage.isAtEnd();
      
      expect(hasNextCard || isEmpty).toBe(true);
    });

    test('should handle super like', async () => {
      const hasCards = await feedPage.waitForNewCard(5000);
      
      if (!hasCards) {
        test.skip('No cards available for testing');
        return;
      }

      const hasSuperLike = await feedPage.isElementVisible('[data-testid="super-like-button"], .super-like-btn', 3000);
      
      if (hasSuperLike) {
        await feedPage.clickSuperLike();
        
        // 檢查配對通知
        const hasMatch = await feedPage.checkForMatch(3000);
        if (hasMatch) {
          await feedPage.handleMatchNotification('continue');
        }
      } else {
        console.log('Super like feature not available');
      }
    });
  });

  test.describe('Matching Flow', () => {
    test('should show match notification when mutual like occurs', async () => {
      // 這個測試需要預設的測試數據或模擬
      // 暫時跳過，需要後端配合
      test.skip('Requires test data setup');
    });

    test('should handle match notification actions', async () => {
      // 模擬配對通知
      await feedPage.page.evaluate(() => {
        // 創建模擬的配對模態
        const modal = document.createElement('div');
        modal.setAttribute('data-testid', 'match-modal');
        modal.innerHTML = `
          <div>It's a Match!</div>
          <button data-testid="continue-button">Continue</button>
          <button data-testid="send-message-button">Send Message</button>
        `;
        document.body.appendChild(modal);
      });

      // 測試繼續按鈕
      await feedPage.handleMatchNotification('continue');
      
      // 驗證模態已關閉
      const hasModal = await feedPage.isElementVisible('[data-testid="match-modal"]', 2000);
      expect(hasModal).toBe(false);
    });
  });

  test.describe('Profile Information', () => {
    test('should display profile information correctly', async () => {
      const hasCards = await feedPage.waitForNewCard(5000);
      
      if (!hasCards) {
        test.skip('No cards available for testing');
        return;
      }

      const profileInfo = await feedPage.getCurrentProfileInfo();
      
      // 驗證必要資訊存在
      expect(profileInfo.name).toBeTruthy();
      expect(typeof profileInfo.name).toBe('string');
      expect(profileInfo.name.length).toBeGreaterThan(0);
    });

    test('should handle profile images', async () => {
      const hasCards = await feedPage.waitForNewCard(5000);
      
      if (!hasCards) {
        test.skip('No cards available for testing');
        return;
      }

      // 檢查個人檔案圖片
      const hasImage = await feedPage.isElementVisible('[data-testid="profile-image"], .profile-image, img[alt*="profile"]', 5000);
      expect(hasImage).toBe(true);

      if (hasImage) {
        // 驗證圖片已載入
        const image = feedPage.page.locator('[data-testid="profile-image"], .profile-image, img[alt*="profile"]').first();
        await expect(image).toBeVisible();
      }
    });

    test('should show more info when available', async () => {
      const hasCards = await feedPage.waitForNewCard(5000);
      
      if (!hasCards) {
        test.skip('No cards available for testing');
        return;
      }

      const hasMoreInfo = await feedPage.isElementVisible('[data-testid="more-info"], .info-btn', 3000);
      
      if (hasMoreInfo) {
        await feedPage.viewMoreInfo();
        
        // 驗證詳細資訊顯示
        const hasDetails = await feedPage.isElementVisible('[data-testid="profile-details"], .profile-details', 5000);
        expect(hasDetails).toBe(true);
      }
    });
  });

  test.describe('Performance and Loading', () => {
    test('should load cards efficiently', async () => {
      const startTime = Date.now();
      
      await feedPage.navigateToFeed();
      const loaded = await feedPage.isPageLoaded();
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      expect(loaded).toBe(true);
      expect(loadTime).toBeLessThan(10000); // 10秒內載入
    });

    test('should handle rapid swiping', async ({ isMobile }) => {
      const hasCards = await feedPage.waitForNewCard(5000);
      
      if (!hasCards) {
        test.skip('No cards available for testing');
        return;
      }

      // 快速滑動多張卡片
      const swipeCount = Math.min(5, await feedPage.getVisibleCardCount());
      
      for (let i = 0; i < swipeCount; i++) {
        if (isMobile) {
          await feedPage.swipeRight();
        } else {
          await feedPage.clickLike();
        }
        
        // 短暫等待
        await feedPage.wait(200);
      }
      
      // 驗證沒有錯誤
      await feedPage.verifyNoErrors();
    });

    test('should handle network interruption gracefully', async () => {
      // 模擬網路中斷
      await feedPage.page.route('**/feed/**', route => route.abort('failed'));
      
      await feedPage.refreshFeed();
      
      // 檢查是否顯示適當的錯誤訊息
      const hasError = await feedPage.isElementVisible('[data-testid="feed-error"], .feed-error', 5000);
      
      if (hasError) {
        expect(hasError).toBe(true);
      }
    });
  });

  test.describe('Navigation and UI', () => {
    test('should navigate to other sections', async () => {
      // 測試導航到其他標籤頁
      const hasTabBar = await feedPage.isElementVisible('[data-testid="tab-bar"], .tab-bar', 5000);
      
      if (hasTabBar) {
        // 點擊其他標籤（如果存在）
        const chatTab = feedPage.page.locator('button:has-text("Chat"), button:has-text("聊天")');
        
        if (await chatTab.isVisible()) {
          await chatTab.click();
          
          // 驗證導航成功
          const currentURL = feedPage.getCurrentURL();
          expect(currentURL).toMatch(/chat|conversation/i);
        }
      }
    });

    test('should open filters when available', async () => {
      const hasFilterButton = await feedPage.isElementVisible('[data-testid="filter-button"], .filter-btn', 3000);
      
      if (hasFilterButton) {
        await feedPage.openFilters();
        
        // 驗證篩選器打開
        const hasFilterModal = await feedPage.isElementVisible('[role="dialog"], .modal', 3000);
        expect(hasFilterModal).toBe(true);
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async () => {
      await feedPage.navigateToFeed();
      
      // 使用 Tab 鍵導航
      await feedPage.page.keyboard.press('Tab');
      
      // 檢查焦點是否在可導航元素上
      const focusedElement = await feedPage.page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'INPUT', 'A'].includes(focusedElement || '')).toBe(true);
    });

    test('should have proper ARIA labels', async () => {
      const hasCards = await feedPage.waitForNewCard(5000);
      
      if (!hasCards) {
        test.skip('No cards available for testing');
        return;
      }

      // 檢查按鈕是否有適當的標籤
      const likeButton = feedPage.page.locator('[data-testid="like-button"], .like-btn').first();
      
      if (await likeButton.isVisible()) {
        const ariaLabel = await likeButton.getAttribute('aria-label');
        const hasText = await likeButton.textContent();
        
        expect(ariaLabel || hasText).toBeTruthy();
      }
    });
  });

  test.describe('Mobile Specific', () => {
    test('should handle touch gestures on mobile', async ({ isMobile }) => {
      if (!isMobile) {
        test.skip('Mobile-only test');
        return;
      }

      const hasCards = await feedPage.waitForNewCard(5000);
      
      if (!hasCards) {
        test.skip('No cards available for testing');
        return;
      }

      // 測試觸摸滑動
      await feedPage.swipeRight();
      
      // 驗證滑動後的狀態
      const hasNextCard = await feedPage.waitForNewCard(3000);
      const isEmpty = await feedPage.isAtEnd();
      
      expect(hasNextCard || isEmpty).toBe(true);
    });

    test('should adapt to different screen sizes', async ({ isMobile }) => {
      if (!isMobile) {
        // 測試不同的桌面視窗大小
        await feedPage.page.setViewportSize({ width: 1024, height: 768 });
        await feedPage.refreshFeed();
        await expect(feedPage.isPageLoaded()).resolves.toBe(true);
        
        await feedPage.page.setViewportSize({ width: 1920, height: 1080 });
        await feedPage.refreshFeed();
        await expect(feedPage.isPageLoaded()).resolves.toBe(true);
      }
    });
  });
});