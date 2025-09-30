import Anthropic from '@anthropic-ai/sdk';
import prisma from '../../models/prisma.js';
import { processBrandVoice, analyzeWebsiteVisualStyle } from './brandVoiceProcessor.js';

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

const OUTPUT_FORMAT_RULES_BLOCK = `## OUTPUT FORMAT RULES
- Begin immediately with the first sentence of the LinkedIn post—do not add meta commentary such as "Here's a post"
- Return only the finished post text followed by a blank line and "Image Prompt: ..." describing a supporting visual in one sentence (image prompt MUST include "absolutely no text, no words, no letters, no labels")
- Keep paragraphs between one and three sentences and limit emoji usage to no more than three in the entire post
- Ensure the penultimate paragraph includes a clear call-to-action or question for the reader
- Do not include hashtags anywhere in the output`;

function ensureOutputFormatGuardrails(prompt) {
  let base = '';

  if (typeof prompt === 'string') {
    base = prompt.trimEnd();
  }

  if (!base) {
    base = getBasicPromptTemplate().trimEnd();
  }

  if (base.toLowerCase().includes('## output format rules')) {
    return base;
  }

  return `${base}\n\n${OUTPUT_FORMAT_RULES_BLOCK}`;
}

/**
 * Auto-detect industry and ICP from brand voice data using AI and web search
 * @param {object} brandVoiceData - Company's brand voice data
 * @returns {Promise<object>} Enhanced brand data with detected industry/ICP
 */
export async function autoDetectIndustryAndICP(brandVoiceData) {
  // If no Anthropic key, return basic processed data
  const client = getAnthropicClient();
  if (!client) {
    console.log('🤖 Using basic industry/ICP detection - no Anthropic key configured');
    return getBasicIndustryICP(brandVoiceData);
  }

  try {
    const websiteContent = brandVoiceData.websiteContent || '';
    const existingIndustry = brandVoiceData.industry || '';
    const existingTargetAudience = brandVoiceData.targetAudience || '';

    const prompt = `
Analyze this company's website content and brand data to detect their industry and ideal customer profile (ICP).

WEBSITE CONTENT:
${websiteContent.substring(0, 2000)}...

EXISTING DATA:
- Current Industry: ${existingIndustry}
- Current Target Audience: ${existingTargetAudience}

INSTRUCTIONS:
1. If existing industry/ICP data is already specific and accurate, keep it
2. If missing or too generic, detect from website content
3. Be specific - avoid generic terms like "business professionals"
4. Focus on the exact market segment they serve

Return JSON with:
{
  "industry": "specific industry (e.g., Amazon/ecommerce tools, B2B SaaS, fintech)",
  "targetAudience": "specific ICP (e.g., Amazon FBA sellers, SaaS founders, financial advisors)", 
  "industryKeywords": ["keyword1", "keyword2", "keyword3"],
  "painPoints": ["main pain point 1", "pain point 2"],
  "confidence": 0.8
}
`;

    const completion = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 800,
      temperature: parseFloat(process.env.CLAUDE_TEMPERATURE) || 0.7,
      messages: [
        { role: 'user', content: `You are a brand analyst that identifies company industries and target audiences from website content. Always respond with valid JSON.\n\n${prompt}` }
      ]
    });

    const response = completion.content[0]?.text || '{}';
    
    try {
      const detectedData = JSON.parse(response);
      console.log(`✨ Auto-detected industry: ${detectedData.industry}, ICP: ${detectedData.targetAudience}`);
      
      return {
        ...brandVoiceData,
        industry: detectedData.industry || brandVoiceData.industry || 'Technology',
        targetAudience: detectedData.targetAudience || brandVoiceData.targetAudience || 'Business professionals',
        industryKeywords: detectedData.industryKeywords || [],
        painPoints: detectedData.painPoints || [],
        detectionConfidence: detectedData.confidence || 0.5
      };
    } catch (parseError) {
      console.warn('⚠️ Failed to parse industry/ICP detection, using existing data');
      return brandVoiceData;
    }

  } catch (error) {
    console.error('❌ Error detecting industry/ICP:', error);
    return brandVoiceData;
  }
}

/**
 * Generate custom LinkedIn prompt from template using company-specific data
 * @param {string} companyId - Company ID
 * @returns {Promise<string>} Custom LinkedIn prompt
 */
