import OpenAI from 'openai';
import { processBrandVoice, formatBrandVoiceForPrompt } from './brandVoiceProcessor.js';
import { getCustomLinkedInPrompt } from './promptGeneration.js';
import prisma from '../../models/prisma.js';

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

/**
 * Generate content hooks from meeting transcript using AI
 * @param {string} transcript - The meeting transcript
 * @param {object} brandVoiceData - Company's brand voice data
 * @param {string[]} contentPillars - Content pillar categories
 * @returns {Promise<string[]>} Array of content hooks
 */
export async function generateContentHooks(transcript, brandVoiceData, contentPillars = []) {
  // If no OpenAI key, return mock data
  if (!openai || !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.log('🤖 Using mock AI - no OpenAI key configured');
    return getMockContentHooks(transcript, brandVoiceData);
  }

  try {
    const prompt = `
You are a LinkedIn content strategist for ${brandVoiceData.industry || 'technology'} companies.

Company Context:
- Industry: ${brandVoiceData.industry || 'Technology'}
- Target Audience: ${brandVoiceData.targetAudience || 'Business professionals'}
- Brand Voice: Professional, helpful, and authoritative

Meeting Transcript:
${transcript}

Extract 3-5 key content hooks from this meeting that would make engaging LinkedIn posts. Each hook should be:
1. Actionable and valuable to the target audience
2. Specific and concrete (include numbers, examples, or specific problems/solutions)
3. Aligned with the company's expertise and brand voice
4. Written as a complete thought or insight

Format: Return only the hooks, one per line, without numbering or bullets.
`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a LinkedIn content strategist that extracts valuable content hooks from meeting transcripts.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    const response = completion.choices[0]?.message?.content || '';
    const hooks = response.split('\n').filter(hook => hook.trim().length > 0);

    console.log(`✨ Generated ${hooks.length} content hooks using AI`);
    return hooks;

  } catch (error) {
    console.error('❌ Error generating content hooks:', error);
    // Fallback to mock data
    return getMockContentHooks(transcript, brandVoiceData);
  }
}

/**
 * Generate LinkedIn post from content hook using AI
 * @param {string} hook - The content hook
 * @param {object} brandVoiceData - Company's brand voice data
 * @param {string[]} contentPillars - Content pillar categories
 * @returns {Promise<object>} LinkedIn post content and image prompt
 */
export async function generateLinkedInPost(hook, brandVoiceData, contentPillars = []) {
  // If no OpenAI key, return mock data
  if (!openai || !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.log('🤖 Using mock AI - no OpenAI key configured');
    return getMockLinkedInPost(hook, brandVoiceData);
  }

  try {
    const prompt = `
Create a LinkedIn post for a ${brandVoiceData.industry || 'technology'} company.

Company Context:
- Industry: ${brandVoiceData.industry || 'Technology'}
- Target Audience: ${brandVoiceData.targetAudience || 'Business professionals'}
- Brand Voice: Professional, helpful, and authoritative

Content Hook:
${hook}

Website Content Context (for tone reference):
${brandVoiceData.websiteContent ? brandVoiceData.websiteContent.substring(0, 500) + '...' : 'Professional technology company content'}

Create a LinkedIn post that:
1. Opens with a compelling hook that grabs attention
2. Provides valuable insight or actionable advice
3. Uses a conversational but professional tone
4. Includes a call-to-action or thought-provoking question
5. Is optimized for LinkedIn engagement (150-300 words)
6. Matches the brand's voice and target audience

Format your response as JSON:
{
  "content": "The LinkedIn post content",
  "imagePrompt": "A brief description for an image that would complement this post"
}
`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a LinkedIn content creator that writes engaging posts for business professionals. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.7
    });

    const response = completion.choices[0]?.message?.content || '';
    
    try {
      const result = JSON.parse(response);
      console.log('📱 Generated LinkedIn post using AI');
      return result;
    } catch (parseError) {
      console.warn('⚠️ Failed to parse AI response as JSON, using fallback');
      return {
        content: response,
        imagePrompt: "Professional business illustration related to the post content"
      };
    }

  } catch (error) {
    console.error('❌ Error generating LinkedIn post:', error);
    // Fallback to mock data
    return getMockLinkedInPost(hook, brandVoiceData);
  }
}

