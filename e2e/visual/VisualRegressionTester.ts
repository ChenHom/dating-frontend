/**
 * Visual Regression Testing System
 * 視覺回歸測試系統 - 截圖比較和視覺驗證
 */

import { Page, expect } from '@playwright/test';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

export interface VisualTestOptions {
  threshold?: number;
  fullPage?: boolean;
  animations?: 'disabled' | 'allow';
  mask?: string[];
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface VisualTestResult {
  passed: boolean;
  screenshotPath: string;
  baselinePath?: string;
  diffPath?: string;
  pixelDifference?: number;
  percentage?: number;
}

export class VisualRegressionTester {
  private page: Page;
  private baselineDir: string;
  private actualDir: string;
  private diffDir: string;
  private defaultThreshold: number;

  constructor(page: Page, baseDir: string = './e2e/visual') {
    this.page = page;
    this.baselineDir = path.join(baseDir, 'baseline');
    this.actualDir = path.join(baseDir, 'actual');
    this.diffDir = path.join(baseDir, 'diff');
    this.defaultThreshold = 0.2; // 20% threshold by default

    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    for (const dir of [this.baselineDir, this.actualDir, this.diffDir]) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Generate a unique test name based on test context
   */
  private generateTestName(testName: string, viewport?: { width: number; height: number }): string {
    const viewportSuffix = viewport ? `_${viewport.width}x${viewport.height}` : '';
    const sanitized = testName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    return `${sanitized}${viewportSuffix}`;
  }

  /**
   * Take a screenshot and compare with baseline
   */
  async compareScreen(
    testName: string, 
    options: VisualTestOptions = {}
  ): Promise<VisualTestResult> {
    const {
      threshold = this.defaultThreshold,
      fullPage = true,
      animations = 'disabled',
      mask = [],
      clip
    } = options;

    // Disable animations for consistent screenshots
    if (animations === 'disabled') {
      await this.page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
            transform: none !important;
          }
        `
      });
    }

    const viewport = this.page.viewportSize();
    const uniqueTestName = this.generateTestName(testName, viewport || undefined);
    
    const actualPath = path.join(this.actualDir, `${uniqueTestName}.png`);
    const baselinePath = path.join(this.baselineDir, `${uniqueTestName}.png`);
    const diffPath = path.join(this.diffDir, `${uniqueTestName}.png`);

    // Take screenshot
    const screenshotOptions: any = { 
      path: actualPath, 
      fullPage,
      animations: 'disabled'
    };

    if (clip) {
      screenshotOptions.clip = clip;
    }

    // Mask dynamic elements
    const maskSelectors = [
      '[data-testid*="timestamp"]',
      '[data-testid*="time"]',
      '.timestamp',
      ...mask
    ];

    try {
      for (const selector of maskSelectors) {
        const elements = await this.page.locator(selector).all();
        if (elements.length > 0) {
          screenshotOptions.mask = elements;
        }
      }
    } catch (error) {
      // Ignore mask errors
    }

    await this.page.screenshot(screenshotOptions);

    // Check if baseline exists
    const baselineExists = await fs.access(baselinePath).then(() => true).catch(() => false);

    if (!baselineExists) {
      // First run - copy actual as baseline
      await fs.copyFile(actualPath, baselinePath);
      return {
        passed: true,
        screenshotPath: actualPath,
        baselinePath
      };
    }

    // Compare with baseline using Playwright's visual comparison
    try {
      await expect(this.page).toHaveScreenshot(`${uniqueTestName}.png`, {
        threshold,
        fullPage,
        animations: 'disabled',
        mask: maskSelectors.length > 0 ? this.page.locator(maskSelectors.join(', ')) : undefined,
        clip
      });

      return {
        passed: true,
        screenshotPath: actualPath,
        baselinePath
      };
    } catch (error) {
      // Visual comparison failed - generate diff
      const diffExists = await fs.access(diffPath).then(() => true).catch(() => false);
      
      return {
        passed: false,
        screenshotPath: actualPath,
        baselinePath,
        diffPath: diffExists ? diffPath : undefined
      };
    }
  }

  /**
   * Test specific element visual regression
   */
  async compareElement(
    selector: string,
    testName: string,
    options: VisualTestOptions = {}
  ): Promise<VisualTestResult> {
    await this.page.waitForSelector(selector, { timeout: 5000 });
    
    const element = this.page.locator(selector);
    const boundingBox = await element.boundingBox();
    
    if (!boundingBox) {
      throw new Error(`Element ${selector} not found or not visible`);
    }

    return this.compareScreen(testName, {
      ...options,
      clip: boundingBox,
      fullPage: false
    });
  }

  /**
   * Run visual regression test suite for a page
   */
  async testPageVisuals(
    pageName: string,
    tests: Array<{
      name: string;
      selector?: string;
      options?: VisualTestOptions;
    }>
  ): Promise<{ passed: number; failed: number; results: VisualTestResult[] }> {
    const results: VisualTestResult[] = [];
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        let result: VisualTestResult;
        
        if (test.selector) {
          result = await this.compareElement(
            test.selector,
            `${pageName}_${test.name}`,
            test.options
          );
        } else {
          result = await this.compareScreen(
            `${pageName}_${test.name}`,
            test.options
          );
        }

        results.push(result);
        
        if (result.passed) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        results.push({
          passed: false,
          screenshotPath: '',
        });
        failed++;
      }
    }

    return { passed, failed, results };
  }

  /**
   * Test responsive layouts across different viewports
   */
  async testResponsiveLayouts(
    testName: string,
    viewports: Array<{ width: number; height: number; name: string }>,
    options: VisualTestOptions = {}
  ): Promise<{ [viewport: string]: VisualTestResult }> {
    const results: { [viewport: string]: VisualTestResult } = {};

    for (const viewport of viewports) {
      await this.page.setViewportSize(viewport);
      await this.page.waitForTimeout(500); // Allow layout to settle
      
      const result = await this.compareScreen(
        `${testName}_${viewport.name}`,
        options
      );
      
      results[viewport.name] = result;
    }

    return results;
  }

  /**
   * Clean up old test artifacts
   */
  async cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    const directories = [this.actualDir, this.diffDir];
    
    for (const dir of directories) {
      try {
        const files = await fs.readdir(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = await fs.stat(filePath);
          
          if (Date.now() - stats.mtime.getTime() > maxAge) {
            await fs.unlink(filePath);
          }
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Generate visual test report
   */
  async generateReport(results: VisualTestResult[]): Promise<string> {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    const report = {
      summary: {
        total: results.length,
        passed,
        failed,
        passRate: `${((passed / results.length) * 100).toFixed(1)}%`
      },
      timestamp: new Date().toISOString(),
      results: results.map((result, index) => ({
        test: index + 1,
        passed: result.passed,
        screenshot: result.screenshotPath,
        baseline: result.baselinePath,
        diff: result.diffPath
      }))
    };

    const reportPath = path.join(this.diffDir, 'visual-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    return reportPath;
  }
}

export default VisualRegressionTester;