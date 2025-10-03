/**
 * Unified Brand Voice Processor
 * Standardizes brand voice data handling across all AI content generation stages
 */

import Anthropic from '@anthropic-ai/sdk';

// Lazy initialization to ensure environment variables are loaded
let anthropic = null;

const getAnthropicClient = () => {
  if (!anthropic && process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here') {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
};

/**
 * Process and standardize brand voice data for AI consumption
 * @param {object} rawBrandVoiceData - Raw brand voice data from database
 * @returns {object} Standardized brand voice context
 */
export function processBrandVoice(rawBrandVoiceData = {}) {
  const safeBrandVoiceData = rawBrandVoiceData || {};
  
  // Extract core brand voice elements with fallbacks
  const processed = {
    // Company identification
    companyName: safeBrandVoiceData.companyName || 'this company',
    industry: safeBrandVoiceData.industry || 'Technology',
    
    // Audience and positioning
    targetAudience: safeBrandVoiceData.targetAudience || 'Business professionals',
    tone: safeBrandVoiceData.tone || 'Professional, helpful, authoritative',
    
    // Content guidance
    keywords: safeBrandVoiceData.keywords || generateIndustryKeywords(safeBrandVoiceData.industry),
    painPoints: safeBrandVoiceData.painPoints || generateIndustryPainPoints(safeBrandVoiceData.industry),
    
    // Visual branding (check both colors and brandColors for compatibility)
    colors: safeBrandVoiceData.colors || safeBrandVoiceData.brandColors || [],
    brandColors: safeBrandVoiceData.brandColors || safeBrandVoiceData.colors || [],
    
    // Content samples (safely truncated)
    websiteContent: safeBrandVoiceData.websiteContent ? 
      safeBrandVoiceData.websiteContent.substring(0, 1000) : null,
    socialMediaSamples: safeBrandVoiceData.socialMediaSamples || [],
    
    // Raw data for specific use cases
    raw: safeBrandVoiceData
  };
  
  return processed;
}

/**
 * Format brand voice for AI prompt consumption
 * @param {object} processedBrandVoice - Output from processBrandVoice()
 * @param {string} format - 'structured' | 'narrative' | 'context'
 * @returns {string} Formatted brand voice string for AI prompts
 */
export function formatBrandVoiceForPrompt(processedBrandVoice, format = 'structured') {
  switch (format) {
    case 'structured':
      return `Company: ${processedBrandVoice.companyName}
Industry: ${processedBrandVoice.industry}
Target Audience: ${processedBrandVoice.targetAudience}
Tone: ${processedBrandVoice.tone}
Key Keywords: ${processedBrandVoice.keywords.join(', ')}
Pain Points to Address: ${processedBrandVoice.painPoints.join(', ')}`;

    case 'narrative':
      return `${processedBrandVoice.companyName} is a ${processedBrandVoice.industry} company targeting ${processedBrandVoice.targetAudience}. Their brand voice is ${processedBrandVoice.tone}, focusing on addressing key pain points like ${processedBrandVoice.painPoints.slice(0, 3).join(', ')}.`;

    case 'context':
      return `Brand Context:
- Company: ${processedBrandVoice.companyName}
- Industry: ${processedBrandVoice.industry}
- Audience: ${processedBrandVoice.targetAudience}
- Voice: ${processedBrandVoice.tone}
- Focus Areas: ${processedBrandVoice.keywords.slice(0, 5).join(', ')}
${processedBrandVoice.websiteContent ? `- Website Tone Reference: "${processedBrandVoice.websiteContent.substring(0, 200)}..."` : ''}`;

    default:
      return formatBrandVoiceForPrompt(processedBrandVoice, 'structured');
  }
}

/**
 * Generate industry-specific keywords
 * @param {string} industry - Industry name
 * @returns {string[]} Array of relevant keywords
 */
function generateIndustryKeywords(industry) {
  const keywordMap = {
    'E-commerce': ['marketplace', 'product listings', 'inventory management', 'conversion rates', 'cart abandonment', 'checkout optimization'],
    'Amazon Selling': ['listing management', 'catalog optimization', 'bulk editing', 'Amazon variations', 'Seller Central', 'flat files', 'ASIN management', 'brand registry', 'listing errors', 'catalog health'],
    'amazon selling, marketing agency': ['Amazon PPC', 'listing optimization', 'Amazon growth', 'seller management', 'Amazon advertising', 'conversion rates', 'TikTok marketing', 'D2C brands', 'marketplace growth'],
    'SaaS': ['user onboarding', 'feature adoption', 'churn reduction', 'product-market fit', 'customer success', 'API integration'],
    'Marketing': ['lead generation', 'conversion optimization', 'customer acquisition', 'brand awareness', 'content strategy', 'performance metrics'],
    'Technology': ['automation', 'scalability', 'integration', 'workflow optimization', 'digital transformation', 'efficiency gains'],
    'General Business': ['operational efficiency', 'growth strategies', 'customer experience', 'business optimization', 'competitive advantage', 'market positioning']
  };
  
  // Try exact match first, then fallback to partial matches
  if (keywordMap[industry]) {
    return keywordMap[industry];
  }
  
  // Check for partial matches
  if (industry?.toLowerCase().includes('amazon')) {
    return keywordMap['amazon selling, marketing agency'];
  }
  if (industry?.toLowerCase().includes('marketing')) {
    return keywordMap['Marketing'];
  }
  
  return keywordMap['General Business'];
}

/**
 * Generate industry-specific pain points
 * @param {string} industry - Industry name
 * @returns {string[]} Array of relevant pain points
 */
function generateIndustryPainPoints(industry) {
  const painPointMap = {
    'E-commerce': ['cart abandonment', 'inventory tracking', 'product discovery', 'conversion rates', 'customer retention'],
    'Amazon Selling': ['listing errors', 'catalog inconsistencies', 'bulk operations', 'variation management', 'compliance issues'],
    'amazon selling, marketing agency': ['Amazon advertising complexity', 'low conversion rates', 'high ACoS', 'poor listing performance', 'marketplace competition', 'inconsistent growth'],
    'SaaS': ['user adoption', 'feature complexity', 'onboarding friction', 'integration challenges', 'churn risk'],
    'Marketing': ['lead quality', 'attribution tracking', 'campaign performance', 'audience targeting', 'ROI measurement'],
    'Technology': ['system integration', 'process automation', 'data silos', 'workflow bottlenecks', 'scalability concerns'],
    'General Business': ['operational inefficiencies', 'growth bottlenecks', 'customer satisfaction', 'competitive pressure', 'resource allocation']
  };
  
  // Try exact match first, then fallback to partial matches
  if (painPointMap[industry]) {
    return painPointMap[industry];
  }
  
  // Check for partial matches
  if (industry?.toLowerCase().includes('amazon')) {
    return painPointMap['amazon selling, marketing agency'];
  }
  if (industry?.toLowerCase().includes('marketing')) {
    return painPointMap['Marketing'];
  }
  
  return painPointMap['General Business'];
}

/**
 * Validate brand voice completeness and suggest improvements
 * @param {object} brandVoiceData - Raw brand voice data
 * @returns {object} Validation results with suggestions
 */
export function validateBrandVoice(brandVoiceData) {
  const processed = processBrandVoice(brandVoiceData);
  const completeness = {
    hasCompanyName: !!processed.companyName && processed.companyName !== 'this company',
    hasIndustry: !!processed.industry && processed.industry !== 'Technology',
    hasTargetAudience: !!processed.targetAudience && processed.targetAudience !== 'Business professionals',
    hasCustomTone: !!processed.tone && processed.tone !== 'Professional, helpful, authoritative',
    hasWebsiteContent: !!processed.websiteContent,
    hasCustomKeywords: !!brandVoiceData.keywords,
    hasColors: processed.colors.length > 0
  };
  
  const score = Object.values(completeness).filter(Boolean).length / Object.keys(completeness).length;
  
  return {
    score: Math.round(score * 100),
    completeness,
    suggestions: generateBrandVoiceSuggestions(completeness),
    processed
  };
}

/**
 * Generate suggestions for improving brand voice data
 * @param {object} completeness - Completeness analysis
 * @returns {string[]} Array of improvement suggestions
 */
function generateBrandVoiceSuggestions(completeness) {
  const suggestions = [];
  
  if (!completeness.hasCompanyName) {
    suggestions.push('Add company name for personalized content generation');
  }
  if (!completeness.hasIndustry) {
    suggestions.push('Specify industry for relevant keywords and pain points');
  }
  if (!completeness.hasTargetAudience) {
    suggestions.push('Define target audience for better content targeting');
  }
  if (!completeness.hasCustomTone) {
    suggestions.push('Customize brand tone beyond the default professional voice');
  }
  if (!completeness.hasWebsiteContent) {
    suggestions.push('Include website content samples for tone reference');
  }
  if (!completeness.hasCustomKeywords) {
    suggestions.push('Add custom keywords to complement industry defaults');
  }
  if (!completeness.hasColors) {
    suggestions.push('Specify brand colors for image generation');
  }
  
  return suggestions;
}

/**
 * Analyze website visual style using screenshot (if available) or text content
 * @param {object} brandVoiceData - Raw brand voice data including website content
 * @param {string} screenshotBase64 - Optional base64-encoded screenshot
 * @returns {Promise<object>} Visual style profile with mood, design language, and visual elements
 */
export async function analyzeWebsiteVisualStyle(brandVoiceData, screenshotBase64 = null) {
  // Only use cache if NO new screenshot is provided
  // If screenshotBase64 is provided, always re-analyze to get fresh data
  if (!screenshotBase64 && brandVoiceData.visualStyleProfile && brandVoiceData.visualStyleProfile.analyzed) {
    console.log('📊 Using cached visual style analysis (no new screenshot)');
    return brandVoiceData.visualStyleProfile;
  }

  if (screenshotBase64) {
    console.log('🔄 New screenshot provided - performing fresh analysis (ignoring cache)');
  }

  const client = getAnthropicClient();
  if (!client) {
    console.log('⚠️ No Anthropic API key - using basic visual style');
    return getBasicVisualStyle(brandVoiceData);
  }

  try {
    const websiteContent = brandVoiceData.websiteContent || '';
    const brandColors = brandVoiceData.brandColors || brandVoiceData.colors || [];
    const industry = brandVoiceData.industry || 'Business';
    const targetAudience = brandVoiceData.targetAudience || 'Professionals';

    // If screenshot is provided, use vision analysis
    if (screenshotBase64) {
      return await analyzeScreenshotVisualStyle(
        client,
        screenshotBase64,
        { industry, targetAudience, brandColors, websiteContent }
      );
    }

    // Otherwise fall back to text-based analysis
    if (!websiteContent || websiteContent.length < 50) {
      console.log('⚠️ Insufficient website content - using basic visual style');
      return getBasicVisualStyle(brandVoiceData);
    }

    const prompt = `Analyze this company's website content to infer their visual design style and aesthetic preferences for image generation.

WEBSITE CONTENT:
${websiteContent.substring(0, 2000)}

BRAND CONTEXT:
- Industry: ${industry}
- Target Audience: ${targetAudience}
- Brand Colors: ${brandColors.length > 0 ? brandColors.map(c => '#' + c).join(', ') : 'Not specified'}

ANALYSIS INSTRUCTIONS:
Based on the language, tone, and content structure, infer:

1. **Design Mood**: What emotional tone does the content convey?
   - Options: Bold & Dynamic, Modern & Clean, Professional & Corporate, Playful & Creative, Minimal & Elegant, Trustworthy & Stable

2. **Visual Language**: What visual style would match this content?
   - Consider: geometric vs organic, structured vs fluid, bold vs subtle

3. **Composition Style**: How should images be composed?
   - Consider: symmetry, balance, negative space, focal points, energy level

4. **Visual Metaphors**: What imagery would resonate with this brand?
   - Industry-specific visuals (e.g., growth charts for agencies, interfaces for SaaS)
   - Abstract representations of their value proposition

5. **Energy Level**: What pace/intensity should visuals convey?
   - High energy (action, movement) vs Calm (stability, trust)

Return ONLY valid JSON:
{
  "mood": "Bold & Dynamic",
  "designLanguage": "Clean geometric shapes with dynamic angles and upward movement",
  "compositionStyle": "Asymmetric layouts with growth-focused elements, high energy",
  "visualMetaphors": ["growth charts", "upward arrows", "marketplace icons", "mobile screens with metrics"],
  "energyLevel": "high",
  "colorSuggestions": "Vibrant primary color with professional neutrals",
  "keyCharacteristics": ["action-oriented", "results-driven", "modern"],
  "analyzed": true,
  "analysisType": "text"
}`;

    const completion = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: `You are a visual design analyst that determines image generation styles from website content. Always respond with valid JSON only, no other text.\n\n${prompt}`
        }
      ]
    });

    let responseText = completion.content[0]?.text || '{}';

    // Clean markdown if present
    if (responseText.includes('```')) {
      const match = responseText.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
      if (match) {
        responseText = match[1].trim();
      }
    }

    const visualStyle = JSON.parse(responseText);
    visualStyle.analyzed = true;
    visualStyle.analysisType = 'text';

    console.log(`✨ Visual style analyzed (text): ${visualStyle.mood}, ${visualStyle.energyLevel} energy`);

    return visualStyle;

  } catch (error) {
    console.error('❌ Error analyzing visual style:', error);
    return getBasicVisualStyle(brandVoiceData);
  }
}

