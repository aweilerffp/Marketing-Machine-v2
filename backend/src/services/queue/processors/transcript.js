import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { generateHooks, generateImage } from '../../ai/index.js';
import { generateEnhancedLinkedInPost } from '../../ai/contentGeneration.js';

// Ensure environment variables are loaded in queue processor context
dotenv.config();

// Create Prisma client with explicit DATABASE_URL for queue worker context
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:/Users/adamweiler/Documents/BMAD/marketing-machine/backend/prisma/dev.db'
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

    // Method 3: Fallback to default dev company in development
    if (!company && process.env.NODE_ENV === 'development') {
      company = await prisma.company.findFirst({
        where: { name: 'Emplicit' }
      });
      if (company) {
        console.log(`🚧 Development mode: Using default company: ${company.name}`);
      }
    }

    // Method 4: Handle missing company gracefully
    if (!company) {
      console.log(`⚠️ No company found via token, email, or dev fallback. Creating generic meeting record.`);
      // Continue processing but won't have brand voice data
    }

    // Step 2: Store or update meeting record with PROCESSING status
    const meeting = await prisma.meeting.upsert({
      where: {
        readaiId: sessionId
      },
      update: {
        companyId: company?.id || null,
        title: title || 'Untitled Meeting',
        transcript,
        summary: summary || null,
        actionItems: actionItems ? { actionItems } : null,
        processedStatus: 'PROCESSING',
        processedAt: new Date()
      },
      create: {
        readaiId: sessionId,
        companyId: company?.id || null,
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
    let brandVoice = {};
    if (company) {
      // Parse brand voice JSON data and add company name
      try {
        brandVoice = company.brandVoiceData ? JSON.parse(company.brandVoiceData) : {};
        brandVoice.companyName = company.name; // Add company name to brand voice data
      } catch (error) {
        console.warn('⚠️ Failed to parse brand voice data, using fallback');
        brandVoice = { companyName: company.name };
      }
    }
    // Parse content pillars (stored as JSON string)
    let contentPillars = ['Industry Insights', 'Product Updates', 'Customer Success'];
    if (company?.contentPillars) {
      try {
        contentPillars = typeof company.contentPillars === 'string' 
          ? JSON.parse(company.contentPillars) 
          : company.contentPillars;
      } catch (error) {
        console.warn('⚠️ Failed to parse content pillars, using defaults');
      }
    }
    
    // Create meeting metadata for better context
    const meetingMetadata = {
      date: new Date().toLocaleDateString(),
      type: title?.includes('kickoff') ? 'KICKOFF' : 
            title?.includes('quarterly') ? 'QBR' : 
            title?.includes('brainstorm') ? 'BRAINSTORM' : 'STRATEGY_SESSION',
      goal: `Extract actionable insights from ${title || 'meeting'}`
    };
    
    const hooksResult = await generateHooks(transcript, brandVoice, contentPillars, meetingMetadata);
    const hooks = hooksResult.insights || hooksResult.hooks || [];

    console.log(`🎯 Generated ${hooks.length} marketing hooks`);

    // Step 4: Limit hooks based on company settings
    const maxHooks = parseInt(process.env.DEFAULT_HOOKS_PER_MEETING) || 3;
    const selectedHooks = hooks.slice(0, maxHooks);

    let processedHooks = 0;
    let processedPosts = 0;

    // Step 5: Process each hook to create content
    for (const hookData of selectedHooks) {
      try {
        // Extract hook text from either old format (hookData.hook) or new format (hookData.linkedin)
        const hookText = hookData.hook || hookData.linkedin || hookData.blog?.hook || 'Generated marketing insight';
        
        // Create hook record
        const contentHook = await prisma.contentHook.create({
          data: {
            meetingId: meeting.id,
            hook: hookText,
            pillar: hookData.pillar || null
          }
        });

        console.log(`📝 Created hook: ${contentHook.id}`);
        processedHooks++;

        // Always use enhanced LinkedIn post generation with hook context
        const hookContext = {
          originalInsight: hookData.source_quote || '',
          reasoning: hookData.reasoning || '',
          confidence: hookData.confidence || 0.8,
          blog: hookData.blog || null,
          tweet: hookData.tweet || null,
          // Include the pre-generated LinkedIn as reference but don't use it directly
          preGeneratedLinkedIn: hookData.linkedin || null
        };
        
        const linkedinPost = await generateEnhancedLinkedInPost(
          hookText,
          hookData.pillar || 'General',
          brandVoice,
          transcript,
          hookContext,
          company?.id
        );

        // Generate accompanying image
        const brandColors = brandVoice.colors || [];
        const imageResult = await generateImage(hookText, brandColors, 'professional');

        // Create content post record
        await prisma.contentPost.create({
          data: {
            hookId: contentHook.id,
            content: linkedinPost.post || linkedinPost,
            imageUrl: imageResult.url,
            imagePrompt: imageResult.prompt,
            status: 'PENDING' // Will go to approval queue
          }
        });

        console.log(`✅ Created LinkedIn post for hook: ${contentHook.id}`);
        processedPosts++;

      } catch (hookError) {
        const errorHookText = hookData.hook || hookData.linkedin || hookData.blog?.hook || 'Unknown hook';
        console.error(`❌ Error processing hook "${errorHookText}":`, hookError);
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