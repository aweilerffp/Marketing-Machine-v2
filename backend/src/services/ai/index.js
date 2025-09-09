import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateHooks = async (transcript, brandVoice, contentPillars) => {
  try {
    console.log('🤖 Generating marketing hooks with OpenAI');
    
    const hookGenerationPrompt = `
ROLE: You are ${brandVoice.companyName || 'this company'}'s senior content strategist.

### Brand Voice (from company onboarding)
- Industry: ${brandVoice.industry || 'General Business'}
- Target Audience: ${brandVoice.targetAudience || 'Business professionals'}
- Personality Traits: ${brandVoice.personality?.join(', ') || 'Professional, helpful, authoritative'}
${brandVoice.brandColors?.length ? `- Brand Colors: ${brandVoice.brandColors.join(', ')}` : ''}

### Content Pillars & Priority
${contentPillars.map((pillar, index) => `${index + 1}. ${pillar}`).join('\n')}

### Inputs
**Meeting Context**
- Meeting Discussion: Business Strategy Session
- Participants: Multiple stakeholders
- Content Source: Meeting transcript analysis

**Five High-Leverage Questions to Ask Yourself First:**
"What single insight do we most want the reader to remember?"
"Which ${brandVoice.targetAudience || 'audience persona'} is priority #1 for this piece?"
"What emotion should the reader feel—relief, confidence, urgency?"
"What action should they take next?"
"Which examples, data points, or stories in the transcript most support that goal?"

**Meeting Transcript**
"""
${transcript}
"""

### TASKS
1. **Extract up to 10 distinct insights** *only if* they map to one of the ${contentPillars.length} pillars above and answer all 5 high leverage questions. Quote or paraphrase the exact transcript line.

2. For each insight, generate:
   - **Platform-agnostic hook** (core insight in 1-2 sentences that works across platforms)
   - **Confidence Score** (0.0-1.0 based on relevance and impact)
   - **Source attribution** (exact quote that inspired this insight)
   
   *→ Each hook must explicitly reference ${brandVoice.industry || 'your industry'} context and address specific ${brandVoice.targetAudience || 'audience'} pain points.*

3. Output as structured JSON:
{
  "hooks": [
    {
      "pillar": "exact pillar name from list above",
      "hook": "platform-agnostic marketing insight or angle",
      "source_quote": "exact quote from transcript that inspired this",
      "confidence": 0.85,
      "reasoning": "why this insight is valuable to the target audience"
    }
  ]
}

Generate between 3-10 hooks, ordered by confidence/relevance.
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