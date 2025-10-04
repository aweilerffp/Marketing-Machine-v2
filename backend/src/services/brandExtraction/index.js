/**
 * Brand Extraction Service
 * Analyzes websites, LinkedIn, and YouTube to extract brand voice characteristics
 */

import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { YoutubeTranscript } from 'youtube-transcript';
import Anthropic from '@anthropic-ai/sdk';
import { analyzeWebsiteVisualStyle } from '../ai/brandVoiceProcessor.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * Main function to analyze a website and extract brand information
 * @param {string} url - Website URL to analyze
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<BrandAnalysisResult>}
 */
export async function analyzeWebsite(url, onProgress = null) {
  console.log('🚀🚀🚀 ANALYZE WEBSITE CALLED WITH URL:', url);

  const updateProgress = (step, percentage, message) => {
    console.log(`[${percentage}%] ${step}: ${message}`);
    if (onProgress) {
      onProgress({ step, percentage, message });
    }
  };

  try {
    console.log('📝 Starting website analysis...');
    updateProgress('scraping_website', 10, 'Analyzing website...');

    // Step 1: Scrape website
    const websiteData = await scrapeWebsite(url);

    updateProgress('extracting_colors', 20, 'Extracting brand colors...');

    // Steps 2-4: Run LinkedIn, YouTube, and Claude analysis in PARALLEL for speed
    updateProgress('analyzing_all', 30, 'Analyzing social media and brand voice...');

    const [linkedInData, youtubeData, analysis] = await Promise.all([
      findAndScrapeLinkedIn(websiteData.companyName, url),
      findAndScrapeYouTube(websiteData.companyName, url),
      analyzeWithGPT({
        websiteData,
        linkedInData: { posts: [], linkedInUrl: null }, // Will be filled later if needed
        youtubeData: { videos: [], youtubeUrl: null }
      })
    ]);

    updateProgress('finalizing', 95, 'Finalizing results...');

    // Combine all data
    const result = {
      companyName: analysis.companyName || websiteData.companyName,
      industry: analysis.industry,
      targetAudience: analysis.targetAudience,
      brandVoice: {
        tone: analysis.tone,
        personality: analysis.personality || [],
        style: analysis.style,
        keywords: analysis.keywords || [],
        colors: websiteData.colors || []
      },
      contentPillars: analysis.contentPillars || [],
      websiteContent: websiteData.content,
      socialContent: {
        linkedInPosts: linkedInData.posts || [],
        linkedInUrl: linkedInData.linkedInUrl,
        youtubeVideos: youtubeData.videos || [],
        youtubeUrl: youtubeData.youtubeUrl
      },
      overallConfidence: analysis.overallConfidence,
      warnings: analysis.warnings || [],
      // Include complete visual style profile for image generation
      visualStyleProfile: websiteData.visualStyleProfile
    };

    updateProgress('complete', 100, 'Analysis complete!');

    return result;

  } catch (error) {
    console.error('❌ Brand analysis error:', error);
    throw new Error(`Failed to analyze website: ${error.message}`);
  }
}

/**
 * Scrape website content and extract basic information
 * @param {string} url - Website URL
 * @returns {Promise<WebsiteData>}
 */