export async function generateCustomLinkedInPrompt(companyId) {
  // If no Anthropic key, return basic template
  if (!anthropic || !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
    console.log('🤖 Using basic prompt template - no Anthropic key configured');
    return getBasicPromptTemplate();
  }

  try {
    // Get company data
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      throw new Error(`Company not found: ${companyId}`);
    }

    // Process and enhance brand voice data
    const processedBrandVoice = processBrandVoice(company.brandVoiceData);
    const enhancedBrandData = await autoDetectIndustryAndICP(processedBrandVoice);

    const metaPrompt = `
You are a prompt engineering expert creating a custom LinkedIn content generation prompt for a specific company.

COMPANY DATA:
- Company Name: ${company.name}
- Industry: ${enhancedBrandData.industry}
- Target Audience (ICP): ${enhancedBrandData.targetAudience}
- Industry Keywords: ${enhancedBrandData.industryKeywords?.join(', ') || 'N/A'}
- Pain Points: ${enhancedBrandData.painPoints?.join(', ') || 'N/A'}

BRAND VOICE CONTEXT:
${enhancedBrandData.websiteContent?.substring(0, 1500) || 'No website content available'}

PROMPT TEMPLATE TO CUSTOMIZE:
## SYSTEM
You are {company's} senior copywriter specializing in high-converting LinkedIn content for {ICP}.

## KNOWLEDGE RETRIEVAL  (sent below this prompt)
1. "{company} Brand Voice Guide"
3. "High-Converting Frameworks" → query: "engagement frameworks"   

## CONTENT REQUIREMENTS
**HARD CONSTRAINTS:**
- Each post: 1500-2200 characters (optimal for LinkedIn algorithm)
- Write at 6th grade reading level
- No em dashes (use periods, commas, or short sentences instead)
- Include 1-2 {company industry} keywords naturally{ insert some examples}
- Focus on {ICP} pain points and {Company} solutions 

## CONTENT STRATEGY (Quality Improvements)
### 1. HOOK MASTERY
- **Pattern Interrupt:** Start with a contrarian statement about {industry)
- **Curiosity Gap:** Create immediate intrigue within 8-12 words
- **Emotional Trigger:** Connect to {ICP} frustration, lost time, or profit aspirations
- **Specificity:** Use exact numbers, timeframes, or {Industry} scenarios

### 2. STORY ARCHITECTURE (Replace Rigid Structure)
**Option A - Problem/Agitation/Solution:**
- Line 1: Contrarian hook about {Industry} 
- Para 1: Specific {ICP} problem scenario (with revenue stakes)
- Para 2: Why conventional {Industry} approaches fail
- Para 3: {company's} unique solution with proof
- Para 4: Call-to-action question

**Option B - Case Study Format:**
- Line 1: {ICP} transformation headline
- Para 1: {ICP} starting situation 
- Para 2: Key insight/strategy implemented with {Company}
- Para 3: Results and broader implications for {ICP} 
- Para 4: Engagement question

**Option C - Industry Insight:**
- Line 1: Bold prediction about {industry}
- Para 1: Supporting evidence and {industry} content
- Para 2: What this means for {ICPs} 
- Para 3: Action steps with {company} tie-in
- Para 4: Discussion question

### 3. ENGAGEMENT AMPLIFIERS
- **Social Proof:** Specific {ICP} results and time savings
- **Insider Knowledge:** {Industry} secrets or little-known {industry}facts
- **Trend Connections:** Link to current {Industry}  changes
- **Personal Stakes:** What happens when {ICPs} don't take action
- **Future Casting:** Where {industry} is heading

### 4. CONVERSION PSYCHOLOGY
- **Scarcity:** Limited time to…
- **Authority:** Reference {industry} expertise & knowledge
- **Community:** "Successful {ICPs} are already streamlining this"
- **Loss Aversion:** Revenue lost from inaction  

## QUALITY CHECKPOINTS
Before finalizing each post, verify:
- [ ] Would an {ICP} stop scrolling for this hook?
- [ ] Does it teach something valuable about {industry} in 60 seconds?
- [ ] Is the {company} connection natural, not forced?
- [ ] Does the question genuinely invite {ICP} discussion?
- [ ] Is every sentence earning its place for{ICP}?

## INSTRUCTIONS
1. Retrieve brand voice and reference posts
2. Choose most appropriate story architecture for each hook
3. Craft posts that feel like {ICP to ICP} advice, not corporate
4. Prioritize value delivery over word count targets
5. End with questions that spark genuine {industry}  discussions
6. Skip hooks that don't naturally connect to {industry}

## INPUT
Hooks: {HOOK_LIST}
BEGIN

INSTRUCTIONS:
1. Replace ALL placeholder variables {company}, {ICP}, {industry}, etc. with the actual company data provided above
2. Add 3-5 specific industry keyword examples in the constraints section
3. Customize the pain points and solutions to match this company's specific focus
4. Make the language and tone match the company's brand voice from the website content
5. Keep all the structural elements but make them hyper-specific to this company

Return the complete customized prompt ready to use for LinkedIn post generation.
`;

    const completion = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: parseFloat(process.env.CLAUDE_TEMPERATURE) || 0.7,
      messages: [
        { role: 'user', content: `You are a prompt engineering expert that customizes content generation prompts for specific companies. Return the complete customized prompt.\n\n${metaPrompt}` }
      ]
    });

    const customPrompt = ensureOutputFormatGuardrails(completion.content[0]?.text || getBasicPromptTemplate());
    
    // Store the custom prompt in the database
    await prisma.company.update({
      where: { id: companyId },
      data: { customLinkedInPrompt: customPrompt }
    });

    console.log(`✨ Generated custom LinkedIn prompt for ${company.name}`);
    return customPrompt;

  } catch (error) {
    console.error('❌ Error generating custom LinkedIn prompt:', error);
    return ensureOutputFormatGuardrails(getBasicPromptTemplate());
  }
}

