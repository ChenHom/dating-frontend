/**
 * Feed Page Object
 * 配對頁面的頁面對象模式實現
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { MobileHelpers } from '../utils/test-helpers';

export class FeedPage extends BasePage {
  // 頁面特有選擇器
  private readonly pageSelectors = {
    // 主要內容
    feedContainer: '[data-testid="feed-container"], .feed-container',
    profileCard: '[data-testid="profile-card"], .profile-card',
    currentCard: '[data-testid="current-card"], .card.current, .card:first-child',
    
    // 個人檔案資訊
    profileImage: '[data-testid="profile-image"], .profile-image, img[alt*="profile"]',
    profileName: '[data-testid="profile-name"], .profile-name, h2, h3',
    profileAge: '[data-testid="profile-age"], .profile-age',
    profileBio: '[data-testid="profile-bio"], .profile-bio',
    profileLocation: '[data-testid="profile-location"], .profile-location',
    
    // 動作按鈕
    likeButton: '[data-testid="like-button"], button:has-text("Like"), .like-btn, button[aria-label*="like"]',
    dislikeButton: '[data-testid="dislike-button"], button:has-text("Pass"), .pass-btn, button[aria-label*="pass"]',
    superLikeButton: '[data-testid="super-like-button"], button:has-text("Super"), .super-like-btn',
    
    // 滑動區域
    swipeArea: '[data-testid="swipe-area"], .swipe-container, .card-stack',
    
    // 篩選和設定
    filterButton: '[data-testid="filter-button"], button:has-text("Filter"), .filter-btn',
    settingsButton: '[data-testid="settings-button"], button:has-text("Settings"), .settings-btn',
    
    // 配對通知
    matchModal: '[data-testid="match-modal"], .match-modal, [role="dialog"]:has(text*="match")',
    matchMessage: '[data-testid="match-message"], .match-message',
    continueButton: '[data-testid="continue-button"], button:has-text("Continue"), button:has-text("繼續")',
    sendMessageButton: '[data-testid="send-message-button"], button:has-text("Send Message"), button:has-text("發送訊息")',
    
    // 空狀態
    emptyState: '[data-testid="empty-feed"], .empty-feed, text=No more profiles',
    noMoreCardsMessage: 'text=No more cards, text=沒有更多用戶',
    
    // 載入狀態
    loadingCards: '[data-testid="loading-cards"], .loading-cards',
    
    // 錯誤狀態
    errorState: '[data-testid="feed-error"], .feed-error',
    
    // 導航
    backToFeedButton: '[data-testid="back-to-feed"], button:has-text("Back to Feed")',
    
    // 更多資訊
    moreInfoButton: '[data-testid="more-info"], button:has-text("Info"), .info-btn',
    profileDetails: '[data-testid="profile-details"], .profile-details',
    
    // 舉報按鈕
    reportButton: '[data-testid="report-button"], button:has-text("Report"), .report-btn'
  };

  constructor(page: Page, baseURL: string) {
    super(page, baseURL);
  }

  /**
   * 導航到配對頁面
   */
  async navigateToFeed(): Promise<void> {
    await this.goto('/(tabs)/discover');
    await this.waitForPageLoad();
  }

  /**
   * 檢查頁面是否已載入
   */
  async isPageLoaded(): Promise<boolean> {
    try {
      await this.waitForElement(this.pageSelectors.feedContainer, { timeout: 15000 });
      
      // 檢查是否有個人檔案卡片或空狀態
      const hasProfileCard = await this.isElementVisible(this.pageSelectors.profileCard, 5000);
      const hasCurrentCard = await this.isElementVisible(this.pageSelectors.currentCard, 5000);
      const isEmpty = await this.isElementVisible(this.pageSelectors.emptyState, 2000);
      
      return hasProfileCard || hasCurrentCard || isEmpty;
    } catch {
      return false;
    }
  }

  /**
   * 等待配對卡片載入
   */
  async waitForCards(timeout = 10000): Promise<void> {
    await this.waitForElement(this.pageSelectors.profileCard, { timeout });
  }

  /**
   * 獲取當前配對卡片
   */
  async getCurrentCard(): Promise<Locator> {
    return this.waitForElement(this.pageSelectors.currentCard);
  }

  /**
   * 獲取當前用戶資訊
   */
  async getCurrentProfileInfo(): Promise<{
    name: string;
    age: string | null;
    bio: string | null;
    location: string | null;
  }> {
    const currentCard = await this.getCurrentCard();
    
    const name = await currentCard.locator(this.pageSelectors.profileName).textContent() || '';
    const age = await currentCard.locator(this.pageSelectors.profileAge).textContent().catch(() => null);
    const bio = await currentCard.locator(this.pageSelectors.profileBio).textContent().catch(() => null);
    const location = await currentCard.locator(this.pageSelectors.profileLocation).textContent().catch(() => null);

    return { name, age, bio, location };
  }

  /**
   * 點擊喜歡按鈕
   */
  async clickLike(): Promise<void> {
    await this.click(this.pageSelectors.likeButton);
    await this.waitForCardTransition();
  }

  /**
   * 點擊不喜歡按鈕
   */
  async clickDislike(): Promise<void> {
    await this.click(this.pageSelectors.dislikeButton);
    await this.waitForCardTransition();
  }

  /**
   * 點擊超級喜歡按鈕
   */
  async clickSuperLike(): Promise<void> {
    await this.click(this.pageSelectors.superLikeButton);
    await this.waitForCardTransition();
  }

  /**
   * 向右滑動（喜歡）
   */
  async swipeRight(): Promise<void> {
    if (this.isMobile()) {
      const swipeArea = await this.waitForElement(this.pageSelectors.swipeArea);
      await MobileHelpers.swipeRight(this.page, swipeArea);
    } else {
      // 桌面端使用拖拽
      const card = await this.getCurrentCard();
      const box = await card.boundingBox();
      
      if (box) {
        await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await this.page.mouse.down();
        await this.page.mouse.move(box.x + box.width + 100, box.y + box.height / 2, { steps: 10 });
        await this.page.mouse.up();
      }
    }
    
    await this.waitForCardTransition();
  }

  /**
   * 向左滑動（不喜歡）
   */
  async swipeLeft(): Promise<void> {
    if (this.isMobile()) {
      const swipeArea = await this.waitForElement(this.pageSelectors.swipeArea);
      await MobileHelpers.swipeLeft(this.page, swipeArea);
    } else {
      // 桌面端使用拖拽
      const card = await this.getCurrentCard();
      const box = await card.boundingBox();
      
      if (box) {
        await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await this.page.mouse.down();
        await this.page.mouse.move(box.x - 100, box.y + box.height / 2, { steps: 10 });
        await this.page.mouse.up();
      }
    }
    
    await this.waitForCardTransition();
  }

  /**
   * 等待卡片轉換完成
   */
  async waitForCardTransition(timeout = 5000): Promise<void> {
    // 等待動畫完成
    await this.wait(500);
    
    // 等待新卡片出現或到達空狀態
    await Promise.race([
      this.waitForElement(this.pageSelectors.currentCard, { timeout }),
      this.waitForElement(this.pageSelectors.emptyState, { timeout })
    ]).catch(() => {
      // 忽略超時錯誤
    });
  }

  /**
   * 檢查是否出現配對通知
   */
  async checkForMatch(timeout = 5000): Promise<boolean> {
    try {
      await this.waitForElement(this.pageSelectors.matchModal, { timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 處理配對通知
   */
  async handleMatchNotification(action: 'continue' | 'sendMessage'): Promise<void> {
    await this.waitForModal();
    
    if (action === 'continue') {
      await this.click(this.pageSelectors.continueButton);
    } else {
      await this.click(this.pageSelectors.sendMessageButton);
    }
    
    // 等待模態關閉
    await this.page.locator(this.pageSelectors.matchModal).waitFor({ state: 'hidden' });
  }

  /**
   * 獲取配對訊息
   */
  async getMatchMessage(): Promise<string> {
    const modal = await this.waitForModal();
    const message = modal.locator(this.pageSelectors.matchMessage);
    return await message.textContent() || '';
  }

  /**
   * 檢查是否到達結尾（沒有更多用戶）
   */
  async isAtEnd(): Promise<boolean> {
    return this.isElementVisible(this.pageSelectors.emptyState, 3000);
  }

  /**
   * 刷新配對列表
   */
  async refreshFeed(): Promise<void> {
    await this.reload();
    await this.waitForPageLoad();
  }

  /**
   * 開啟篩選器
   */
  async openFilters(): Promise<void> {
    await this.click(this.pageSelectors.filterButton);
  }

  /**
   * 查看更多用戶資訊
   */
  async viewMoreInfo(): Promise<void> {
    await this.click(this.pageSelectors.moreInfoButton);
    await this.waitForElement(this.pageSelectors.profileDetails);
  }

  /**
   * 舉報用戶
   */
  async reportUser(): Promise<void> {
    await this.click(this.pageSelectors.reportButton);
  }

  /**
   * 批量滑動（測試用）
   */
  async performMultipleSwipes(count: number, direction: 'left' | 'right' = 'right'): Promise<number> {
    let successfulSwipes = 0;
    
    for (let i = 0; i < count; i++) {
      try {
        // 檢查是否還有卡片
        if (await this.isAtEnd()) {
          break;
        }

        if (direction === 'right') {
          await this.swipeRight();
        } else {
          await this.swipeLeft();
        }

        successfulSwipes++;

        // 檢查是否有配對通知
        if (await this.checkForMatch(1000)) {
          await this.handleMatchNotification('continue');
        }

        // 短暫等待
        await this.wait(500);

      } catch (error) {
        console.warn(`Swipe ${i + 1} failed:`, error);
        break;
      }
    }

    return successfulSwipes;
  }

  /**
   * 驗證配對頁面元素
   */
  async verifyFeedPageElements(): Promise<void> {
    await expect(this.page.locator(this.pageSelectors.feedContainer)).toBeVisible();
    
    // 檢查是否有卡片或空狀態
    const hasCards = await this.isElementVisible(this.pageSelectors.profileCard, 3000);
    const isEmpty = await this.isElementVisible(this.pageSelectors.emptyState, 1000);
    
    expect(hasCards || isEmpty).toBeTruthy();

    // 如果有卡片，檢查動作按鈕
    if (hasCards) {
      await expect(this.page.locator(this.pageSelectors.likeButton)).toBeVisible();
      await expect(this.page.locator(this.pageSelectors.dislikeButton)).toBeVisible();
    }
  }

  /**
   * 等待新卡片載入
   */
  async waitForNewCard(timeout = 10000): Promise<boolean> {
    try {
      await this.waitForElement(this.pageSelectors.currentCard, { timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 檢查載入狀態
   */
  async isLoadingCards(): Promise<boolean> {
    return this.isElementVisible(this.pageSelectors.loadingCards, 2000);
  }

  /**
   * 驗證空狀態
   */
  async verifyEmptyState(): Promise<void> {
    await expect(this.page.locator(this.pageSelectors.emptyState)).toBeVisible();
    await expect(this.page.locator(this.pageSelectors.noMoreCardsMessage)).toBeVisible();
  }

  /**
   * 截圖配對頁面
   */
  async takeFeedScreenshot(name: string = 'feed-page'): Promise<void> {
    await this.takeScreenshot(name, { fullPage: true });
  }

  /**
   * 獲取可見卡片數量
   */
  async getVisibleCardCount(): Promise<number> {
    const cards = this.page.locator(this.pageSelectors.profileCard);
    return await cards.count();
  }

  /**
   * 驗證配對頁面 URL
   */
  async verifyFeedPageURL(): Promise<void> {
    await this.verifyURL(/\/(tabs\/)?discover$/);
  }
}