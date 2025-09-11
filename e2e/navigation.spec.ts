import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test('should navigate to matches page after login', async ({ page }) => {
    await page.goto('http://localhost:8083');

    // Wait for app to load and navigate to main screen
    await page.waitForTimeout(3000);

    // Check if we're on a protected route or need to login
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Look for any element containing "Matches" to click
    try {
      await page.click('text=Matches', { timeout: 5000 });
      await page.waitForTimeout(500);

      // Verify we're on matches page
      await expect(page).toHaveURL(/.*matches/);
    } catch (error) {
      console.log('Could not find Matches tab element');
      // Take a screenshot to see what's on the page
      await page.screenshot({ path: 'matches-navigation-debug.png' });
      throw error;
    }
  });

  test('should navigate to feed page after login', async ({ page }) => {
    await page.goto('http://localhost:8083');

    // Wait for app to load
    await page.waitForTimeout(3000);

    // Look for feed/discover tab
    try {
      await page.click('text=Discover', { timeout: 5000 });
      await page.waitForTimeout(500);

      // Verify we're on feed page
      await expect(page).toHaveURL(/.*feed/);
    } catch (error) {
      console.log('Could not find Discover tab element');
      // Take a screenshot to see what's on the page
      await page.screenshot({ path: 'feed-navigation-debug.png' });
      throw error;
    }
  });
});