/**
 * Get or generate custom prompt for a company
 * @param {string} companyId - Company ID  
 * @returns {Promise<string>} Custom prompt (existing or newly generated)
 */
export async function getCustomLinkedInPrompt(companyId) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      throw new Error(`Company not found: ${companyId}`);
    }

    // If custom prompt already exists, return it
    if (company.customLinkedInPrompt) {
      console.log(`📋 Using existing custom prompt for ${company.name}`);
      return ensureOutputFormatGuardrails(company.customLinkedInPrompt);
    }

    // Generate new custom prompt
    console.log(`🎯 Generating new custom prompt for ${company.name}`);
    return await generateCustomLinkedInPrompt(companyId);
    
  } catch (error) {
    console.error('❌ Error getting custom LinkedIn prompt:', error);
    return ensureOutputFormatGuardrails(getBasicPromptTemplate());
  }
}

/**
 * Basic industry/ICP detection fallback
 */
function getBasicIndustryICP(brandVoiceData) {
  return {
    ...brandVoiceData,
    industry: brandVoiceData.industry || 'Technology', 
    targetAudience: brandVoiceData.targetAudience || 'Business professionals',
    industryKeywords: [],
    painPoints: [],
    detectionConfidence: 0.3
  };
}

/**
 * Generate custom hook prompt from template using company-specific data
 * @param {string} companyId - Company ID
 * @returns {Promise<string>} Custom hook prompt
 */
export async function generateCustomHookPrompt(companyId) {
  // If no Anthropic key, return basic template
  if (!anthropic || !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
    console.log('🤖 Using basic hook prompt template - no Anthropic key configured');
    return getBasicHookPromptTemplate();
  }

  try {
    // Get company data
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      throw new Error(`Company not found: ${companyId}`);
    }

    // Process and enhance brand voice data
    const processedBrandVoice = processBrandVoice(company.brandVoiceData);
    const enhancedBrandData = await autoDetectIndustryAndICP(processedBrandVoice);

    const metaPrompt = `
You are a prompt engineering expert creating a custom hook generation prompt for a specific company.

COMPANY DATA:
- Company Name: ${company.name}
- Industry: ${enhancedBrandData.industry}
- Target Audience (ICP): ${enhancedBrandData.targetAudience}
- Industry Keywords: ${enhancedBrandData.industryKeywords?.join(', ') || 'N/A'}
- Pain Points: ${enhancedBrandData.painPoints?.join(', ') || 'N/A'}

BRAND VOICE CONTEXT:
${enhancedBrandData.websiteContent?.substring(0, 1500) || 'No website content available'}

HOOK PROMPT TEMPLATE TO CUSTOMIZE:
You are a senior LinkedIn content strategist specializing in {industry} companies.

Based on {company}'s expertise in {industry}, extract 3-5 content hooks that would make engaging LinkedIn posts for {target_audience}.

Focus on insights that address these specific pain points: {pain_points}.

Each hook should:
1. Be actionable and valuable to {target_audience}
2. Include specific numbers, examples, or concrete problems/solutions from the meeting
3. Use these industry keywords naturally: {keywords}
4. Match {company}'s tone: {tone}
5. Be written as a complete thought that only {company} would know from their {industry} experience

Meeting Transcript:
{transcript}

Format: Return only the hooks, one per line, without numbering or bullets.

INSTRUCTIONS:
1. Replace ALL placeholder variables {company}, {industry}, {target_audience}, etc. with the actual company data provided above
2. Add specific industry keywords that are relevant to this company
3. Customize the pain points to match this company's specific focus areas
4. Make the language and tone match the company's brand voice from the website content
5. Keep the structural elements but make them hyper-specific to this company

Return the complete customized hook prompt ready to use for hook generation.
`;

    const completion = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      temperature: parseFloat(process.env.CLAUDE_TEMPERATURE) || 0.7,
      messages: [
        { role: 'user', content: `You are a prompt engineering expert that customizes hook generation prompts for specific companies. Return the complete customized prompt.\n\n${metaPrompt}` }
      ]
    });

    const customPrompt = completion.content[0]?.text || getBasicHookPromptTemplate();
    
    // Store the custom prompt in the database
    await prisma.company.update({
      where: { id: companyId },
      data: { customHookPrompt: customPrompt }
    });

    console.log(`✨ Generated custom hook prompt for ${company.name}`);
    return customPrompt;

  } catch (error) {
    console.error('❌ Error generating custom hook prompt:', error);
    return getBasicHookPromptTemplate();
  }
}

