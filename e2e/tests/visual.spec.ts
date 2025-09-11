/**
 * Visual Regression Tests
 * 視覺回歸測試 - 檢測 UI 變化
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { FeedPage } from '../pages/FeedPage';
import { ChatPage } from '../pages/ChatPage';
import { APIMocks } from '../utils/api-mocks';

test.describe('Visual Regression Tests', () => {
  let loginPage: LoginPage;
  let feedPage: FeedPage;
  let chatPage: ChatPage;
  let apiMocks: APIMocks;

  test.beforeEach(async ({ page, baseURL }) => {
    const base = baseURL || 'http://localhost:8083';
    loginPage = new LoginPage(page, base);
    feedPage = new FeedPage(page, base);
    chatPage = new ChatPage(page, base);
    apiMocks = new APIMocks(page);
    
    // 設置 API 模擬以確保一致的數據
    await apiMocks.setupAllMocks();
  });

  test.afterEach(async () => {
    await apiMocks.clearMocks();
  });

  test.describe('Login Page Visuals', () => {
    test('should match login page layout', async ({ browserName }) => {
      await loginPage.navigateToLogin();
      await loginPage.waitForPageLoad();
      
      // 截圖比較
      await expect(loginPage.page).toHaveScreenshot(`login-page-${browserName}.png`, {
        fullPage: true,
        threshold: 0.2
      });
    });

    test('should match login form states', async ({ browserName }) => {
      await loginPage.navigateToLogin();
      
      // 空表單狀態
      await expect(loginPage.page).toHaveScreenshot(`login-empty-${browserName}.png`, {
        fullPage: true
      });
      
      // 填寫表單狀態
      await loginPage.fillLoginForm('test@example.com', 'password123');
      await expect(loginPage.page).toHaveScreenshot(`login-filled-${browserName}.png`, {
        fullPage: true
      });
      
      // 錯誤狀態
      await loginPage.clickLoginButton();
      await loginPage.wait(2000); // 等待錯誤顯示
      await expect(loginPage.page).toHaveScreenshot(`login-error-${browserName}.png`, {
        fullPage: true
      });
    });

    test('should match mobile login layout', async ({ browserName, isMobile }) => {
      if (!isMobile) {
        test.skip('Mobile-only visual test');
        return;
      }

      await loginPage.navigateToLogin();
      await loginPage.waitForPageLoad();
      
      await expect(loginPage.page).toHaveScreenshot(`login-mobile-${browserName}.png`, {
        fullPage: true
      });
    });
  });

  test.describe('Feed Page Visuals', () => {
    test('should match feed layout with cards', async ({ browserName }) => {
      await feedPage.navigateToFeed();
      await feedPage.waitForPageLoad();
      
      // 等待卡片載入
      const hasCards = await feedPage.waitForNewCard(5000);
      
      if (hasCards) {
        await expect(feedPage.page).toHaveScreenshot(`feed-with-cards-${browserName}.png`, {
          fullPage: true,
          // 遮住動態內容
          mask: [
            feedPage.page.locator('[data-testid="profile-image"], .profile-image'),
            feedPage.page.locator('[data-testid="profile-name"], .profile-name')
          ]
        });
      }
    });

    test('should match empty feed state', async ({ browserName }) => {
      // 模擬空的 feed
      await apiMocks.mockEmptyResponse('**/feed');
      
      await feedPage.navigateToFeed();
      await feedPage.waitForPageLoad();
      
      await expect(feedPage.page).toHaveScreenshot(`feed-empty-${browserName}.png`, {
        fullPage: true
      });
    });

    test('should match loading state', async ({ browserName }) => {
      // 模擬慢速載入
      await apiMocks.mockSlowNetwork('**/feed', 5000);
      
      await feedPage.navigateToFeed();
      
      // 在載入期間截圖
      await feedPage.wait(1000);
      await expect(feedPage.page).toHaveScreenshot(`feed-loading-${browserName}.png`, {
        fullPage: true
      });
    });

    test('should match match notification modal', async ({ browserName }) => {
      await feedPage.navigateToFeed();
      
      // 模擬配對通知
      await feedPage.page.evaluate(() => {
        const modal = document.createElement('div');
        modal.setAttribute('data-testid', 'match-modal');
        modal.innerHTML = `
          <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000;">
            <div style="background: white; padding: 2rem; border-radius: 1rem; text-align: center;">
              <h2>It's a Match! 🎉</h2>
              <p>You and Alice liked each other</p>
              <button data-testid="continue-button" style="margin: 0.5rem; padding: 0.5rem 1rem;">Continue Swiping</button>
              <button data-testid="send-message-button" style="margin: 0.5rem; padding: 0.5rem 1rem;">Send Message</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      });
      
      await expect(feedPage.page).toHaveScreenshot(`match-modal-${browserName}.png`, {
        fullPage: true
      });
    });
  });

  test.describe('Chat Page Visuals', () => {
    test('should match chat layout', async ({ browserName }) => {
      await chatPage.navigateToChat('test-chat-1');
      await chatPage.waitForPageLoad();
      
      await expect(chatPage.page).toHaveScreenshot(`chat-layout-${browserName}.png`, {
        fullPage: true,
        // 遮住個人資訊和動態時間
        mask: [
          chatPage.page.locator('[data-testid="recipient-name"], .recipient-name'),
          chatPage.page.locator('[data-testid="message-time"], .message-time')
        ]
      });
    });

    test('should match message bubbles', async ({ browserName }) => {
      await chatPage.navigateToChat('test-chat-1');
      
      // 發送測試訊息
      await chatPage.sendMessage('Hello, this is a test message!');
      await chatPage.sendMessage('This is another message to test the layout');
      
      await chatPage.wait(1000);
      
      await expect(chatPage.page).toHaveScreenshot(`chat-messages-${browserName}.png`, {
        fullPage: true,
        mask: [
          chatPage.page.locator('[data-testid="message-time"], .message-time')
        ]
      });
    });

    test('should match empty chat state', async ({ browserName }) => {
      await chatPage.navigateToChat('empty-chat');
      await chatPage.waitForPageLoad();
      
      await expect(chatPage.page).toHaveScreenshot(`chat-empty-${browserName}.png`, {
        fullPage: true
      });
    });

    test('should match game modal', async ({ browserName }) => {
      await chatPage.navigateToChat('test-chat-1');
      
      // 模擬遊戲模態
      await chatPage.page.evaluate(() => {
        const modal = document.createElement('div');
        modal.setAttribute('data-testid', 'game-modal');
        modal.innerHTML = `
          <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000;">
            <div style="background: white; padding: 2rem; border-radius: 1rem; text-align: center;">
              <h2>Rock Paper Scissors</h2>
              <p>Choose your move!</p>
              <div style="display: flex; gap: 1rem; justify-content: center; margin: 1rem 0;">
                <button data-testid="rock-button" style="padding: 1rem; font-size: 2rem;">✊</button>
                <button data-testid="paper-button" style="padding: 1rem; font-size: 2rem;">✋</button>
                <button data-testid="scissors-button" style="padding: 1rem; font-size: 2rem;">✌️</button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      });
      
      await expect(chatPage.page).toHaveScreenshot(`game-modal-${browserName}.png`, {
        fullPage: true
      });
    });
  });

  test.describe('Responsive Design', () => {
    test('should match tablet layout', async ({ browserName }) => {
      // 設置平板視窗大小
      await loginPage.page.setViewportSize({ width: 768, height: 1024 });
      
      await loginPage.navigateToLogin();
      await expect(loginPage.page).toHaveScreenshot(`tablet-login-${browserName}.png`, {
        fullPage: true
      });
      
      await feedPage.navigateToFeed();
      await feedPage.waitForPageLoad();
      await expect(feedPage.page).toHaveScreenshot(`tablet-feed-${browserName}.png`, {
        fullPage: true
      });
    });

    test('should match desktop wide layout', async ({ browserName }) => {
      // 設置寬屏桌面視窗大小
      await loginPage.page.setViewportSize({ width: 1920, height: 1080 });
      
      await loginPage.navigateToLogin();
      await expect(loginPage.page).toHaveScreenshot(`desktop-wide-login-${browserName}.png`, {
        fullPage: true
      });
      
      await feedPage.navigateToFeed();
      await feedPage.waitForPageLoad();
      await expect(feedPage.page).toHaveScreenshot(`desktop-wide-feed-${browserName}.png`, {
        fullPage: true
      });
    });

    test('should match small screen layout', async ({ browserName }) => {
      // 設置小屏幕視窗大小
      await loginPage.page.setViewportSize({ width: 360, height: 640 });
      
      await loginPage.navigateToLogin();
      await expect(loginPage.page).toHaveScreenshot(`small-screen-login-${browserName}.png`, {
        fullPage: true
      });
      
      await feedPage.navigateToFeed();
      await feedPage.waitForPageLoad();
      await expect(feedPage.page).toHaveScreenshot(`small-screen-feed-${browserName}.png`, {
        fullPage: true
      });
    });
  });

  test.describe('Dark Mode', () => {
    test('should match dark mode login', async ({ browserName }) => {
      // 設置深色模式
      await loginPage.page.emulateMedia({ colorScheme: 'dark' });
      
      await loginPage.navigateToLogin();
      await loginPage.waitForPageLoad();
      
      await expect(loginPage.page).toHaveScreenshot(`dark-mode-login-${browserName}.png`, {
        fullPage: true
      });
    });

    test('should match dark mode feed', async ({ browserName }) => {
      await feedPage.page.emulateMedia({ colorScheme: 'dark' });
      
      await feedPage.navigateToFeed();
      await feedPage.waitForPageLoad();
      
      const hasCards = await feedPage.waitForNewCard(5000);
      
      if (hasCards) {
        await expect(feedPage.page).toHaveScreenshot(`dark-mode-feed-${browserName}.png`, {
          fullPage: true,
          mask: [
            feedPage.page.locator('[data-testid="profile-image"], .profile-image'),
            feedPage.page.locator('[data-testid="profile-name"], .profile-name')
          ]
        });
      }
    });

    test('should match dark mode chat', async ({ browserName }) => {
      await chatPage.page.emulateMedia({ colorScheme: 'dark' });
      
      await chatPage.navigateToChat('test-chat-1');
      await chatPage.waitForPageLoad();
      
      await expect(chatPage.page).toHaveScreenshot(`dark-mode-chat-${browserName}.png`, {
        fullPage: true,
        mask: [
          chatPage.page.locator('[data-testid="recipient-name"], .recipient-name'),
          chatPage.page.locator('[data-testid="message-time"], .message-time')
        ]
      });
    });
  });

  test.describe('Loading and Error States', () => {
    test('should match network error state', async ({ browserName }) => {
      // 模擬網路錯誤
      await apiMocks.mockNetworkError('**/feed');
      
      await feedPage.navigateToFeed();
      await feedPage.wait(3000);
      
      const hasError = await feedPage.isElementVisible('[data-testid="feed-error"], .feed-error', 2000);
      
      if (hasError) {
        await expect(feedPage.page).toHaveScreenshot(`network-error-${browserName}.png`, {
          fullPage: true
        });
      }
    });

    test('should match server error state', async ({ browserName }) => {
      // 模擬伺服器錯誤
      await apiMocks.mockServerError('**/feed', 500);
      
      await feedPage.navigateToFeed();
      await feedPage.wait(3000);
      
      await expect(feedPage.page).toHaveScreenshot(`server-error-${browserName}.png`, {
        fullPage: true
      });
    });

    test('should match loading spinner', async ({ browserName }) => {
      // 模擬慢速載入
      await apiMocks.mockSlowNetwork('**/feed', 10000);
      
      await feedPage.navigateToFeed();
      
      // 在載入期間截圖
      await feedPage.wait(2000);
      
      const isLoading = await feedPage.isLoadingCards();
      if (isLoading) {
        await expect(feedPage.page).toHaveScreenshot(`loading-spinner-${browserName}.png`, {
          fullPage: true
        });
      }
    });
  });

  test.describe('Component Variations', () => {
    test('should match different profile card layouts', async ({ browserName }) => {
      // 添加不同類型的用戶數據
      apiMocks.addMockUser({
        id: 'user-long-bio',
        email: 'longbio@example.com',
        name: 'User With Very Long Name That Might Wrap',
        age: 30,
        bio: 'This is a very long bio that should test how the component handles text wrapping and layout when there is a lot of content to display in the profile card.',
        location: 'Very Long City Name, State',
        photos: ['/mock-photos/user1.jpg'],
        isOnline: true
      });

      apiMocks.addMockUser({
        id: 'user-minimal',
        email: 'minimal@example.com',
        name: 'Min',
        age: 21,
        bio: '',
        location: '',
        photos: ['/mock-photos/user2.jpg'],
        isOnline: false
      });

      await feedPage.navigateToFeed();
      await feedPage.waitForPageLoad();
      
      // 截圖不同的卡片變化
      await expect(feedPage.page).toHaveScreenshot(`profile-cards-variations-${browserName}.png`, {
        fullPage: true,
        mask: [
          feedPage.page.locator('[data-testid="profile-image"], .profile-image')
        ]
      });
    });

    test('should match toast notifications', async ({ browserName }) => {
      await feedPage.navigateToFeed();
      
      // 模擬成功通知
      await feedPage.page.evaluate(() => {
        const toast = document.createElement('div');
        toast.setAttribute('data-testid', 'toast-success');
        toast.innerHTML = `
          <div style="position: fixed; top: 1rem; right: 1rem; background: #10B981; color: white; padding: 1rem; border-radius: 0.5rem; z-index: 1000;">
            ✓ Message sent successfully!
          </div>
        `;
        document.body.appendChild(toast);
      });
      
      await expect(feedPage.page).toHaveScreenshot(`toast-success-${browserName}.png`, {
        fullPage: true
      });
    });
  });

  test.describe('Cross-Browser Consistency', () => {
    test('should be consistent across browsers', async ({ browserName }) => {
      await loginPage.navigateToLogin();
      await loginPage.waitForPageLoad();
      
      // 這個測試會為每個瀏覽器生成截圖
      // 人工比較不同瀏覽器的截圖以確保一致性
      await expect(loginPage.page).toHaveScreenshot(`cross-browser-login-${browserName}.png`, {
        fullPage: true,
        threshold: 0.3 // 稍微放寬閾值以適應瀏覽器差異
      });
    });
  });
});