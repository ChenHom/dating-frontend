/**
 * Base Page Object Class
 * 所有頁面對象的基礎類，包含共用功能
 */

import { Page, Locator, expect } from '@playwright/test';
import { 
  waitForElement, 
  clickElement, 
  fillField, 
  waitForNetworkIdle,
  verifyURL,
  compareScreenshot 
} from '../utils/test-helpers';

export abstract class BasePage {
  protected page: Page;
  protected baseURL: string;

  // 共用選擇器
  protected readonly selectors = {
    // 導航相關
    backButton: '[data-testid="back-button"], button[aria-label*="back"], button:has-text("Back")',
    closeButton: '[data-testid="close-button"], button[aria-label*="close"], button:has-text("Close")',
    
    // 載入狀態
    loadingSpinner: '[data-testid="loading"], .loading, [aria-label*="loading"]',
    loadingText: 'text=Loading, text=載入中',
    
    // 錯誤狀態
    errorMessage: '[data-testid="error"], .error, [role="alert"]',
    errorBoundary: 'text=Something went wrong, text=出現錯誤',
    
    // 通用按鈕
    submitButton: '[type="submit"], button:has-text("Submit"), button:has-text("送出")',
    cancelButton: 'button:has-text("Cancel"), button:has-text("取消")',
    confirmButton: 'button:has-text("Confirm"), button:has-text("確認")',
    
    // 表單元素
    textInput: 'input[type="text"], input:not([type])',
    emailInput: 'input[type="email"]',
    passwordInput: 'input[type="password"]',
    
    // Toast 通知
    toast: '[data-testid="toast"], .toast, [role="status"]',
    toastSuccess: '[data-testid="toast-success"], .toast-success',
    toastError: '[data-testid="toast-error"], .toast-error',
    
    // 模態對話框
    modal: '[data-testid="modal"], .modal, [role="dialog"]',
    modalOverlay: '[data-testid="modal-overlay"], .modal-overlay',
    
    // Tab 導航
    tabBar: '[data-testid="tab-bar"], .tab-bar, [role="tablist"]',
    activeTab: '[data-testid="active-tab"], .tab-active, [aria-selected="true"]'
  };

  constructor(page: Page, baseURL: string) {
    this.page = page;
    this.baseURL = baseURL;
  }

  /**
   * 導航到指定 URL
   */
  async goto(path: string = '', options: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' } = {}): Promise<void> {
    const { waitUntil = 'networkidle' } = options;
    const url = path.startsWith('http') ? path : `${this.baseURL}${path}`;
    
    await this.page.goto(url, { waitUntil });
    await this.waitForPageLoad();
  }

  /**
   * 等待頁面載入完成
   */
  async waitForPageLoad(timeout = 30000): Promise<void> {
    // 等待網路閒置
    await waitForNetworkIdle(this.page, timeout);
    
    // 等待載入指示器消失
    try {
      await this.page.locator(this.selectors.loadingSpinner).waitFor({ 
        state: 'hidden', 
        timeout: 5000 
      });
    } catch {
      // 沒有載入指示器是正常的
    }
  }

  /**
   * 點擊元素
   */
  async click(selector: string, options?: { timeout?: number; force?: boolean }): Promise<void> {
    await clickElement(this.page, selector, options);
  }

  /**
   * 填寫表單欄位
   */
  async fill(selector: string, value: string, options?: { clear?: boolean; timeout?: number }): Promise<void> {
    await fillField(this.page, selector, value, options);
  }

  /**
   * 驗證當前 URL
   */
  async verifyURL(expectedURL: string | RegExp): Promise<void> {
    await verifyURL(this.page, expectedURL);
  }

  /**
   * 等待元素出現
   */
  async waitForElement(selector: string, options?: { timeout?: number; visible?: boolean }): Promise<Locator> {
    return waitForElement(this.page, selector, options);
  }