/**
 * Get or generate custom hook prompt for a company
 * @param {string} companyId - Company ID  
 * @returns {Promise<string>} Custom hook prompt (existing or newly generated)
 */
export async function getCustomHookPrompt(companyId) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      throw new Error(`Company not found: ${companyId}`);
    }

    // If custom prompt already exists, return it
    if (company.customHookPrompt) {
      console.log(`📋 Using existing custom hook prompt for ${company.name}`);
      return company.customHookPrompt;
    }

    // Generate new custom prompt
    console.log(`🎯 Generating new custom hook prompt for ${company.name}`);
    return await generateCustomHookPrompt(companyId);
    
  } catch (error) {
    console.error('❌ Error getting custom hook prompt:', error);
    return getBasicHookPromptTemplate();
  }
}

/**
 * Basic hook prompt template fallback
 */
function getBasicHookPromptTemplate() {
  return `You are a senior LinkedIn content strategist specializing in business content.

Based on the company's expertise, extract 3-5 content hooks that would make engaging LinkedIn posts for business professionals.

Focus on insights that address common business pain points and challenges.

Each hook should:
1. Be actionable and valuable to the target audience
2. Include specific numbers, examples, or concrete problems/solutions from the meeting
3. Use industry keywords naturally
4. Match a professional but approachable tone
5. Be written as a complete thought that demonstrates expertise

Meeting Transcript:
{transcript}

Format: Return only the hooks, one per line, without numbering or bullets.`;
}

/**
 * Basic prompt template fallback
 */
function getBasicPromptTemplate() {
  return `## SYSTEM
You are {company}'s senior LinkedIn copywriter creating high-converting content for {ICP}.

## CONTENT REQUIREMENTS
- Write in a professional but conversational tone
- Provide actionable insights or advice with concrete examples from the source material
- Use engaging hooks and clear structure optimized for LinkedIn
- Keep posts between 150-300 words
- Limit emoji usage to no more than three throughout the post
- Keep paragraphs between one and three sentences for readability
- Ensure the penultimate paragraph includes a clear call-to-action or question

${OUTPUT_FORMAT_RULES_BLOCK}

## INPUT DATA
- Hook(s): {HOOK_LIST}
- Content Pillar: {PILLAR}
- Brand Voice Summary: {BRAND_VOICE_SUMMARY}
- Meeting Transcript Excerpt: {TRANSCRIPT_SNIPPET}

Deliver the final LinkedIn post exactly following the OUTPUT FORMAT RULES. Return only the finalized post text followed by a blank line and "Image Prompt: ..." with a single-sentence visual description (MUST include "absolutely no text, no words, no letters, no labels" as a requirement).`;
}

/**
 * Generate a custom image generation prompt based on brand voice
 * @param {string} companyId - The company ID
 * @returns {Promise<string>} The generated custom image prompt
 */