async function scrapeWebsite(url) {
  let browser = null;

  try {
    console.log(`🌐 Scraping website: ${url}`);

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    // Navigate to homepage
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Get page content
    const html = await page.content();
    const $ = cheerio.load(html);

    // Extract company name
    const companyName =
      $('meta[property="og:site_name"]').attr('content') ||
      $('title').text().split('|')[0].split('-')[0].trim() ||
      new URL(url).hostname.split('.')[0];

    // Extract meta description
    const description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      '';

    // Extract main content
    let content = '';
    $('h1, h2, p').each((i, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 10) {
        content += text + '\n';
      }
    });

    // Get navigation links for additional pages
    const navLinks = [];
    $('nav a, header a').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim().toLowerCase();

      // Look for about, services, products, etc.
      if (href && (
        text.includes('about') ||
        text.includes('service') ||
        text.includes('product') ||
        text.includes('solution')
      )) {
        try {
          const fullUrl = new URL(href, url).href;
          if (fullUrl.startsWith('http') && navLinks.length < 4) {
            navLinks.push(fullUrl);
          }
        } catch (e) {
          // Invalid URL, skip
        }
      }
    });

    // Scrape additional pages
    for (const link of navLinks.slice(0, 3)) {
      try {
        await page.goto(link, { waitUntil: 'networkidle2', timeout: 15000 });
        const pageHtml = await page.content();
        const $page = cheerio.load(pageHtml);

        $page('h1, h2, p').each((i, el) => {
          const text = $page(el).text().trim();
          if (text && text.length > 10) {
            content += text + '\n';
          }
        });
      } catch (e) {
        console.warn(`⚠️ Failed to scrape ${link}:`, e.message);
      }
    }

    // Go back to homepage for screenshot
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for animations

    // Take screenshot for visual analysis
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false // Above the fold only
    });
    const screenshotBase64 = screenshot.toString('base64');

    await browser.close();

    // Use the WORKING visual style analysis from CompanySettings
    console.log('📸 Screenshot captured, analyzing visual style...');

    const visualStyleData = await analyzeWebsiteVisualStyle(
      { industry: '', targetAudience: '', websiteContent: content },
      screenshotBase64
    );

    // Extract colors from the visual style analysis
    const colorValues = visualStyleData?.exactColors
      ? Object.values(visualStyleData.exactColors)
      : [];

    // Remove duplicates, white, black, and transparent colors
    const uniqueColors = [...new Set(colorValues)].filter(c =>
      c &&
      c !== '#FFFFFF' &&
      c !== '#ffffff' &&
      c !== '#000000' &&
      c !== '#000' &&
      c !== '#FFF' &&
      c !== '#fff' &&
      c.toLowerCase() !== 'transparent'
    );

    let colors = uniqueColors.slice(0, 5); // Max 5 colors

    // If we only got 1 color, ensure we have at least 2-3 by requesting re-analysis
    // or using default complementary colors
    if (colors.length < 2 && colors.length > 0) {
      console.log('⚠️ Only 1 color found, this is unusual. Colors:', colors);
      // Keep the one color we have - frontend will allow manual additions
    }

    console.log('🎨 Visual style analysis complete. Colors found:', colors);

    return {
      companyName,
      description,
      content: content.substring(0, 10000), // Limit content length
      colors,
      pagesScraped: [url, ...navLinks.slice(0, 3)],
      // Store complete visual style for image generation (no re-analysis needed)
      visualStyleProfile: visualStyleData
    };

  } catch (error) {
    if (browser) await browser.close();
    console.error('❌ Website scraping error:', error);
    throw error;
  }
}

// Color extraction now uses analyzeWebsiteVisualStyle from brandVoiceProcessor.js
// This is the PROVEN method that works in CompanySettings screenshot upload

/**
 * Find and scrape LinkedIn company page
 * @param {string} companyName - Company name
 * @param {string} websiteUrl - Company website URL
 * @returns {Promise<LinkedInData>}
 */
async function findAndScrapeLinkedIn(companyName, websiteUrl) {
  let browser = null;

  try {
    console.log(`🔗 Looking for LinkedIn page for ${companyName}...`);

    // Try to find LinkedIn link on the website first
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(websiteUrl, { waitUntil: 'networkidle2', timeout: 20000 });

    const linkedInUrl = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="linkedin.com"]'));
      const companyLink = links.find(link =>
        link.href.includes('/company/') || link.href.includes('/school/')
      );
      return companyLink ? companyLink.href : null;
    });

    if (!linkedInUrl) {
      console.log('⚠️ No LinkedIn page found on website');
      await browser.close();
      return { linkedInUrl: null, posts: [] };
    }

    console.log(`✅ Found LinkedIn page: ${linkedInUrl}`);

    // Note: Actually scraping LinkedIn posts requires authentication and may violate TOS
    // For now, we'll just return the URL. In production, you might use LinkedIn API
    // or a third-party scraping service

    await browser.close();

    return {
      linkedInUrl,
      posts: [] // TODO: Implement LinkedIn API integration
    };

  } catch (error) {
    if (browser) await browser.close();
    console.warn('⚠️ LinkedIn discovery failed:', error.message);
    return { linkedInUrl: null, posts: [] };
  }
}

/**
 * Find and scrape YouTube channel
 * @param {string} companyName - Company name
 * @param {string} websiteUrl - Company website URL
 * @returns {Promise<YouTubeData>}
 */
