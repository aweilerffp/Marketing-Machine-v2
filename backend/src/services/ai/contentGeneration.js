import OpenAI from 'openai';

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
  const industry = brandVoiceData.industry || 'technology';
  const audience = brandVoiceData.targetAudience || 'business professionals';
  
  const post = {
    content: `🚨 ${hook}

Here's what every ${audience} needs to know:

${industry === 'technology' ? 'Amazon sellers' : 'Business owners'} are losing revenue every day because their listings fail silently. You think everything is working fine, but behind the scenes, your variations are breaking, your content is disappearing, and your sales are suffering.

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
 * @returns {Promise<object>} Enhanced LinkedIn post content
 */
export async function generateEnhancedLinkedInPost(hookText, pillar, brandVoiceData, meetingSummary = '') {
  // If no OpenAI key, return mock data
  if (!openai || !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.log('🤖 Using mock enhanced LinkedIn post - no OpenAI key configured');
    return getMockEnhancedLinkedInPost(hookText, pillar, brandVoiceData);
  }

  try {
    // Extract company details
    const companyName = brandVoiceData.companyName || 'your company';
    const industry = brandVoiceData.industry || 'technology';
    const targetAudience = brandVoiceData.targetAudience || 'business professionals';
    
    // Create industry-specific keywords
    const getIndustryKeywords = (industry) => {
      const keywordMap = {
        'amazon': ['Amazon', 'ASIN', 'SKU', 'Seller Central', 'listings', 'catalog', 'variations', 'bulk edit', 'FBA'],
        'technology': ['software', 'platform', 'API', 'integration', 'automation', 'data', 'analytics'],
        'ecommerce': ['online store', 'conversion', 'checkout', 'inventory', 'fulfillment'],
        'default': ['business', 'efficiency', 'productivity', 'growth', 'optimization']
      };
      return keywordMap[industry.toLowerCase()] || keywordMap.default;
    };

    const industryKeywords = getIndustryKeywords(industry);

    const prompt = `## SYSTEM
You are ${companyName}'s senior copywriter specializing in high-converting LinkedIn content for ${industry} professionals.

## CONTENT REQUIREMENTS
**HARD CONSTRAINTS:**
- Each post: 1500-2200 characters (optimal for LinkedIn algorithm)
- Write at 6th grade reading level
- No em dashes (use periods, commas, or short sentences instead)
- Include 1-2 industry-relevant keywords naturally: ${industryKeywords.slice(0, 4).join(', ')}
- Focus on industry pain points and solutions
- Align with content pillar: ${pillar}

## BRAND VOICE
Company: ${companyName}
Industry: ${industry}
Target Audience: ${targetAudience}
${brandVoiceData.websiteContent ? `Brand Context: ${brandVoiceData.websiteContent.substring(0, 300)}...` : ''}

## CONTENT STRATEGY
### HOOK MASTERY
- **Pattern Interrupt:** Start with a contrarian statement about ${industry}
- **Curiosity Gap:** Create immediate intrigue within 8-12 words
- **Emotional Trigger:** Connect to professional frustration, lost time, or growth aspirations
- **Specificity:** Use exact numbers, timeframes, or industry scenarios

### STORY ARCHITECTURE
Choose the most fitting approach:

**Option A - Problem/Agitation/Solution:**
- Line 1: Contrarian hook about ${industry}
- Para 1: Specific professional problem scenario (with business stakes)
- Para 2: Why conventional approaches fail
- Para 3: Your solution with proof
- Para 4: Call-to-action question

**Option B - Case Study Format:**
- Line 1: Professional transformation headline
- Para 1: Starting situation (business chaos)
- Para 2: Key insight/strategy implemented
- Para 3: Results and broader implications
- Para 4: Engagement question

**Option C - Industry Insight:**
- Line 1: Bold prediction about ${industry}
- Para 1: Supporting evidence and context
- Para 2: What this means for professionals
- Para 3: Action steps
- Para 4: Discussion question

### ENGAGEMENT AMPLIFIERS
- **Social Proof:** Specific results and time savings
- **Insider Knowledge:** Industry secrets or little-known facts
- **Trend Connections:** Link to current industry changes
- **Personal Stakes:** What happens when problems aren't solved
- **Future Casting:** Where the industry is heading

## QUALITY CHECKPOINTS
- [ ] Would a ${targetAudience} stop scrolling for this hook?
- [ ] Does it teach something valuable in 60 seconds?
- [ ] Is the solution connection natural, not forced?
- [ ] Does the question genuinely invite professional discussion?
- [ ] Is every sentence earning its place for busy professionals?

## INPUT CONTEXT
Hook: ${hookText}
Content Pillar: ${pillar}
${meetingSummary ? `Meeting Context: ${meetingSummary}` : ''}
Industry Focus: ${industry}

## OUTPUT FORMAT
Return clean JSON:
{
  "post": "Complete LinkedIn post text with natural flow and strong engagement elements",
  "reasoning": "Brief explanation of approach taken",
  "estimatedCharacterCount": number
}

## INSTRUCTIONS
1. Choose most appropriate story architecture for this hook
2. Craft posts that feel like professional-to-professional advice, not corporate
3. Prioritize value delivery over word count targets
4. End with questions that spark genuine industry discussions
5. Focus on efficiency gains, growth opportunities, and problem-solving themes
6. Ensure the ${companyName} connection feels natural and valuable

BEGIN`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: `You are an expert LinkedIn content creator that writes engaging posts for ${industry} professionals. Always respond with valid JSON.` 
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
  const industry = brandVoiceData.industry || 'technology';
  const companyName = brandVoiceData.companyName || 'our platform';
  
  const post = {
    post: `🚨 ${hookText}

Here's what every ${brandVoiceData.targetAudience || 'professional'} needs to know:

Most ${industry} companies are losing efficiency every day because their processes fail silently. You think everything is working fine, but behind the scenes, your systems are breaking, your data is disappearing, and your productivity is suffering.

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