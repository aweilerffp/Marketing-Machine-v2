/**
 * Unified Brand Voice Processor
 * Standardizes brand voice data handling across all AI content generation stages
 */

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
    
    // Visual branding
    colors: safeBrandVoiceData.colors || [],
    
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
    'SaaS': ['user onboarding', 'feature adoption', 'churn reduction', 'product-market fit', 'customer success', 'API integration'],
    'Marketing': ['lead generation', 'conversion optimization', 'customer acquisition', 'brand awareness', 'content strategy', 'performance metrics'],
    'Technology': ['automation', 'scalability', 'integration', 'workflow optimization', 'digital transformation', 'efficiency gains'],
    'General Business': ['operational efficiency', 'growth strategies', 'customer experience', 'business optimization', 'competitive advantage', 'market positioning']
  };
  
  return keywordMap[industry] || keywordMap['General Business'];
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
    'SaaS': ['user adoption', 'feature complexity', 'onboarding friction', 'integration challenges', 'churn risk'],
    'Marketing': ['lead quality', 'attribution tracking', 'campaign performance', 'audience targeting', 'ROI measurement'],
    'Technology': ['system integration', 'process automation', 'data silos', 'workflow bottlenecks', 'scalability concerns'],
    'General Business': ['operational inefficiencies', 'growth bottlenecks', 'customer satisfaction', 'competitive pressure', 'resource allocation']
  };
  
  return painPointMap[industry] || painPointMap['General Business'];
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