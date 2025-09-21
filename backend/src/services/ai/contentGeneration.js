import Anthropic from '@anthropic-ai/sdk';
import { processBrandVoice, formatBrandVoiceForPrompt } from './brandVoiceProcessor.js';
import { getCustomLinkedInPrompt } from './promptGeneration.js';
import prisma from '../../models/prisma.js';

// Lazy initialization to ensure environment variables are loaded
let anthropic = null;

const buildPlainTextPost = (text) => {
  const cleaned = typeof text === 'string' ? text.trim() : '';
  return {
    post: cleaned,
    reasoning: null,
    estimatedCharacterCount: cleaned.length
  };
};

const getAnthropicClient = () => {
  if (!anthropic && process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here') {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
};

/**
 * Generate content hooks from meeting transcript using AI
 * @param {string} transcript - The meeting transcript
 * @param {object} brandVoiceData - Company's brand voice data
 * @param {string[]} contentPillars - Content pillar categories
 * @returns {Promise<string[]>} Array of content hooks
 */
export async function generateContentHooks(transcript, brandVoiceData, contentPillars = []) {
  // If no Anthropic key, throw error - no fallbacks
  const client = getAnthropicClient();
  if (!client) {
    throw new Error('Anthropic API key not configured - cannot generate content hooks');
  }

  try {
    // Use sophisticated brand voice processing
    const processedBrandVoice = processBrandVoice(brandVoiceData);
    const brandContext = formatBrandVoiceForPrompt(processedBrandVoice, 'context');

    const prompt = `
You are a senior LinkedIn content strategist specializing in ${processedBrandVoice.industry} companies.

${brandContext}

Meeting Transcript:
${transcript}

Based on ${processedBrandVoice.companyName}'s expertise in ${processedBrandVoice.industry}, extract 3-5 content hooks that would make engaging LinkedIn posts for ${processedBrandVoice.targetAudience}.

Focus on insights that address these specific pain points: ${processedBrandVoice.painPoints.join(', ')}.

Each hook should:
1. Be actionable and valuable to ${processedBrandVoice.targetAudience}
2. Include specific numbers, examples, or concrete problems/solutions from the meeting
3. Use these industry keywords naturally: ${processedBrandVoice.keywords.slice(0, 5).join(', ')}
4. Match ${processedBrandVoice.companyName}'s tone: ${processedBrandVoice.tone}
5. Be written as a complete thought that only ${processedBrandVoice.companyName} would know from their ${processedBrandVoice.industry} experience

Format: Return only the hooks, one per line, without numbering or bullets.
`;

    const completion = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      temperature: parseFloat(process.env.CLAUDE_TEMPERATURE) || 0.7,
      messages: [
        { role: 'user', content: `You are a LinkedIn content strategist that extracts valuable content hooks from meeting transcripts.\n\n${prompt}` }
      ]
    });

    const response = completion.content[0]?.text || '';
    const hooks = response.split('\n').filter(hook => hook.trim().length > 0);

    console.log(`✨ Generated ${hooks.length} content hooks using AI`);
    return hooks;

  } catch (error) {
    console.error('❌ Error generating content hooks:', error);
    console.error('🔍 Full error details:', {
      message: error.message,
      status: error.status,
      type: error.type
    });
    // No fallback - throw error for proper debugging
    throw new Error(`AI content hook generation failed: ${error.message}`);
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
  // If no Anthropic key, throw error - no fallbacks
  const client = getAnthropicClient();
  if (!client) {
    throw new Error('Anthropic API key not configured - cannot generate LinkedIn post');
  }

  try {
    // Use sophisticated brand voice processing
    const processedBrandVoice = processBrandVoice(brandVoiceData);
    const brandContext = formatBrandVoiceForPrompt(processedBrandVoice, 'context');

    const prompt = `
Create a LinkedIn post for ${processedBrandVoice.companyName}, a ${processedBrandVoice.industry} company.

${brandContext}

Content Hook:
${hook}

Create a LinkedIn post that:
1. Opens with a compelling hook that grabs attention from ${processedBrandVoice.targetAudience}
2. Addresses specific ${processedBrandVoice.industry} pain points: ${processedBrandVoice.painPoints.slice(0, 3).join(', ')}
3. Uses ${processedBrandVoice.companyName}'s tone: ${processedBrandVoice.tone}
4. Incorporates these industry keywords naturally: ${processedBrandVoice.keywords.slice(0, 4).join(', ')}
5. Includes a call-to-action or thought-provoking question relevant to ${processedBrandVoice.targetAudience}
6. Is optimized for LinkedIn engagement (150-300 words)
7. Sounds like it could only come from ${processedBrandVoice.companyName} based on their expertise

Format your response as JSON:
{
  "content": "The LinkedIn post content",
  "imagePrompt": "A brief description for an image that would complement this post"
}
`;

    const completion = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
      messages: [
        { role: 'user', content: `You are a LinkedIn content creator that writes engaging posts for business professionals. Always respond with valid JSON.\n\n${prompt}` }
      ],
      max_tokens: 800,
      temperature: parseFloat(process.env.CLAUDE_TEMPERATURE) || 0.7
    });

    const response = completion.content[0]?.text || '';
    
    try {
      // Handle Claude's markdown-wrapped JSON responses
      let responseText = response.trim();
      if (responseText.startsWith('```json')) {
        responseText = responseText.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (responseText.startsWith('```')) {
        responseText = responseText.replace(/^```\n/, '').replace(/\n```$/, '');
      }
      const result = JSON.parse(responseText);
      console.log('📱 Generated LinkedIn post using AI');
      return result;
    } catch (parseError) {
      console.warn('⚠️ Falling back to plain-text post output for JSON parse failure');
      console.error('❌ Failed to parse AI response as JSON:', parseError);
      console.error('📄 Raw AI response:', response);
      return buildPlainTextPost(response);
    }

  } catch (error) {
    console.error('❌ Error generating LinkedIn post:', error);
    console.error('🔍 Full error details:', {
      message: error.message,
      status: error.status,
      type: error.type
    });
    // No fallback - throw error for proper debugging
    throw new Error(`AI LinkedIn post generation failed: ${error.message}`);
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
  // If no Anthropic key, throw error - no fallbacks
  const client = getAnthropicClient();
  if (!client) {
    throw new Error('Anthropic API key not configured - cannot rewrite content');
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

    const completion = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
      messages: [
        { role: 'user', content: `You are a LinkedIn content editor that rewrites posts based on specific instructions while maintaining brand voice.\n\n${prompt}` }
      ],
      max_tokens: 1000,
      temperature: parseFloat(process.env.CLAUDE_TEMPERATURE) || 0.7
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
  // If no Anthropic key, throw error - no fallbacks
  const client = getAnthropicClient();
  if (!client) {
    throw new Error('Anthropic API key not configured - cannot generate enhanced LinkedIn post');
  }

  try {
    // Process brand voice using unified processor
    console.log('🔍 DEBUG: generateEnhancedLinkedInPost called with:');
    console.log('  - hookText:', hookText?.substring(0, 100));
    console.log('  - pillar:', pillar);
    console.log('  - brandVoiceData type:', typeof brandVoiceData);
    console.log('  - brandVoiceData keys:', Object.keys(brandVoiceData || {}));
    console.log('  - companyId:', companyId);
    console.log('  - brandVoiceData sample:', JSON.stringify(brandVoiceData)?.substring(0, 200));
    
    let prompt;
    
    // Try to get custom prompt for the company
    if (companyId) {
      try {
        console.log(`🎯 Attempting to use custom prompt for company: ${companyId}`);
        prompt = await getCustomLinkedInPrompt(companyId);
        console.log(`✨ SUCCESS: Using custom LinkedIn prompt for company: ${companyId}`);
        console.log(`📏 Custom prompt length: ${prompt?.length || 0} characters`);
      } catch (error) {
        console.error(`❌ FAILED to get custom prompt for company ${companyId}:`, error.message);
        prompt = getGenericLinkedInPrompt();
        console.log(`📝 FALLBACK: Using generic prompt instead`);
      }
    } else {
      console.log('⚠️ No company ID provided, using generic prompt');
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

    const completion = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
      messages: [
        { 
          role: 'user', 
          content: `You are an expert LinkedIn content creator that writes engaging posts for business professionals. Always respond with valid JSON.\n\n${prompt}` 
        }
      ],
      max_tokens: 1500,
      temperature: parseFloat(process.env.CLAUDE_TEMPERATURE) || 0.7
    });

    const response = completion.content[0]?.text || '';
    
    try {
      // Handle Claude's markdown-wrapped JSON responses
      let responseText = response.trim();
      console.log(`🔍 Raw LinkedIn response (first 200 chars): ${responseText.substring(0, 200)}`);
      
      // More robust markdown parsing
      if (responseText.includes('```')) {
        // Extract everything between first ``` and last ```
        const match = responseText.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
        if (match) {
          responseText = match[1].trim();
        } else {
          // Fallback: just remove all ``` lines
          responseText = responseText.replace(/^```[a-z]*\s*\n?/i, '').replace(/\n?```\s*$/i, '');
        }
      }
      
      console.log(`🔍 Cleaned LinkedIn response (first 200 chars): ${responseText.substring(0, 200)}`);
      
      // Try to fix common JSON issues
      let fixedResponseText = responseText;
      
      // Fix unescaped quotes in string values
      fixedResponseText = fixedResponseText.replace(/: "(.*?)"(,|\n|$)/g, (match, content, suffix) => {
        const escapedContent = content.replace(/"/g, '\\"');
        return `: "${escapedContent}"${suffix}`;
      });
      
      // Fix trailing commas
      fixedResponseText = fixedResponseText.replace(/,\s*([}\]])/g, '$1');
      
      try {
        const result = JSON.parse(fixedResponseText);
        console.log('📱 Generated enhanced LinkedIn post using AI');
        return result;
      } catch (secondParseError) {
        console.warn('⚠️ Falling back to plain-text post output for enhanced JSON parse failure');
        console.error('❌ Still failed after JSON fixes:', secondParseError);
        
        // Last resort: extract post content with regex if it's a simple format
        const simplePostMatch = responseText.match(/"post":\s*"([^"]*(?:\\.[^"]*)*)"/);
        if (simplePostMatch) {
          console.log('🔧 Extracted post content with regex fallback');
          return {
            post: simplePostMatch[1].replace(/\\"/g, '"'),
            reasoning: null,
            estimatedCharacterCount: simplePostMatch[1].length
          };
        }

        return buildPlainTextPost(responseText || response);
      }
    } catch (parseError) {
      console.warn('⚠️ Enhanced response parse failed, returning plain-text fallback');
      console.error('❌ Failed to parse enhanced AI response as JSON:', parseError);
      console.error('📄 Raw AI response:', response);
      return buildPlainTextPost(response);
    }

  } catch (error) {
    console.error('❌ Error generating enhanced LinkedIn post:', error);
    console.error('🔍 Full error details:', {
      message: error.message,
      status: error.status,
      type: error.type
    });
    // No fallback - throw error for proper debugging
    throw new Error(`Enhanced AI LinkedIn post generation failed: ${error.message}`);
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
