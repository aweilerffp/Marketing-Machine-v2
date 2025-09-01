import prisma from '../../../models/prisma.js';
import { generateHooks, generateLinkedInPost, generateImage } from '../../ai/index.js';

export const processTranscript = async (job) => {
  const { 
    sessionId, 
    title, 
    summary, 
    transcript, 
    actionItems,
    owner,
    participants 
  } = job.data;

  try {
    console.log(`🔄 Processing transcript for meeting: ${sessionId}`);
    console.log(`📝 Meeting title: ${title}`);
    console.log(`📊 Transcript length: ${transcript?.length || 0} characters`);

    // Step 1: Find or create company based on owner email
    let company;
    if (owner?.email) {
      const user = await prisma.user.findUnique({
        where: { email: owner.email },
        include: { company: true }
      });
      
      if (user?.company) {
        company = user.company;
        console.log(`👤 Found company for user: ${user.email}`);
      } else {
        console.log(`⚠️ No company found for owner: ${owner.email}`);
        // For now, skip processing if no company found
        return {
          success: false,
          sessionId,
          message: 'No company configuration found for meeting owner'
        };
      }
    } else {
      console.log(`⚠️ No owner email provided in meeting data`);
      return {
        success: false,
        sessionId,
        message: 'No owner email provided for company identification'
      };
    }

    // Step 2: Store meeting record
    const meeting = await prisma.meeting.create({
      data: {
        readaiId: sessionId,
        companyId: company.id,
        title: title || 'Untitled Meeting',
        transcript,
        summary: summary || null,
        actionItems: actionItems ? { actionItems } : null,
        processedAt: new Date()
      }
    });

    console.log(`💾 Stored meeting record: ${meeting.id}`);

    // Step 3: Generate marketing hooks using AI
    const brandVoice = company.brandVoiceData || {};
    const contentPillars = company.contentPillars || ['Industry Insights', 'Product Updates', 'Customer Success'];
    
    const hooksResult = await generateHooks(transcript, brandVoice, contentPillars);
    const hooks = hooksResult.hooks || [];

    console.log(`🎯 Generated ${hooks.length} marketing hooks`);

    // Step 4: Limit hooks based on company settings
    const maxHooks = parseInt(process.env.DEFAULT_HOOKS_PER_MEETING) || 3;
    const selectedHooks = hooks.slice(0, maxHooks);

    let processedHooks = 0;
    let processedPosts = 0;

    // Step 5: Process each hook to create content
    for (const hookData of selectedHooks) {
      try {
        // Create hook record
        const contentHook = await prisma.contentHook.create({
          data: {
            meetingId: meeting.id,
            hook: hookData.hook,
            pillar: hookData.pillar || null
          }
        });

        console.log(`📝 Created hook: ${contentHook.id}`);
        processedHooks++;

        // Generate LinkedIn post
        const maxPostLength = parseInt(process.env.MAX_LINKEDIN_POST_LENGTH) || 150;
        const linkedinPost = await generateLinkedInPost(hookData.hook, brandVoice, maxPostLength);

        // Generate accompanying image
        const brandColors = brandVoice.colors || [];
        const imageResult = await generateImage(hookData.hook, brandColors, 'professional');

        // Create content post record
        await prisma.contentPost.create({
          data: {
            hookId: contentHook.id,
            content: linkedinPost,
            imageUrl: imageResult.url,
            imagePrompt: imageResult.prompt,
            status: 'PENDING' // Will go to approval queue
          }
        });

        console.log(`✅ Created LinkedIn post for hook: ${contentHook.id}`);
        processedPosts++;

      } catch (hookError) {
        console.error(`❌ Error processing hook "${hookData.hook}":`, hookError);
        // Continue with other hooks even if one fails
      }
    }

    const result = {
      success: true,
      sessionId,
      meetingId: meeting.id,
      hooksGenerated: processedHooks,
      postsCreated: processedPosts,
      message: `Successfully processed ${processedPosts} LinkedIn posts from ${processedHooks} marketing hooks`
    };

    console.log(`✅ Transcript processing completed for ${sessionId}`);
    console.log(`📊 Results: ${processedPosts} posts created from ${processedHooks} hooks`);

    return result;

  } catch (error) {
    console.error(`❌ Error processing transcript ${sessionId}:`, error);
    throw error; // Let Bull handle the retry
  }
};