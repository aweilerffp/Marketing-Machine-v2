import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { processBrandVoice, formatBrandVoiceForPrompt } from './brandVoiceProcessor.js';

// Lazy initialization to ensure environment variables are loaded
let anthropic = null;
let openai = null;

const getAnthropicClient = () => {
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
};

const getOpenAIClient = () => {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
};

// Helper function to generate industry-specific keywords
const generateIndustryKeywords = (industry) => {
  const keywordMap = {
    'E-commerce': ['marketplace', 'product listings', 'inventory management', 'conversion rates', 'cart abandonment', 'checkout optimization'],
    'Amazon Selling': ['listing management', 'catalog optimization', 'bulk editing', 'Amazon variations', 'Seller Central', 'flat files', 'ASIN management', 'brand registry', 'listing errors', 'catalog health'],
    'SaaS': ['user onboarding', 'feature adoption', 'churn reduction', 'product-market fit', 'customer success', 'API integration'],
    'Marketing': ['lead generation', 'conversion optimization', 'customer acquisition', 'brand awareness', 'content strategy', 'performance metrics'],
    'Technology': ['automation', 'scalability', 'integration', 'workflow optimization', 'digital transformation', 'efficiency gains'],
    'General Business': ['operational efficiency', 'growth strategies', 'customer experience', 'business optimization', 'competitive advantage', 'market positioning']
  };
  
  return keywordMap[industry] || keywordMap['General Business'];
};

// Helper function to generate industry-specific pain points
const generateIndustryPainPoints = (industry, targetAudience) => {
  const painPointMap = {
    'E-commerce': ['cart abandonment', 'inventory tracking', 'product discovery', 'conversion rates', 'customer retention'],
    'Amazon Selling': ['listing errors', 'catalog inconsistencies', 'bulk operations', 'variation management', 'compliance issues'],
    'SaaS': ['user adoption', 'feature complexity', 'onboarding friction', 'integration challenges', 'churn risk'],
    'Marketing': ['lead quality', 'attribution tracking', 'campaign performance', 'audience targeting', 'ROI measurement'],
    'Technology': ['system integration', 'process automation', 'data silos', 'workflow bottlenecks', 'scalability concerns'],
    'General Business': ['operational inefficiencies', 'growth bottlenecks', 'customer satisfaction', 'competitive pressure', 'resource allocation']
  };
  
  return painPointMap[industry] || painPointMap['General Business'];
};

export const generateHooks = async (transcript, brandVoice, contentPillars, meetingMetadata = {}) => {
  try {
    console.log('🤖 Generating marketing hooks with Claude 3.7 Sonnet');
    
    // Process brand voice using unified processor
    const processedBrandVoice = processBrandVoice(brandVoice);
    console.log('🔍 Hook generation using processed brand voice:', { 
      company: processedBrandVoice.companyName, 
      industry: processedBrandVoice.industry 
    });
    
    // Format meeting metadata
    const meetingDate = meetingMetadata.date || new Date().toLocaleDateString();
    const meetingType = meetingMetadata.type || 'STRATEGY_SESSION';
    const meetingGoal = meetingMetadata.goal || 'Extract actionable business insights';
    
    const hookGenerationPrompt = `
ROLE: You are ${processedBrandVoice.companyName}'s senior content strategist.

### Brand Voice (EXCERPT – keep it tight)
- Tone: ${processedBrandVoice.tone}
- Keywords to weave in when relevant: ${processedBrandVoice.keywords.join(', ')}
- Never use buzzwords like "synergy," "paradigm," or "disrupt."

### Content Pillars & Priority (ranked)
${Array.isArray(contentPillars) ? contentPillars.map((pillar, index) => `${index + 1}. ${pillar}`).join('\n') : '1. Industry Insights\n2. Product Updates\n3. Customer Success'}

### Inputs
**Meeting Metadata**
- Date: ${meetingDate}
- Type: ${meetingType}
- Goal: ${meetingGoal}

Five High-Leverage Questions to Ask Yourself (or the Stakeholder) First
"What single insight do we most want the reader to remember?"
"Which ${processedBrandVoice.targetAudience} is priority #1 for this piece?"
"What emotion should the reader feel—relief, confidence, urgency?"
"What action should they take next?"
"Which examples, data points, or stories in the transcript most support that goal?"

**Transcript**
"""
${transcript}
"""

### TASKS
1. **Extract up to 10 distinct insights** *only if* they map to one of the ${Array.isArray(contentPillars) ? contentPillars.length : 3} pillars above and answer all 5 high leverage questions. Quote or paraphrase the exact transcript line.

2. For each insight, generate:
   - **Blog angle** (title + 25-word hook)  
   - **LinkedIn hook** (≤150 words, ends with a question)  
   - **Tweet** (≤280 chars, 1 hashtag max)  
   *→ Each deliverable must explicitly reference ${processedBrandVoice.keywords.join(', ')} OR a specific ${processedBrandVoice.painPoints.join(', ')} pain point*  

3. Output as structured JSON:
\`\`\`json
{
  "insights": [
    {
      "pillar": "exact pillar name from list above",
      "source_quote": "exact quote from transcript that inspired this",
      "blog": { "title": "compelling blog post title", "hook": "25-word compelling hook" },
      "linkedin": "LinkedIn post content ending with question",
      "tweet": "Twitter-optimized content with max 1 hashtag"
    }
  ]
}
\`\`\`
`;

    // Calculate estimated token usage for monitoring
    const estimatedTokens = Math.ceil(hookGenerationPrompt.length / 4); // Rough estimate: 4 chars per token
    console.log(`📊 Estimated input tokens: ~${estimatedTokens}`);
    
    const completion = await getAnthropicClient().messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: parseInt(process.env.CLAUDE_MAX_TOKENS) || 20000,
      temperature: parseFloat(process.env.CLAUDE_TEMPERATURE) || 0.7,
      messages: [
        {
          role: 'user',
          content: `You are an expert marketing strategist who extracts valuable insights from business conversations and transforms them into compelling platform-agnostic content hooks.\n\n${hookGenerationPrompt}\n\nIMPORTANT: Respond with valid JSON only, no additional text.`
        }
      ]
    });

    // Log actual token usage for monitoring
    const usage = completion.usage;
    if (usage) {
      console.log(`📊 Token usage - Input: ${usage.input_tokens}, Output: ${usage.output_tokens}`);
      console.log(`💰 Estimated cost: $${((usage.input_tokens * 3 + usage.output_tokens * 15) / 1000000).toFixed(6)}`);
    }

    // Handle Claude's markdown-wrapped JSON responses
    let responseText = completion.content[0].text.trim();
    console.log(`🔍 Raw Claude response (first 200 chars): ${responseText.substring(0, 200)}`);
    
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
    
    console.log(`🔍 Cleaned response (first 200 chars): ${responseText.substring(0, 200)}`);
    const response = JSON.parse(responseText);
    
    console.log(`✅ Generated ${response.hooks?.length || 0} marketing hooks`);
    return response;

  } catch (error) {
    console.error('❌ Hook generation error:', error);
    console.error('🔍 Full error details:', {
      message: error.message,
      status: error.status,
      type: error.type
    });
    
    // No fallback - throw error for proper debugging
    throw new Error(`AI hook generation failed: ${error.message}`);
  }
};

