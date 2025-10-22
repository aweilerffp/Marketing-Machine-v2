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

const stripCodeFences = (text) => {
  if (typeof text !== 'string') {
    return '';
  }

  const trimmed = text.trim();
  if (!trimmed.startsWith('```')) {
    return trimmed;
  }

  const match = trimmed.match(/```[a-zA-Z]*\s*\n?([\s\S]*?)```$/);
  if (match) {
    return match[1].trim();
  }

  return trimmed.replace(/^```[a-zA-Z]*\s*\n?/, '').replace(/```$/, '').trim();
};

const extractImagePromptFromData = (data) => {
  if (!data || typeof data === 'string') {
    return null;
  }

  if (typeof data.imagePrompt === 'string' && data.imagePrompt.trim()) {
    return data.imagePrompt.trim();
  }

  if (typeof data.image_prompt === 'string' && data.image_prompt.trim()) {
    return data.image_prompt.trim();
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      const prompt = extractImagePromptFromData(item);
      if (prompt) {
        return prompt;
      }
    }
    return null;
  }

  if (typeof data === 'object') {
    for (const value of Object.values(data)) {
      const prompt = extractImagePromptFromData(value);
      if (prompt) {
        return prompt;
      }
    }
  }

  return null;
};

const buildPostFromStructuredData = (data) => {
  if (!data) {
    return '';
  }

  if (typeof data === 'string') {
    return data.trim();
  }

  if (Array.isArray(data)) {
    return data
      .map(item => buildPostFromStructuredData(item))
      .filter(Boolean)
      .join('\n\n');
  }

  if (typeof data !== 'object') {
    return '';
  }

  if (typeof data.post === 'string' && data.post.trim()) {
    return data.post.trim();
  }

  if (typeof data.content === 'string' && data.content.trim()) {
    return data.content.trim();
  }

  if (typeof data.body === 'string' && data.body.trim()) {
    return data.body.trim();
  }

  if (data.linkedInPost) {
    const nested = buildPostFromStructuredData(data.linkedInPost);
    if (nested) {
      return nested;
    }
  }

  const pieces = [];

  if (typeof data.hook === 'string' && data.hook.trim()) {
    pieces.push(data.hook.trim());
  }

  if (typeof data.mainContent === 'string' && data.mainContent.trim()) {
    pieces.push(data.mainContent.trim());
  }

  if (typeof data.summary === 'string' && data.summary.trim()) {
    pieces.push(data.summary.trim());
  }

  for (const key of ['callToAction', 'cta', 'closingThought']) {
    if (typeof data[key] === 'string' && data[key].trim()) {
      pieces.push(data[key].trim());
    }
  }

  if (Array.isArray(data.paragraphs)) {
    pieces.push(
      ...data.paragraphs
        .map(paragraph => buildPostFromStructuredData(paragraph))
        .filter(Boolean)
    );
  }

  if (Array.isArray(data.sections)) {
    pieces.push(
      ...data.sections
        .map(section => buildPostFromStructuredData(section))
        .filter(Boolean)
    );
  }

  if (typeof data.hashtags === 'string' && data.hashtags.trim()) {
    pieces.push(data.hashtags.trim());
  } else if (Array.isArray(data.hashtags)) {
    const tags = data.hashtags
      .filter(tag => typeof tag === 'string' && tag.trim())
      .join(' ');

    if (tags) {
      pieces.push(tags);
    }
  }

  if (pieces.length > 0) {
    return pieces.join('\n\n');
  }

  return '';
};

const buildPostFromLooseJson = (text) => {
  if (typeof text !== 'string') {
    return null;
  }

  const extractField = (key) => {
    const regex = new RegExp(`"${key}"\s*:\s*"([\s\S]*?)"(?=,\s*"|\s*}$)`, 'i');
    const match = text.match(regex);
    if (!match) {
      return '';
    }
    return match[1].replace(/\r/g, '').trim();
  };

  const candidateKeys = ['post', 'content', 'body', 'mainContent'];
  let sourceKey = null;
  let postText = '';

  for (const key of candidateKeys) {
    const value = extractField(key);
    if (value) {
      postText = value;
      sourceKey = key;
      break;
    }
  }

  const hook = extractField('hook');
  const callToAction = extractField('callToAction') || extractField('cta');
  const hashtags = extractField('hashtags');
  const reasoning = extractField('reasoning');
  const imagePrompt = extractField('imagePrompt') || extractField('image_prompt');

  const pieces = [];
  if (hook && sourceKey !== 'post' && sourceKey !== 'content') {
    pieces.push(hook);
  }

  if (postText) {
    pieces.push(postText);
  }

  if (callToAction && (!postText || !postText.includes(callToAction))) {
    pieces.push(callToAction);
  }

  if (hashtags && (!postText || !postText.includes(hashtags))) {
    pieces.push(hashtags);
  }

  if (!pieces.length) {
    return null;
  }

  const combinedPost = pieces.join('\n\n').trim();

  return {
    post: combinedPost,
    reasoning: reasoning || null,
    imagePrompt: imagePrompt || null
  };
};

