/**
 * Test Helper Functions
 * 通用的測試輔助函數
 */

import { Page, Locator, expect } from '@playwright/test';

/**
 * 等待元素出現並可見
 */
export async function waitForElement(
  page: Page, 
  selector: string, 
  options: { timeout?: number; visible?: boolean } = {}
): Promise<Locator> {
  const { timeout = 10000, visible = true } = options;
  const element = page.locator(selector);
  
  if (visible) {
    await expect(element).toBeVisible({ timeout });
  } else {
    await expect(element).toBeAttached({ timeout });
  }
  
  return element;
}

/**
 * 等待並點擊元素
 */
export async function clickElement(
  page: Page, 
  selector: string, 
  options: { timeout?: number; force?: boolean } = {}
): Promise<void> {
  const { timeout = 10000, force = false } = options;
  const element = await waitForElement(page, selector, { timeout });
  await element.click({ force });
}

/**
 * 等待並填寫表單欄位
 */
export async function fillField(
  page: Page, 
  selector: string, 
  value: string, 
  options: { clear?: boolean; timeout?: number } = {}
): Promise<void> {
  const { clear = true, timeout = 10000 } = options;
  const element = await waitForElement(page, selector, { timeout });
  
  if (clear) {
    await element.clear();
  }
  await element.fill(value);
}

/**
 * 等待網路請求完成
 */
export async function waitForNetworkIdle(
  page: Page, 
  timeout = 30000
): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * 等待 API 請求
 */
export async function waitForAPICall(
  page: Page, 
  urlPattern: string | RegExp, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'
): Promise<any> {
  const responsePromise = page.waitForResponse(
    response => {
      const url = response.url();
      const matchesUrl = typeof urlPattern === 'string' 
        ? url.includes(urlPattern)
        : urlPattern.test(url);
      return matchesUrl && response.request().method() === method;
    }
  );

  const response = await responsePromise;
  return response.json().catch(() => null);
}

/**
 * 模擬網路錯誤
 */
export async function simulateNetworkError(
  page: Page, 
  urlPattern: string | RegExp
): Promise<void> {
  await page.route(urlPattern, route => {
    route.abort('failed');
  });
}

/**
 * 模擬慢網路
 */
export async function simulateSlowNetwork(
  page: Page, 
  urlPattern: string | RegExp, 
  delayMs = 3000
): Promise<void> {
  await page.route(urlPattern, async route => {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    await route.continue();
  });
}

/**
 * 截圖比較
 */
export async function compareScreenshot(
  page: Page, 
  name: string, 
  options: { 
    fullPage?: boolean; 
    threshold?: number; 
    mask?: Locator[];
    clip?: { x: number; y: number; width: number; height: number };
  } = {}
): Promise<void> {
  const { fullPage = false, threshold = 0.2, mask = [], clip } = options;
  
  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage,
    threshold,
    mask,
    clip
  });
}

/**
 * 驗證元素文本
 */
export async function verifyText(
  page: Page, 
  selector: string, 
  expectedText: string | RegExp
): Promise<void> {
  const element = await waitForElement(page, selector);
  
  if (typeof expectedText === 'string') {
    await expect(element).toHaveText(expectedText);
  } else {
    await expect(element).toHaveText(expectedText);
  }
}

/**
 * 驗證元素屬性
 */
export async function verifyAttribute(
  page: Page, 
  selector: string, 
  attribute: string, 
  expectedValue: string | RegExp
): Promise<void> {
  const element = await waitForElement(page, selector);
  await expect(element).toHaveAttribute(attribute, expectedValue);
}

/**
 * 驗證頁面 URL
 */
export async function verifyURL(
  page: Page, 
  expectedURL: string | RegExp
): Promise<void> {
  if (typeof expectedURL === 'string') {
    await expect(page).toHaveURL(expectedURL);
  } else {
    await expect(page).toHaveURL(expectedURL);
  }
}

/**
 * 等待並驗證頁面標題
 */
export async function verifyTitle(
  page: Page, 
  expectedTitle: string | RegExp
): Promise<void> {
  if (typeof expectedTitle === 'string') {
    await expect(page).toHaveTitle(expectedTitle);
  } else {
    await expect(page).toHaveTitle(expectedTitle);
  }
}

/**
 * 滾動到元素
 */
export async function scrollToElement(
  page: Page, 
  selector: string
): Promise<void> {
  const element = await waitForElement(page, selector);
  await element.scrollIntoViewIfNeeded();
}

/**
 * 等待元素消失
 */
export async function waitForElementToDisappear(
  page: Page, 
  selector: string, 
  timeout = 10000
): Promise<void> {
  const element = page.locator(selector);
  await expect(element).toBeHidden({ timeout });
}

/**
 * 生成隨機測試數據
 */
export class TestDataGenerator {
  static randomEmail(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `test-${timestamp}-${random}@example.com`;
  }

  static randomUsername(): string {
    const adjectives = ['Cool', 'Happy', 'Bright', 'Swift', 'Smart'];
    const nouns = ['User', 'Tester', 'Demo', 'Sample', 'Test'];
    const random = Math.floor(Math.random() * 1000);
    
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adj}${noun}${random}`;
  }

  static randomPassword(): string {
    return `TestPass${Math.random().toString(36).substring(2)}!`;
  }

  static randomName(): string {
    const firstNames = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Riley'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Davis'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${firstName} ${lastName}`;
  }
}

/**
 * 移動端測試助手
 */
export class MobileHelpers {
  /**
   * 模擬觸摸手勢
   */
  static async swipe(
    page: Page, 
    startX: number, 
    startY: number, 
    endX: number, 
    endY: number, 
    duration = 300
  ): Promise<void> {
    await page.touchscreen.tap(startX, startY);
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      const x = startX + (endX - startX) * (i / steps);
      const y = startY + (endY - startY) * (i / steps);
      await page.mouse.move(x, y);
      await page.waitForTimeout(duration / steps);
    }
    
    await page.mouse.up();
  }

  /**
   * 向左滑動（用於配對功能）
   */
  static async swipeLeft(page: Page, element?: Locator): Promise<void> {
    if (element) {
      const box = await element.boundingBox();
      if (box) {
        await this.swipe(
          page,
          box.x + box.width * 0.8,
          box.y + box.height / 2,
          box.x + box.width * 0.2,
          box.y + box.height / 2
        );
      }
    } else {
      const viewport = page.viewportSize();
      if (viewport) {
        await this.swipe(
          page,
          viewport.width * 0.8,
          viewport.height / 2,
          viewport.width * 0.2,
          viewport.height / 2
        );
      }
    }
  }

  /**
   * 向右滑動（用於配對功能）
   */
  static async swipeRight(page: Page, element?: Locator): Promise<void> {
    if (element) {
      const box = await element.boundingBox();
      if (box) {
        await this.swipe(
          page,
          box.x + box.width * 0.2,
          box.y + box.height / 2,
          box.x + box.width * 0.8,
          box.y + box.height / 2
        );
      }
    } else {
      const viewport = page.viewportSize();
      if (viewport) {
        await this.swipe(
          page,
          viewport.width * 0.2,
          viewport.height / 2,
          viewport.width * 0.8,
          viewport.height / 2
        );
      }
    }
  }
}