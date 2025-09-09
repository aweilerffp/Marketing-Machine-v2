import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { generateHooks, generateLinkedInPost, generateImage } from '../../ai/index.js';

// Ensure environment variables are loaded in queue processor context
dotenv.config();

// Create Prisma client with explicit DATABASE_URL for queue worker context
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./dev.db'
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error']
});

export const processTranscript = async (job) => {
  const { 
    sessionId, 
    title, 
    summary, 
    transcript, 
    actionItems,
    owner,
    participants,
    // NEW: Token-validated company data from webhook
    companyId,
    companyName
  } = job.data;

  try {
    console.log(`🔄 Processing transcript for meeting: ${sessionId}`);
    console.log(`🗄️  DATABASE_URL: ${process.env.DATABASE_URL}`);
    console.log(`📝 Meeting title: ${title}`);
    console.log(`📊 Transcript length: ${transcript?.length || 0} characters`);

    // Step 1: Find company using priority-based resolution
    let company = null;

    // Method 1: Use token-validated company (MOST RELIABLE)
    if (companyId) {
      company = await prisma.company.findUnique({
        where: { id: companyId }
      });
      if (company) {
        console.log(`🔐 Using token-validated company: ${company.name}`);
      }
    }

    // Method 2: Fallback to owner email lookup (BACKWARD COMPATIBILITY)
    if (!company && owner?.email) {
      const user = await prisma.user.findUnique({
        where: { email: owner.email },
        include: { company: true }
      });
      
      if (user?.company) {
        company = user.company;
        console.log(`📧 Found company via email lookup: ${company.name}`);
      } else {
        console.log(`⚠️ No company found for owner: ${owner.email}`);
      }
    }

    // Method 3: Handle missing company gracefully
    if (!company) {
      console.log(`⚠️ No company found via token or email. Creating generic meeting record.`);
      // Continue processing but won't have brand voice data
    }

    // Step 2: Store meeting record with PROCESSING status
    const meeting = await prisma.meeting.create({
      data: {
        readaiId: sessionId,
        companyId: company?.id || null, // Allow null for meetings without company
        title: title || 'Untitled Meeting',
        transcript,
        summary: summary || null,
        actionItems: actionItems ? { actionItems } : null,
        processedStatus: 'PROCESSING',
        processedAt: new Date()
      }
    });

    console.log(`💾 Stored meeting record: ${meeting.id}`);

    // Step 3: Generate marketing hooks using AI (with fallbacks)
    const brandVoice = company?.brandVoiceData || {};
    const contentPillars = company?.contentPillars || ['Industry Insights', 'Product Updates', 'Customer Success'];
    
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

    // Step 6: Update meeting status to COMPLETED
    await prisma.meeting.update({
      where: { id: meeting.id },
      data: { processedStatus: 'COMPLETED' }
    });

    console.log(`✅ Transcript processing completed for ${sessionId}`);
    console.log(`📊 Results: ${processedPosts} posts created from ${processedHooks} hooks`);

    return result;

  } catch (error) {
    console.error(`❌ Error processing transcript ${sessionId}:`, error);
    
    // Try to update meeting status to FAILED if meeting was created
    try {
      const existingMeeting = await prisma.meeting.findUnique({
        where: { readaiId: sessionId }
      });
      
      if (existingMeeting) {
        await prisma.meeting.update({
          where: { id: existingMeeting.id },
          data: { processedStatus: 'FAILED' }
        });
        console.log(`📝 Updated meeting ${sessionId} status to FAILED`);
      }
    } catch (updateError) {
      console.error(`❌ Failed to update meeting status:`, updateError);
    }
    
    throw error; // Let Bull handle the retry
  }
};