/**
 * Analyze website visual style using Claude Vision API with screenshot
 * @param {object} client - Anthropic client
 * @param {string} screenshotBase64 - Base64-encoded screenshot
 * @param {object} context - Brand context (industry, audience, colors, websiteContent)
 * @returns {Promise<object>} Visual style profile
 */
async function analyzeScreenshotVisualStyle(client, screenshotBase64, context) {
  console.log('🔍 Analyzing visual style from screenshot...');

  const { industry, targetAudience, brandColors, websiteContent } = context;

  const prompt = `Analyze this website screenshot to extract EXACT visual design characteristics for matching brand style in AI-generated images.

BRAND CONTEXT:
- Industry: ${industry}
- Target Audience: ${targetAudience}
- Declared Brand Colors: ${brandColors.length > 0 ? brandColors.map(c => '#' + c).join(', ') : 'Not specified'}
${websiteContent ? `- Website Messaging: "${websiteContent.substring(0, 500)}..."` : ''}

CRITICAL: Extract ACTUAL visual characteristics from the screenshot, not inferred or generic descriptions.

REQUIRED ANALYSIS:

1. **Exact Color Palette** (CRITICAL):
   - Extract 3-5 DISTINCT dominant colors as HEX codes (e.g., #FF5733, #2C3E50)
   - IMPORTANT: Each color MUST be different. Do not repeat the same color.
   - Identify: Primary brand color (buttons/CTAs), Secondary color (different from primary), Accent color (highlights/links), Background colors
   - If only one brand color is visible, look for subtle variations or complementary colors used elsewhere
   - Note color usage: buttons, headings, backgrounds, highlights

2. **Design Style Classification** (pick ONE):
   - Flat Design (solid colors, no shadows/gradients)
   - Material Design (subtle shadows, elevation layers, bold colors)
   - Neumorphism (soft shadows, subtle 3D effects)
   - Glassmorphism (transparency, blur effects, frosted glass)
   - Skeuomorphic (realistic textures, 3D depth)
   - Minimalist (lots of whitespace, simple elements)
   - Brutalist (raw, bold typography, grid-based)

3. **Typography Analysis**:
   - Font style: Sans-serif/Serif/Display/Monospace
   - Weight: Thin/Regular/Bold/Black
   - Hierarchy: How headings/body text are differentiated
   - Letter spacing and line height patterns

4. **Icon/Imagery Style** (if icons/images present):
   - Line icons (outline, stroke-based)
   - Filled icons (solid, filled shapes)
   - Gradient icons (color transitions)
   - Illustrated/Hand-drawn
   - Photographic (realistic, abstract, or conceptual)
   - 3D rendered
   - Isometric

5. **Visual Effects**:
   - Border radius: Sharp corners (0px) / Slightly rounded (4-8px) / Heavily rounded (16px+) / Pill-shaped
   - Shadows: None / Subtle / Strong drop shadows / Layered shadows
   - Gradients: Present or absent? Linear/Radial? Color stops?
   - Spacing: Tight / Normal / Generous whitespace

6. **Layout Patterns**:
   - Grid-based / Asymmetric / Centered / Split-screen
   - Card-based design / Full-bleed sections / Boxed content
   - Hero section style

7. **Motion/Energy Level**:
   - High energy: Dynamic angles, diagonal lines, action-oriented
   - Medium energy: Balanced, professional, structured
   - Low energy: Calm, minimal, lots of space

8. **Brand Mood**: Bold & Dynamic / Modern & Clean / Professional & Corporate / Playful & Creative / Minimal & Elegant / Trustworthy & Stable

Return ONLY valid JSON with ACTUAL extracted values:
{
  "exactColors": {
    "primary": "#FF5733",
    "secondary": "#2C3E50",
    "accent": "#F1C40F",
    "background": "#FFFFFF",
    "text": "#333333"
  },
  "designStyle": "Material Design",
  "typography": {
    "style": "Sans-serif",
    "weight": "Bold for headings, Regular for body",
    "hierarchy": "Large bold headings with medium body text",
    "characteristics": "Modern, clean, high contrast"
  },
  "iconImageryStyle": "Filled icons with gradient accents",
  "visualEffects": {
    "borderRadius": "8px - slightly rounded",
    "shadows": "Subtle elevation shadows",
    "gradients": "Linear gradients on CTAs",
    "spacing": "Generous whitespace"
  },
  "layoutPattern": "Grid-based with card components",
  "energyLevel": "high",
  "mood": "Bold & Dynamic",
  "designLanguage": "Modern Material Design with bold typography and strong color contrast",
  "imageGenerationGuidance": "Use flat/subtle 3D style with bold primary color #FF5733, clean geometric shapes, modern sans-serif implied text styling, high contrast, professional photography or abstract geometric illustrations",
  "keyCharacteristics": ["modern", "bold", "material-design", "high-contrast"],
  "analyzed": true,
  "analysisType": "screenshot"
}`;

  try {
    const completion = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: screenshotBase64
              }
            },
            {
              type: 'text',
              text: `You are a visual design analyst. Analyze this website screenshot and respond with valid JSON only, no other text.\n\n${prompt}`
            }
          ]
        }
      ]
    });

    let responseText = completion.content[0]?.text || '{}';

    // Clean markdown if present
    if (responseText.includes('```')) {
      const match = responseText.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
      if (match) {
        responseText = match[1].trim();
      }
    }

    const visualStyle = JSON.parse(responseText);
    visualStyle.analyzed = true;
    visualStyle.analysisType = 'screenshot';

    console.log(`✨ Visual style analyzed (screenshot): ${visualStyle.mood}, ${visualStyle.energyLevel} energy`);

    return visualStyle;

  } catch (error) {
    console.error('❌ Error analyzing screenshot:', error);
    // Fall back to basic style
    const fallback = getBasicVisualStyle({ industry, brandColors });
    fallback.analysisType = 'fallback';
    return fallback;
  }
}