  /**
   * 檢查元素是否存在
   */
  async isElementVisible(selector: string, timeout = 5000): Promise<boolean> {
    try {
      await this.page.locator(selector).waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 檢查載入狀態
   */
  async isLoading(): Promise<boolean> {
    return this.isElementVisible(this.selectors.loadingSpinner, 1000);
  }

  /**
   * 等待載入完成
   */
  async waitForLoadingToComplete(timeout = 10000): Promise<void> {
    try {
      await this.page.locator(this.selectors.loadingSpinner).waitFor({ 
        state: 'hidden', 
        timeout 
      });
    } catch {
      // 如果沒有載入指示器，直接返回
    }
  }

  /**
   * 檢查是否有錯誤訊息
   */
  async getErrorMessage(): Promise<string | null> {
    const errorElement = this.page.locator(this.selectors.errorMessage).first();
    
    try {
      await errorElement.waitFor({ state: 'visible', timeout: 2000 });
      return await errorElement.textContent();
    } catch {
      return null;
    }
  }

  /**
   * 驗證沒有錯誤
   */
  async verifyNoErrors(): Promise<void> {
    const hasError = await this.isElementVisible(this.selectors.errorMessage, 2000);
    expect(hasError).toBeFalsy();
    
    const hasErrorBoundary = await this.isElementVisible(this.selectors.errorBoundary, 2000);
    expect(hasErrorBoundary).toBeFalsy();
  }

  /**
   * 等待並驗證 Toast 通知
   */
  async waitForToast(type: 'success' | 'error' | 'any' = 'any', timeout = 10000): Promise<string> {
    let selector = this.selectors.toast;
    
    if (type === 'success') {
      selector = this.selectors.toastSuccess;
    } else if (type === 'error') {
      selector = this.selectors.toastError;
    }

    const toast = await waitForElement(this.page, selector, { timeout });
    const message = await toast.textContent() || '';
    
    return message;
  }

  /**
   * 關閉 Toast 通知
   */
  async dismissToast(): Promise<void> {
    const closeButton = this.page.locator(this.selectors.toast).locator(this.selectors.closeButton);
    
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      // 有些 Toast 會自動消失，等待一下
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * 截圖比較
   */
  async takeScreenshot(name: string, options?: { 
    fullPage?: boolean; 
    mask?: Locator[]; 
    clip?: { x: number; y: number; width: number; height: number } 
  }): Promise<void> {
    await compareScreenshot(this.page, name, options);
  }

  /**
   * 等待模態對話框出現
   */
  async waitForModal(timeout = 10000): Promise<Locator> {
    return waitForElement(this.page, this.selectors.modal, { timeout });
  }

  /**
   * 關閉模態對話框
   */
  async closeModal(): Promise<void> {
    const modal = this.page.locator(this.selectors.modal);
    
    // 嘗試點擊關閉按鈕
    const closeButton = modal.locator(this.selectors.closeButton);
    if (await closeButton.isVisible()) {
      await closeButton.click();
      return;
    }

    // 嘗試點擊遮罩層
    const overlay = this.page.locator(this.selectors.modalOverlay);
    if (await overlay.isVisible()) {
      await overlay.click();
      return;
    }

    // 嘗試按 ESC 鍵
    await this.page.keyboard.press('Escape');
  }

  /**
   * 滾動到元素
   */
  async scrollToElement(selector: string): Promise<void> {
    const element = await waitForElement(this.page, selector);
    await element.scrollIntoViewIfNeeded();
  }

  /**
   * 滾動到頁面頂部
   */
  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, 0));
  }

  /**
   * 滾動到頁面底部
   */
  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  /**
   * 獲取當前 URL
   */
  getCurrentURL(): string {
    return this.page.url();
  }

  /**
   * 檢查是否在移動端
   */
  isMobile(): boolean {
    const viewport = this.page.viewportSize();
    return viewport ? viewport.width < 768 : false;
  }

  /**
   * 等待特定時間
   */
  async wait(milliseconds: number): Promise<void> {
    await this.page.waitForTimeout(milliseconds);
  }

  /**
   * 重新載入頁面
   */
  async reload(): Promise<void> {
    await this.page.reload({ waitUntil: 'networkidle' });
    await this.waitForPageLoad();
  }

  /**
   * 返回上一頁
   */
  async goBack(): Promise<void> {
    await this.page.goBack({ waitUntil: 'networkidle' });
    await this.waitForPageLoad();
  }

  /**
   * 驗證頁面標題
   */
  async verifyTitle(expectedTitle: string | RegExp): Promise<void> {
    if (typeof expectedTitle === 'string') {
      await expect(this.page).toHaveTitle(expectedTitle);
    } else {
      await expect(this.page).toHaveTitle(expectedTitle);
    }
  }

  /**
   * 抽象方法 - 子類必須實現
   */
  abstract isPageLoaded(): Promise<boolean>;
}