/**
 * Mock content hooks for when AI is not available
 */
function getMockContentHooks(transcript, brandVoiceData) {
  const hooks = [
    "93% of Amazon sellers have catalog rot eating away at their revenue, but most don't know until it's too late",
    "The hidden cost of manual listing management: what used to take hours now takes minutes with the right automation",
    "Why Amazon parent-child relationships break overnight and how to prevent silent listing failures",
    "From spreadsheet chaos to streamlined success: how automation transforms Amazon seller operations",
    "The one-click rollback feature that saves Amazon sellers from costly listing mistakes"
  ];
  
  console.log('🤖 Generated mock content hooks (no AI key)');
  return hooks.slice(0, 3); // Return 3 hooks
}

/**
 * Mock LinkedIn post for when AI is not available
 */
function getMockLinkedInPost(hook, brandVoiceData) {
  const processedBrandVoice = processBrandVoice(brandVoiceData);
  
  const post = {
    content: `🚨 ${hook}

Here's what every ${processedBrandVoice.targetAudience} needs to know:

${processedBrandVoice.industry === 'Technology' ? 'Amazon sellers' : 'Business owners'} are losing revenue every day because their listings fail silently. You think everything is working fine, but behind the scenes, your variations are breaking, your content is disappearing, and your sales are suffering.

The solution? Automated monitoring that catches these issues before they cost you money.

✅ Real-time listing health checks
✅ Instant alerts when something breaks  
✅ One-click fixes for common issues
✅ Complete version control and rollbacks

Stop fighting with your catalog. Start focusing on growing your business.

What's the biggest listing challenge you're facing right now? 👇`,
    
    imagePrompt: "Professional dashboard screenshot showing Amazon listing management interface with charts and data"
  };
  
  console.log('🤖 Generated mock LinkedIn post (no AI key)');
  return post;
}

/**
 * Rewrite existing content based on user instructions
 * @param {string} originalContent - The original content to rewrite
 * @param {string} instructions - How to rewrite the content
 * @param {object} brandVoiceData - Company's brand voice data
 * @returns {Promise<string>} Rewritten content
 */
export async function rewriteContent(originalContent, instructions, brandVoiceData) {
  // If no OpenAI key, return mock data
  if (!openai || !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.log('🤖 Using mock AI rewrite - no OpenAI key configured');
    return getMockRewrite(originalContent, instructions);
  }

  try {
    const prompt = `
You are a LinkedIn content editor for ${brandVoiceData.industry || 'technology'} companies.

Company Context:
- Industry: ${brandVoiceData.industry || 'Technology'}
- Target Audience: ${brandVoiceData.targetAudience || 'Business professionals'}
- Brand Voice: Professional, helpful, and authoritative

Original Content:
${originalContent}

Rewrite Instructions:
${instructions}

Please rewrite the content following the instructions while maintaining the company's brand voice and ensuring it's engaging for LinkedIn. Keep it professional and valuable to the target audience.

Return only the rewritten content, no explanations or additional text.
`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a LinkedIn content editor that rewrites posts based on specific instructions while maintaining brand voice.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    const rewrittenContent = completion.choices[0].message.content.trim();
    return rewrittenContent;
  } catch (error) {
    console.error('Error rewriting content with AI:', error);
    return getMockRewrite(originalContent, instructions);
  }
}

/**
 * Generate enhanced LinkedIn post from hook using advanced prompt
 * @param {string} hookText - The content hook text
 * @param {string} pillar - Content pillar category
 * @param {object} brandVoiceData - Company's brand voice data
 * @param {string} meetingSummary - Optional meeting context
 * @param {object} hookContext - Strategic context from hook generation
 * @param {string} companyId - Optional company ID for custom prompt lookup
 * @returns {Promise<object>} Enhanced LinkedIn post content
 */
