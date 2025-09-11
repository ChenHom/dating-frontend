import { test, expect } from '@playwright/test';

test.describe('App Navigation Check', () => {
  test('should load app and check current state', async ({ page }) => {
    // 直接訪問應用程式，不依賴認證設定
    await page.goto('http://localhost:8083');

    // 等待應用程式載入
    await page.waitForTimeout(3000);

    // 擷取螢幕截圖以查看應用程式狀態
    await page.screenshot({
      path: 'app-current-state.png',
      fullPage: true
    });

    console.log('Current URL:', page.url());

    // 檢查頁面上有什麼內容
    const pageContent = await page.textContent('body');
    console.log('Page contains:', pageContent?.substring(0, 500));

    // 尋找任何導航相關元素
    const allLinks = await page.locator('a, button, [role="button"]').all();
    console.log('Found', allLinks.length, 'clickable elements');

    for (let i = 0; i < Math.min(allLinks.length, 10); i++) {
      const element = allLinks[i];
      if (element) {
        const text = await element.textContent();
        if (text) {
          console.log(`Element ${i}: "${text.trim()}"`);
        }
      }
    }

    // 檢查是否有 tab 相關元素
    const tabs = await page.locator('[role="tab"], [role="tablist"], .tab, .tabs').all();
    console.log('Found', tabs.length, 'tab-related elements');

    // 尋找包含 "Matches", "Discover", "Chat", "Profile" 的元素
    const navTexts = ['Matches', 'Discover', 'Chat', 'Profile', 'Feed', 'Explore'];
    for (const text of navTexts) {
      const elements = await page.locator(`text=${text}`).all();
      if (elements.length > 0) {
        console.log(`Found ${elements.length} elements with text "${text}"`);
      }
    }
  });
});
