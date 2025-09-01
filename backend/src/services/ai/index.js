import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateHooks = async (transcript, brandVoice, contentPillars) => {
  try {
    console.log('🤖 Generating marketing hooks with OpenAI');
    
    const hookGenerationPrompt = `
You are an expert marketing strategist analyzing a meeting transcript to extract marketing hooks for LinkedIn content.

BRAND VOICE CONTEXT:
${JSON.stringify(brandVoice, null, 2)}

CONTENT PILLARS:
${contentPillars.join(', ')}

MEETING TRANSCRIPT:
${transcript}

TASK:
Extract up to 10 distinct marketing insights from this transcript that could become engaging LinkedIn posts. 

REQUIREMENTS:
- Focus on insights that align with the content pillars
- Each hook should be actionable, specific, and valuable to the target audience
- Maintain the brand voice and tone
- Avoid mentioning specific client names or confidential information
- Prioritize insights that would resonate with the target market

RESPONSE FORMAT (JSON):
{
  "hooks": [
    {
      "pillar": "content pillar name",
      "hook": "specific marketing insight or angle",
      "confidence": 0.85,
      "reasoning": "why this insight is valuable"
    }
  ]
}

Generate between 3-10 hooks, ordered by confidence/relevance.
`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert marketing strategist who extracts valuable insights from business conversations and transforms them into compelling LinkedIn content angles.'
        },
        {
          role: 'user',
          content: hookGenerationPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

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
    
    const postGenerationPrompt = `
Create a LinkedIn post based on this marketing hook.

MARKETING HOOK:
${hook}

BRAND VOICE CONTEXT:
${JSON.stringify(brandVoice, null, 2)}

REQUIREMENTS:
- Maximum ${maxLength} words
- Professional yet conversational tone matching the brand voice
- End with an engaging question to drive comments
- Use line breaks for readability
- Be authentic and valuable to the audience
- No hashtags (we'll add those separately)
- Make it actionable or thought-provoking

The post should feel natural and engaging, not salesy or promotional.
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