export const sanitizePostText = (text) => {
  if (typeof text !== 'string') {
    return '';
  }

  let cleaned = text.trim();

  // Remove trailing code fences that may slip through
  cleaned = cleaned.replace(/```+\s*$/g, '').trim();

  // Remove trailing brackets/braces/parentheses left from partial JSON
  cleaned = cleaned.replace(/[\[\]\{\}\(\)]+$/g, '').trimEnd();

  return cleaned;
};

const normalizePostResponse = (rawResponse) => {
  const stripped = stripCodeFences(rawResponse || '');
  let imagePrompt = null;
  let reasoning = null;
  let workingText = stripped;

  const imagePromptRegex = /(?:^|\n)(?:Image\s*Prompt|Image\s*prompt|Suggested\s*image)\s*[:\-]\s*(.+)$/i;
  const imagePromptMatch = workingText.match(imagePromptRegex);
  if (imagePromptMatch) {
    imagePrompt = imagePromptMatch[1].trim();
    workingText = workingText.replace(imagePromptMatch[0], '').trim();
  }

  // Remove meta lead-ins like "Here's a LinkedIn post..." that violate formatting rules
  workingText = workingText.replace(/^[\s]*here'?s\s+(?:an?|the)?\s*(?:high-?converting\s+)?linkedin\s+post[^\n]*\n?/i, '');

  const withoutHashtagOnlyLines = workingText
    .split('\n')
    .filter(line => !/^#\S+(\s+#\S+)*\s*$/.test(line.trim()))
    .join('\n');

  const trimmed = withoutHashtagOnlyLines.trim();
  if (!trimmed) {
    return {
      post: '',
      reasoning: null,
      estimatedCharacterCount: 0,
      imagePrompt: imagePrompt || null
    };
  }

  const looksLikeJson = trimmed.startsWith('{') || trimmed.startsWith('[');
  if (looksLikeJson) {
    try {
      const parsed = JSON.parse(trimmed);
      const postText = buildPostFromStructuredData(parsed);
      reasoning = typeof parsed?.reasoning === 'string' ? parsed.reasoning.trim() : null;
      const extractedImagePrompt = extractImagePromptFromData(parsed);
      if (extractedImagePrompt) {
        imagePrompt = extractedImagePrompt;
      }

      if (postText) {
        const cleanedPost = sanitizePostText(postText);
        return {
          post: cleanedPost,
          reasoning,
          estimatedCharacterCount: cleanedPost.length,
          imagePrompt: imagePrompt || null
        };
      }
    } catch (jsonError) {
      console.warn('⚠️ Could not parse AI response as JSON:', jsonError);
      const looseResult = buildPostFromLooseJson(trimmed);
      if (looseResult?.post) {
        const cleanedPost = sanitizePostText(looseResult.post);
        return {
          post: cleanedPost,
          reasoning: looseResult.reasoning || reasoning,
          estimatedCharacterCount: cleanedPost.length,
          imagePrompt: imagePrompt || looseResult.imagePrompt || null
        };
      }
    }
  }

  const plainResult = buildPlainTextPost(trimmed);
  const sanitizedPost = sanitizePostText(plainResult.post);
  return {
    post: sanitizedPost,
    reasoning: reasoning ?? plainResult.reasoning,
    estimatedCharacterCount: sanitizedPost.length,
    imagePrompt: imagePrompt || null
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

Craft a LinkedIn post that:
1. Opens with a scroll-stopping hook for ${processedBrandVoice.targetAudience}
2. Addresses ${processedBrandVoice.industry} pain points such as ${processedBrandVoice.painPoints.slice(0, 3).join(', ')}
3. Uses ${processedBrandVoice.companyName}'s tone: ${processedBrandVoice.tone}
4. Incorporates these industry keywords naturally: ${processedBrandVoice.keywords.slice(0, 4).join(', ')}
5. Includes an authentic call-to-action or thought-provoking question relevant to ${processedBrandVoice.targetAudience}
6. Is optimized for LinkedIn engagement (150-300 words)
7. Sounds like it could only come from ${processedBrandVoice.companyName} based on their expertise
8. Delivers value without using hashtags

Write the final post as polished plain text ready to publish on LinkedIn—no JSON, brackets, or section labels. Use short paragraphs for readability, keep emoji usage to a maximum of three, and do not include hashtags anywhere in the post.

After the post, add a blank line followed by:
Image Prompt: <one-sentence visual description that complements the post - MUST include "absolutely no text, no words, no letters, no labels" as a requirement>
`;

    const completion = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
      messages: [
        { role: 'user', content: `You are a LinkedIn content creator that writes engaging posts for business professionals. Deliver the final output exactly as described: ready-to-post text plus an image prompt.\n\n${prompt}` }
      ],
      max_tokens: 800,
      temperature: parseFloat(process.env.CLAUDE_TEMPERATURE) || 0.7
    });

    const response = completion.content[0]?.text || '';
    const normalized = normalizePostResponse(response);

    if (!normalized.post) {
      throw new Error('AI LinkedIn post generation returned empty content');
    }

    console.log('📱 Generated LinkedIn post using AI');
    return {
      content: normalized.post,
      imagePrompt: normalized.imagePrompt || null
    };

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
    
    const outputFormatRulesSection = `## OUTPUT FORMAT RULES
- Begin immediately with the first sentence of the LinkedIn post—do not add meta commentary such as "Here's a post"
- Return only the finished post text followed by a blank line and "Image Prompt: ..." describing a supporting visual in one sentence
- Keep paragraphs between one and three sentences and limit emoji usage to no more than three in the entire post
- Ensure the penultimate paragraph includes a clear call-to-action or question for the reader
- Do not include hashtags anywhere in the output`;

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
- Limit emoji usage to no more than three throughout the post
- Keep paragraphs between one and three sentences for readability
- Ensure the penultimate paragraph includes a clear call-to-action or question