export async function generateCustomImagePrompt(companyId) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      throw new Error('Company not found');
    }

    const brandVoice = processBrandVoice(company.brandVoiceData);

    // Analyze visual style from website content
    console.log(`🎨 Analyzing visual style for ${company.name}...`);
    const visualStyle = await analyzeWebsiteVisualStyle(company.brandVoiceData);

    // Build detailed color guidance from visual style analysis
    let colorGuidance = '';
    if (visualStyle.exactColors) {
      colorGuidance = `EXACT COLOR PALETTE (use these specific colors):
- Primary: ${visualStyle.exactColors.primary}
- Secondary: ${visualStyle.exactColors.secondary || 'N/A'}
- Accent: ${visualStyle.exactColors.accent || 'N/A'}
- Background: ${visualStyle.exactColors.background || 'white/light'}
- Text: ${visualStyle.exactColors.text || 'dark gray/black'}`;
    } else {
      const brandColors = brandVoice.brandColors || brandVoice.colors || [];
      const colorPrompt = Array.isArray(brandColors) && brandColors.length > 0
        ? `#${brandColors.join(', #')}`
        : 'professional color palette';
      colorGuidance = `BRAND COLORS: ${colorPrompt}`;
    }

    // Build comprehensive style guidance
    const designStyleGuidance = visualStyle.designStyle
      ? `\nDESIGN STYLE: ${visualStyle.designStyle}`
      : '';

    const typographyGuidance = visualStyle.typography
      ? `\nTYPOGRAPHY STYLE: ${visualStyle.typography.style}, ${visualStyle.typography.weight}`
      : '';

    const visualEffectsGuidance = visualStyle.visualEffects
      ? `\nVISUAL EFFECTS: ${visualStyle.visualEffects.borderRadius}, ${visualStyle.visualEffects.shadows}, ${visualStyle.visualEffects.gradients}`
      : '';

    const iconImageryGuidance = visualStyle.iconImageryStyle
      ? `\nICON/IMAGERY STYLE: ${visualStyle.iconImageryStyle}`
      : '';

    // Build enhanced prompt with detailed visual specifications
    const customPrompt = `Create a professional conceptual illustration representing: "{hook}"

${colorGuidance}${designStyleGuidance}${typographyGuidance}${visualEffectsGuidance}${iconImageryGuidance}

BRAND VISUAL CHARACTERISTICS:
${visualStyle.imageGenerationGuidance || `- Design Mood: ${visualStyle.mood}
- Aesthetic: ${visualStyle.designLanguage}
- Energy Level: ${visualStyle.energyLevel}
- Key Characteristics: ${visualStyle.keyCharacteristics?.join(', ')}`}

COMPOSITION REQUIREMENTS:
- Layout: ${visualStyle.layoutPattern || 'Professional, balanced composition'}
- Visual Metaphors: ${visualStyle.visualMetaphors?.join(', ') || 'Industry-relevant imagery'}
- Platform: LinkedIn-appropriate professional imagery
- Technical: High contrast, clear focal points
- Approach: Abstract or conceptual representations that match the brand's design system

CRITICAL REQUIREMENTS - NO EXCEPTIONS:
DO NOT include any text, words, letters, numbers, labels, captions, titles, or written characters of any kind in this image.
DO NOT add typography, textual overlays, or linguistic content.
This must be a purely visual, text-free composition.
NO TEXT. NO WORDS. NO LETTERS. NO LABELS. VISUAL ONLY.
ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO CHARACTERS OF ANY KIND IN THE IMAGE.

The image MUST match the exact visual style, colors, and design patterns from the brand's website for perfect brand cohesion.`;

    // Store visual style analysis in brandVoiceData for caching
    const updatedBrandVoiceData = {
      ...company.brandVoiceData,
      visualStyleProfile: visualStyle
    };

    // Save both the prompt and the visual style analysis
    await prisma.company.update({
      where: { id: companyId },
      data: {
        customImagePrompt: customPrompt,
        brandVoiceData: updatedBrandVoiceData
      }
    });

    console.log(`✅ Generated enhanced image prompt for ${company.name} (mood: ${visualStyle.mood})`);
    return customPrompt;

  } catch (error) {
    console.error('Error generating custom image prompt:', error);
    throw error;
  }
}

/**
 * Get the custom image prompt for a company (generate if doesn't exist)
 * @param {string} companyId - The company ID
 * @returns {Promise<string>} The custom image prompt
 */
export async function getCustomImagePrompt(companyId) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      throw new Error('Company not found');
    }

    // If custom prompt exists, return it
    if (company.customImagePrompt) {
      return company.customImagePrompt;
    }

    // Otherwise, generate and return a new one
    return await generateCustomImagePrompt(companyId);

  } catch (error) {
    console.error('Error getting custom image prompt:', error);
    throw error;
  }
}