/**
 * Generate basic visual style profile without AI analysis
 * @param {object} brandVoiceData - Raw brand voice data
 * @returns {object} Basic visual style profile
 */
function getBasicVisualStyle(brandVoiceData) {
  const industry = brandVoiceData.industry || '';
  const brandColors = brandVoiceData.brandColors || brandVoiceData.colors || [];

  // Industry-based defaults
  let mood = 'Professional & Corporate';
  let visualMetaphors = ['business charts', 'professional icons'];
  let energyLevel = 'medium';

  if (industry.toLowerCase().includes('amazon') || industry.toLowerCase().includes('ecommerce')) {
    mood = 'Bold & Dynamic';
    visualMetaphors = ['growth charts', 'shopping carts', 'marketplace icons', 'upward trends'];
    energyLevel = 'high';
  } else if (industry.toLowerCase().includes('saas') || industry.toLowerCase().includes('software')) {
    mood = 'Modern & Clean';
    visualMetaphors = ['interface mockups', 'dashboards', 'digital workflows'];
    energyLevel = 'medium';
  } else if (industry.toLowerCase().includes('marketing') || industry.toLowerCase().includes('agency')) {
    mood = 'Bold & Dynamic';
    visualMetaphors = ['growth metrics', 'campaign visuals', 'analytics'];
    energyLevel = 'high';
  }

  return {
    mood,
    designLanguage: 'Clean professional design',
    compositionStyle: 'Balanced composition with clear focal points',
    visualMetaphors,
    energyLevel,
    colorSuggestions: brandColors.length > 0 ? 'Brand colors with professional accents' : 'Professional color palette',
    keyCharacteristics: ['professional', 'clear', 'business-appropriate'],
    analyzed: false
  };
}