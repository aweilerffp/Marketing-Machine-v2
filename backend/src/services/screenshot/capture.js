/**
 * Website Screenshot Capture Service
 * Uses Puppeteer to capture website screenshots for visual analysis
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Screenshot storage directory
const SCREENSHOT_DIR = path.join(__dirname, '../../../public/screenshots');

/**
 * Ensure screenshot directory exists
 */
async function ensureScreenshotDir() {
  try {
    await fs.access(SCREENSHOT_DIR);
  } catch {
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  }
}

/**
 * Capture a screenshot of a website
 * @param {string} url - Website URL to capture
 * @param {string} companyId - Company ID for filename
 * @returns {Promise<{screenshotPath: string, screenshotUrl: string, screenshotBase64: string}>}
 */
export async function captureWebsiteScreenshot(url, companyId) {
  let browser = null;

  try {
    console.log(`📸 Capturing screenshot of ${url}...`);

    // Ensure screenshot directory exists
    await ensureScreenshotDir();

    // Launch browser in headless mode
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Set viewport to standard desktop size
    await page.setViewport({
      width: 1280,
      height: 720,
      deviceScaleFactor: 1
    });

    // Set user agent to avoid bot detection
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Navigate to URL with timeout
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait a bit for any animations/lazy loading
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate filename
    const timestamp = Date.now();
    const filename = `${companyId}-${timestamp}.png`;
    const screenshotPath = path.join(SCREENSHOT_DIR, filename);

    // Capture screenshot
    const screenshotBuffer = await page.screenshot({
      type: 'png',
      fullPage: false // Only capture above the fold
    });

    // Save to disk
    await fs.writeFile(screenshotPath, screenshotBuffer);

    // Convert to base64 for Claude Vision API
    const screenshotBase64 = screenshotBuffer.toString('base64');

    const screenshotUrl = `/screenshots/${filename}`;

    console.log(`✅ Screenshot captured: ${screenshotUrl}`);

    return {
      screenshotPath,
      screenshotUrl,
      screenshotBase64
    };

  } catch (error) {
    console.error('❌ Error capturing screenshot:', error);
    throw new Error(`Failed to capture screenshot: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Convert uploaded screenshot file to base64
 * @param {string} filePath - Path to screenshot file
 * @returns {Promise<string>} Base64 encoded image
 */
export async function convertScreenshotToBase64(filePath) {
  try {
    const buffer = await fs.readFile(filePath);
    return buffer.toString('base64');
  } catch (error) {
    console.error('❌ Error converting screenshot to base64:', error);
    throw new Error(`Failed to convert screenshot: ${error.message}`);
  }
}

/**
 * Delete old screenshots for a company
 * @param {string} companyId - Company ID
 */
export async function cleanupOldScreenshots(companyId) {
  try {
    await ensureScreenshotDir();
    const files = await fs.readdir(SCREENSHOT_DIR);

    // Find files matching this company ID
    const companyFiles = files.filter(f => f.startsWith(`${companyId}-`));

    // Sort by timestamp (newest first)
    companyFiles.sort((a, b) => {
      const timestampA = parseInt(a.split('-').pop().replace('.png', ''));
      const timestampB = parseInt(b.split('-').pop().replace('.png', ''));
      return timestampB - timestampA;
    });

    // Keep only the most recent, delete older ones
    for (let i = 1; i < companyFiles.length; i++) {
      const filePath = path.join(SCREENSHOT_DIR, companyFiles[i]);
      await fs.unlink(filePath);
      console.log(`🗑️ Deleted old screenshot: ${companyFiles[i]}`);
    }
  } catch (error) {
    console.error('⚠️ Error cleaning up screenshots:', error);
    // Non-critical error, don't throw
  }
}