export async function generateEnhancedLinkedInPost(hookText, pillar, brandVoiceData, meetingSummary = '', hookContext = null, companyId = null) {
  // If no OpenAI key, return mock data
  if (!openai || !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.log('🤖 Using mock enhanced LinkedIn post - no OpenAI key configured');
    return getMockEnhancedLinkedInPost(hookText, pillar, brandVoiceData);
  }

  try {
    // Process brand voice using unified processor
    console.log('🔍 Debug: generateEnhancedLinkedInPost called with:', { hookText, pillar, brandVoiceData: typeof brandVoiceData, meetingSummary: typeof meetingSummary, hookContext: !!hookContext, companyId });
    
    let prompt;
    
    // Try to get custom prompt for the company
    if (companyId) {
      try {
        console.log(`🎯 Attempting to use custom prompt for company: ${companyId}`);
        prompt = await getCustomLinkedInPrompt(companyId);
        console.log(`✨ Using custom LinkedIn prompt for company: ${companyId}`);
      } catch (error) {
        console.warn(`⚠️ Failed to get custom prompt for company ${companyId}, falling back to generic:`, error.message);
        prompt = getGenericLinkedInPrompt();
      }
    } else {
      console.log('📝 No company ID provided, using generic prompt');
      prompt = getGenericLinkedInPrompt(); 
    }

    // Generic LinkedIn prompt function
    function getGenericLinkedInPrompt() {
      return `Create an engaging LinkedIn post based on the provided content hook and context.

## CONTENT REQUIREMENTS
- Write in a professional but conversational tone
- Include actionable insights or advice
- Use engaging hooks and clear structure
- Optimize for LinkedIn engagement
- Keep posts between 150-300 words
- Include relevant emojis sparingly

## INPUT DATA
Hook: "{HOOK_LIST}"
Content Pillar: "${pillar}"

${meetingSummary ? `Meeting Context: "${meetingSummary}"` : ''}

${hookContext ? `
## HOOK GENERATION INSIGHTS
Original Quote: "${hookContext.originalInsight}"
Strategic Reasoning: "${hookContext.reasoning}"
Confidence Score: ${hookContext.confidence}
${hookContext.blog ? `Related Blog Concept: "${hookContext.blog.title}" - ${hookContext.blog.hook}` : ''}
${hookContext.tweet ? `Related Tweet Version: "${hookContext.tweet}"` : ''}
${hookContext.preGeneratedLinkedIn ? `Hook Generator's LinkedIn Attempt: "${hookContext.preGeneratedLinkedIn}" (use as reference only, create something better)` : ''}
` : ''}

Return clean JSON:
{
  "post": "Complete LinkedIn post with natural flow and strong engagement",
  "reasoning": "Brief explanation of approach and architecture chosen", 
  "estimatedCharacterCount": number
}`;
    }

    // Replace hook placeholder in custom prompt
    const hookListPlaceholder = '{HOOK_LIST}';
    if (prompt.includes(hookListPlaceholder)) {
      prompt = prompt.replace(hookListPlaceholder, hookText);
    } else {
      // If custom prompt doesn't have the placeholder, append the hook data
      prompt += `

## INPUT DATA
Hook: "${hookText}"
Content Pillar: "${pillar}"

${meetingSummary ? `Meeting Context: "${meetingSummary}"` : ''}

${hookContext ? `

## HOOK GENERATION INSIGHTS
Original Quote: "${hookContext.originalInsight}"
Strategic Reasoning: "${hookContext.reasoning}"
Confidence Score: ${hookContext.confidence}
${hookContext.blog ? `Related Blog Concept: "${hookContext.blog.title}" - ${hookContext.blog.hook}` : ''}
${hookContext.tweet ? `Related Tweet Version: "${hookContext.tweet}"` : ''}
${hookContext.preGeneratedLinkedIn ? `Hook Generator's LinkedIn Attempt: "${hookContext.preGeneratedLinkedIn}" (use as reference only, create something better)` : ''}
` : ''}

Return clean JSON:
{
  "post": "Complete LinkedIn post with natural flow and strong engagement",
  "reasoning": "Brief explanation of approach and architecture chosen",
  "estimatedCharacterCount": number
}`;
    }

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: `You are an expert LinkedIn content creator that writes engaging posts for business professionals. Always respond with valid JSON.` 
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1500,
      temperature: 0.7
    });

    const response = completion.choices[0]?.message?.content || '';
    
    try {
      const result = JSON.parse(response);
      console.log('📱 Generated enhanced LinkedIn post using AI');
      return result;
    } catch (parseError) {
      console.warn('⚠️ Failed to parse enhanced AI response as JSON, using fallback');
      return {
        post: response,
        reasoning: "AI response parsing failed, using raw content",
        estimatedCharacterCount: response.length
      };
    }

  } catch (error) {
    console.error('❌ Error generating enhanced LinkedIn post:', error);
    return getMockEnhancedLinkedInPost(hookText, pillar, brandVoiceData);
  }
}