export const generateLinkedInPost = async (hook, brandVoice, maxLength = 150) => {
  try {
    console.log('📝 Generating LinkedIn post with OpenAI');
    
    // TODO: Replace with your existing prompts
    const postGenerationPrompt = `
REPLACE_WITH_YOUR_EXISTING_POST_GENERATION_PROMPT

MARKETING HOOK:
${hook}

BRAND VOICE CONTEXT:
${JSON.stringify(brandVoice, null, 2)}

[Your existing prompt requirements go here]
- Maximum ${maxLength} words

[Your existing post generation instructions]
`;

    const completion = await getAnthropicClient().messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: parseFloat(process.env.CLAUDE_TEMPERATURE) || 0.7,
      messages: [
        {
          role: 'user',
          content: `You are an expert LinkedIn content creator who writes engaging, professional posts that drive meaningful conversations. You maintain brand voice while creating authentic, valuable content.\n\n${postGenerationPrompt}`
        }
      ]
    });

    const generatedPost = completion.content[0].text.trim();
    
    console.log(`✅ Generated LinkedIn post (${generatedPost.length} characters)`);
    return generatedPost;

  } catch (error) {
    console.error('❌ LinkedIn post generation error:', error);
    console.error('🔍 Full error details:', {
      message: error.message,
      status: error.status,
      type: error.type
    });
    
    // No fallback - throw error for proper debugging
    throw new Error(`AI LinkedIn post generation failed: ${error.message}`);
  }
};

export const generateImage = async (hook, brandColors = [], style = 'professional', promptOverride = null) => {
  try {
    console.log('🎨 Generating image with DALL-E');
    
    // Create enhanced image prompt
    const colorPrompt = brandColors.length > 0 
      ? `using brand colors: ${brandColors.join(', ')}`
      : 'using professional color palette';

    const trimmedOverride = typeof promptOverride === 'string' ? promptOverride.trim() : '';

    const imagePrompt = trimmedOverride || `
Create a ${style} conceptual illustration representing: "${hook}"

Style requirements:
- Clean, minimalist design
- ${colorPrompt}
- LinkedIn-appropriate
- Business/technology focused
- No text overlays
- High contrast and clarity
- Abstract or conceptual rather than literal

The image should be visually appealing and complement a LinkedIn post about this topic.
`;

    const response = await getOpenAIClient().images.generate({
      model: "dall-e-3",
      prompt: imagePrompt.trim(),
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "vivid"
    });

    const imageUrl = response.data[0].url;
    
    console.log(`✅ Generated image successfully`);
    return {
      url: imageUrl,
      prompt: imagePrompt.trim()
    };

  } catch (error) {
    console.error('❌ Image generation error:', error);
    console.error('🔍 Full image generation error details:', {
      message: error.message,
      status: error.status,
      type: error.type
    });
    
    // No fallback - throw error for proper debugging  
    throw new Error(`AI image generation failed: ${error.message}`);
  }
};