async function findAndScrapeYouTube(companyName, websiteUrl) {
  let browser = null;

  try {
    console.log(`📺 Looking for YouTube channel for ${companyName}...`);

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(websiteUrl, { waitUntil: 'networkidle2', timeout: 20000 });

    const youtubeUrl = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="youtube.com"]'));
      const channelLink = links.find(link =>
        link.href.includes('/channel/') ||
        link.href.includes('/@') ||
        link.href.includes('/c/')
      );
      return channelLink ? channelLink.href : null;
    });

    await browser.close();

    if (!youtubeUrl) {
      console.log('⚠️ No YouTube channel found on website');
      return { youtubeUrl: null, videos: [] };
    }

    console.log(`✅ Found YouTube channel: ${youtubeUrl}`);

    // Try to get video transcripts
    const videos = await getYouTubeTranscripts(youtubeUrl);

    return {
      youtubeUrl,
      videos
    };

  } catch (error) {
    if (browser) await browser.close();
    console.warn('⚠️ YouTube discovery failed:', error.message);
    return { youtubeUrl: null, videos: [] };
  }
}

/**
 * Get YouTube video transcripts
 * @param {string} channelUrl - YouTube channel URL
 * @returns {Promise<Array>}
 */
async function getYouTubeTranscripts(channelUrl) {
  try {
    // Note: Getting actual transcripts requires finding video IDs first
    // This is a placeholder - in production, you'd scrape the channel page
    // for recent videos or use YouTube API

    console.log('⚠️ YouTube transcript extraction not fully implemented yet');
    return [];

  } catch (error) {
    console.warn('⚠️ YouTube transcript extraction failed:', error.message);
    return [];
  }
}

/**
 * Analyze combined data with Claude
 * @param {Object} data - Combined website, LinkedIn, and YouTube data
 * @returns {Promise<Object>}
 */
async function analyzeWithGPT(data) {
  const { websiteData, linkedInData, youtubeData } = data;

  const prompt = `Analyze the following information about a company and extract brand voice characteristics.

COMPANY INFORMATION:
Company Name: ${websiteData.companyName}
Website Description: ${websiteData.description}

WEBSITE CONTENT:
${websiteData.content.substring(0, 5000)}

SOCIAL MEDIA:
LinkedIn: ${linkedInData.linkedInUrl || 'Not found'}
LinkedIn Posts: ${linkedInData.posts.length > 0 ? linkedInData.posts.join('\n\n') : 'None available'}

YouTube: ${youtubeData.youtubeUrl || 'Not found'}
YouTube Videos: ${youtubeData.videos.length > 0 ? youtubeData.videos.map(v => v.title).join(', ') : 'None available'}

Based on this information, extract and return a JSON object with the following structure:
{
  "companyName": { "value": "...", "confidence": 0.0-1.0, "source": "..." },
  "industry": { "value": "...", "confidence": 0.0-1.0, "source": "..." },
  "targetAudience": { "value": "...", "confidence": 0.0-1.0, "source": "..." },
  "tone": { "value": "...", "confidence": 0.0-1.0 },
  "personality": ["trait1", "trait2", ...],
  "style": { "value": "...", "confidence": 0.0-1.0 },
  "keywords": ["keyword1", "keyword2", ...],
  "contentPillars": ["pillar1", "pillar2", ...],
  "overallConfidence": 0.0-1.0,
  "warnings": ["warning1", "warning2", ...]
}

Guidelines:
- Be specific and accurate
- Confidence scores should reflect data quality (more sources = higher confidence)
- Include 5-8 personality traits
- Suggest 3-5 content pillars based on what the company talks about
- Add warnings if data is limited or unclear
- For tone, choose from: professional, casual, friendly, authoritative, inspirational, technical, conversational
- For style, choose from: formal, conversational, educational, inspirational, technical, storytelling

Return ONLY valid JSON, no other text.`;

  try {
    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const analysisText = response.content[0].text;
    const analysis = JSON.parse(analysisText);

    // Transform nested confidence objects to simple values
    return {
      companyName: analysis.companyName?.value || websiteData.companyName,
      industry: analysis.industry?.value || '',
      targetAudience: analysis.targetAudience?.value || '',
      tone: analysis.tone?.value || '',
      personality: analysis.personality || [],
      style: analysis.style?.value || '',
      keywords: analysis.keywords || [],
      contentPillars: analysis.contentPillars || [],
      overallConfidence: analysis.overallConfidence || 0.5,
      warnings: analysis.warnings || [],
      // Store confidence scores separately
      confidenceScores: {
        companyName: analysis.companyName?.confidence || 0.9,
        industry: analysis.industry?.confidence || 0.5,
        targetAudience: analysis.targetAudience?.confidence || 0.5,
        tone: analysis.tone?.confidence || 0.5,
        style: analysis.style?.confidence || 0.5
      }
    };

  } catch (error) {
    console.error('❌ Claude analysis error:', error);
    throw new Error(`AI analysis failed: ${error.message}`);
  }
}

/**
 * Helper function to validate URL
 * @param {string} url
 * @returns {boolean}
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