/**
 * Mock enhanced LinkedIn post for when AI is not available
 */
function getMockEnhancedLinkedInPost(hookText, pillar, brandVoiceData) {
  console.log('🔍 Debug: getMockEnhancedLinkedInPost called with:', { hookText, pillar, brandVoiceData: typeof brandVoiceData });
  const processedBrandVoice = processBrandVoice(brandVoiceData);
  console.log('🔍 Debug: Mock variables:', { industry: processedBrandVoice.industry, companyName: processedBrandVoice.companyName });
  
  const post = {
    post: `🚨 ${hookText}

Here's what every ${processedBrandVoice.targetAudience} needs to know:

Most ${processedBrandVoice.industry} companies are losing efficiency every day because their processes fail silently. You think everything is working fine, but behind the scenes, your systems are breaking, your data is disappearing, and your productivity is suffering.

The solution? Automated monitoring that catches these issues before they cost you money.

✅ Real-time system health checks
✅ Instant alerts when something breaks  
✅ One-click fixes for common issues
✅ Complete audit trails and rollbacks

Stop fighting with broken processes. Start focusing on growing your business.

What's the biggest ${pillar.toLowerCase()} challenge you're facing right now? 👇`,
    
    reasoning: "Mock post generated due to missing OpenAI configuration",
    estimatedCharacterCount: 650
  };
  
  console.log('🤖 Generated mock enhanced LinkedIn post (no AI key)');
  return post;
}

/**
 * Mock content rewrite for when OpenAI is not available
 */
function getMockRewrite(originalContent, instructions) {
  const mockRewrites = {
    'professional': 'In today\'s competitive business landscape, organizations that prioritize strategic innovation and data-driven decision-making consistently outperform their peers. Here are the key insights every executive should consider...',
    'shorter': originalContent.length > 100 ? originalContent.substring(0, 100) + '...' : originalContent,
    'statistics': originalContent + '\n\n📊 According to recent studies, 73% of companies implementing these strategies see a 25% increase in efficiency.',
    'casual': originalContent.replace(/\./g, '!').replace(/However,/g, 'But hey,').replace(/Therefore,/g, 'So,'),
    'default': `✨ Here's an improved version:\n\n${originalContent}\n\n💡 This approach has proven successful for many industry leaders.`
  };

  // Simple keyword matching for mock responses
  const lowerInstructions = instructions.toLowerCase();
  
  if (lowerInstructions.includes('professional')) {
    return mockRewrites.professional;
  } else if (lowerInstructions.includes('short')) {
    return mockRewrites.shorter;
  } else if (lowerInstructions.includes('statistic') || lowerInstructions.includes('number')) {
    return mockRewrites.statistics;
  } else if (lowerInstructions.includes('casual') || lowerInstructions.includes('friendly')) {
    return mockRewrites.casual;
  } else {
    return mockRewrites.default;
  }
}