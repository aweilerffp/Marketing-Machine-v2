import OpenAI from 'openai';
import { processBrandVoice, formatBrandVoiceForPrompt } from './brandVoiceProcessor.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    console.log('🤖 Generating marketing hooks with OpenAI');
    
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

### Brand Voice Context
${formatBrandVoiceForPrompt(processedBrandVoice, 'structured')}

### Content Pillars & Priority (ranked)
${contentPillars.map((pillar, index) => `${index + 1}. ${pillar}`).join('\n')}

### Inputs
**Meeting Metadata**
- Date: ${meetingDate}
- Type: ${meetingType}
- Goal: ${meetingGoal}

**Five High-Leverage Questions to Ask Yourself First:**
"What single insight do we most want the reader to remember?"
"Which ${processedBrandVoice.targetAudience} persona is priority #1 for this piece?"
"What emotion should the reader feel—relief, confidence, urgency?"
"What action should they take next?"
"Which examples, data points, or stories in the transcript most support that goal?"

**Transcript**
"""
${transcript}
"""

### TASKS
1. **Extract up to 10 distinct insights** *only if* they map to one of the ${contentPillars.length} pillars above and answer all 5 high leverage questions. Quote or paraphrase the exact transcript line.

2. For each insight, generate:
   - **Blog angle** (title + 25-word hook)  
   - **LinkedIn hook** (≤150 words, ends with a question)  
   - **Tweet** (≤280 chars, 1 hashtag max)  
   *→ Each deliverable must explicitly reference ${processedBrandVoice.industry} context OR address specific pain points: ${processedBrandVoice.painPoints.join(', ')}.*  

3. Output as structured JSON:
{
  "insights": [
    {
      "pillar": "exact pillar name from list above",
      "source_quote": "exact quote from transcript that inspired this",
      "blog": { 
        "title": "compelling blog post title", 
        "hook": "25-word compelling hook" 
      },
      "linkedin": "LinkedIn post content ending with question",
      "tweet": "Twitter-optimized content with max 1 hashtag",
      "confidence": 0.85,
      "reasoning": "why this insight is valuable to ${processedBrandVoice.targetAudience}"
    }
  ]
}

Generate between 3-10 insights, ordered by confidence/relevance.
`;

    // Calculate estimated token usage for monitoring
    const estimatedTokens = Math.ceil(hookGenerationPrompt.length / 4); // Rough estimate: 4 chars per token
    console.log(`📊 Estimated input tokens: ~${estimatedTokens}`);
    
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert marketing strategist who extracts valuable insights from business conversations and transforms them into compelling platform-agnostic content hooks.'
        },
        {
          role: 'user',
          content: hookGenerationPrompt
        }
      ],
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 2000, // Configurable via env
      response_format: { type: "json_object" }
    });

    // Log actual token usage for monitoring
    const usage = completion.usage;
    if (usage) {
      console.log(`📊 Token usage - Input: ${usage.prompt_tokens}, Output: ${usage.completion_tokens}, Total: ${usage.total_tokens}`);
      console.log(`💰 Estimated cost: $${((usage.prompt_tokens * 0.15 + usage.completion_tokens * 0.6) / 1000000).toFixed(6)}`);
    }

    const response = JSON.parse(completion.choices[0].message.content);
    
    console.log(`✅ Generated ${response.hooks?.length || 0} marketing hooks`);
    return response;

  } catch (error) {
    console.error('❌ Hook generation error:', error);
    
    // Fallback to mock data if OpenAI fails
    console.log('🔄 Falling back to mock hook generation');
    return {
      hooks: [
        {
          pillar: contentPillars[0] || 'Industry Insights',
          hook: 'Key insight from the meeting about industry trends',
          confidence: 0.9,
          reasoning: 'Fallback hook due to AI service error'
        },
        {
          pillar: contentPillars[1] || 'Product Updates',
          hook: 'Product feedback and improvement opportunities',
          confidence: 0.8,
          reasoning: 'Fallback hook due to AI service error'
        },
        {
          pillar: contentPillars[2] || 'Customer Success',
          hook: 'Customer success story and lessons learned',
          confidence: 0.85,
          reasoning: 'Fallback hook due to AI service error'
        }
      ]
    };
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

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert LinkedIn content creator who writes engaging, professional posts that drive meaningful conversations. You maintain brand voice while creating authentic, valuable content.'
        },
        {
          role: 'user',
          content: postGenerationPrompt
        }
      ],
      temperature: 0.8,
      max_tokens: 500
    });

    const generatedPost = completion.choices[0].message.content.trim();
    
    console.log(`✅ Generated LinkedIn post (${generatedPost.length} characters)`);
    return generatedPost;

  } catch (error) {
    console.error('❌ LinkedIn post generation error:', error);
    
    // Fallback to simple post format
    console.log('🔄 Falling back to simple post format');
    return `${hook}\n\nWhat's your experience with this?`;
  }
};

export const generateImage = async (hook, brandColors = [], style = 'professional') => {
  try {
    console.log('🎨 Generating image with DALL-E');
    
    // Create enhanced image prompt
    const colorPrompt = brandColors.length > 0 
      ? `using brand colors: ${brandColors.join(', ')}`
      : 'using professional color palette';
    
    const imagePrompt = `
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

    const response = await openai.images.generate({
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
    
    // Fallback to placeholder image
    console.log('🔄 Falling back to placeholder image');
    const fallbackUrl = `https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=${encodeURIComponent('Marketing Insight')}`;
    
    return {
      url: fallbackUrl,
      prompt: `Fallback image for: ${hook}`
    };
  }
};