${outputFormatRulesSection}

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

Deliver the final LinkedIn post exactly in this format.`;
    }

    // Replace hook placeholder in custom prompt
    const hookListPlaceholder = '{HOOK_LIST}';
    if (prompt.includes(hookListPlaceholder)) {
      prompt = prompt.replace(hookListPlaceholder, hookText);
    } else {
      // If custom prompt doesn't have the placeholder, append the hook data
      const supplementalSections = [];

      if (!prompt.includes('## OUTPUT FORMAT RULES')) {
        supplementalSections.push(outputFormatRulesSection);
      }

      const inputSectionLines = [`## INPUT DATA`, `Hook: "${hookText}"`, `Content Pillar: "${pillar}"`];
      if (meetingSummary) {
        inputSectionLines.push(``, `Meeting Context: "${meetingSummary}"`);
      }

      if (hookContext) {
        const contextLines = [``, `## HOOK GENERATION INSIGHTS`];
        if (hookContext.originalInsight) {
          contextLines.push(`Original Quote: "${hookContext.originalInsight}"`);
        }
        if (hookContext.reasoning) {
          contextLines.push(`Strategic Reasoning: "${hookContext.reasoning}"`);
        }
        if (typeof hookContext.confidence !== 'undefined') {
          contextLines.push(`Confidence Score: ${hookContext.confidence}`);
        }
        if (hookContext.blog?.title || hookContext.blog?.hook) {
          const blogTitle = hookContext.blog.title ?? '';
          const blogHook = hookContext.blog.hook ?? '';
          contextLines.push(`Related Blog Concept: "${blogTitle}"${blogHook ? ` - ${blogHook}` : ''}`.trim());
        }
        if (hookContext.tweet) {
          contextLines.push(`Related Tweet Version: "${hookContext.tweet}"`);
        }
        if (hookContext.preGeneratedLinkedIn) {
          contextLines.push(`Hook Generator's LinkedIn Attempt: "${hookContext.preGeneratedLinkedIn}" (use as reference only, create something better)`);
        }
        inputSectionLines.push(...contextLines);
      }

      supplementalSections.push(inputSectionLines.join('\n'));

      supplementalSections.push('Follow the OUTPUT FORMAT RULES above exactly. Deliver only the finalized LinkedIn post text, then add a blank line and "Image Prompt: ..." with a single-sentence visual description.');

      prompt += `\n\n${supplementalSections.join('\n\n')}`;
    }

    const completion = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
      messages: [
        {
          role: 'user',
          content: `You are an expert LinkedIn content creator that writes engaging posts for business professionals. Deliver a ready-to-post LinkedIn article followed by an image prompt as described.\n\n${prompt}`
        }
      ],
      max_tokens: 2500,
      temperature: parseFloat(process.env.CLAUDE_TEMPERATURE) || 0.8
    });

    const response = completion.content[0]?.text || '';
    console.log(`🔍 Raw LinkedIn response (first 200 chars): ${response.substring(0, 200)}`);

    const normalized = normalizePostResponse(response);

    if (!normalized.post) {
      console.error('❌ Enhanced LinkedIn post generation returned empty content');
      return buildPlainTextPost(response);
    }

    if (!normalized.reasoning && hookContext?.reasoning) {
      normalized.reasoning = hookContext.reasoning;
    }

    console.log(`📱 Generated enhanced LinkedIn post using AI (${normalized.post.length} characters)`);
    return normalized;

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
