import express from 'express';
import { requireAuth, getUserId } from '../../middleware/clerk.js';
import prisma from '../../models/prisma.js';
import { generateContentHooks, generateLinkedInPost } from '../../services/ai/contentGeneration.js';

const router = express.Router();

// Sample meeting topics relevant to FlatFilePro/Amazon sellers
const SAMPLE_MEETING_TOPICS = [
  {
    title: "Q4 Amazon Strategy Planning",
    transcript: `We need to discuss our Q4 strategy for Amazon. The main challenges our customers are facing right now include broken parent-child relationships in their listings, silent listing failures that they don't catch until it's too late, and the time-consuming process of bulk editing during seasonal promotions. 

    Our customers like Dr. Squatch and Million Dollar Sellers are seeing great results with our automated monitoring system. We should focus on highlighting how FlatFilePro prevents catalog rot and saves hours of manual work. 

    Key points: 93% of sellers have catalog rot, variations break overnight without warning, our Reflection Engine catches issues before they spread, and we offer complete version control with one-click rollbacks.`
  },
  {
    title: "Customer Success Stories Review",
    transcript: `Let's review some recent customer wins. Jack from Dr. Squatch mentioned that FlatFilePro is the tool that powers their ops and analytics teams - they used to do everything manually which was such a pain, but now they don't have to think about anything and their listings update like magic.

    Ian from Million Dollar Sellers said that with FlatFilePro, he's been able to streamline his Amazon listing process significantly - what used to take hours now takes just minutes. It's been a game-changer for his business.

    Keith from Yuca Brands loves that it saves all the changes his team makes across listings. These testimonials show our core value: saving time, preventing errors, and giving peace of mind to Amazon sellers.`
  },
  {
    title: "New Feature Development Discussion",
    transcript: `We're planning to enhance our drag-and-drop parent-child relationship editor. The current spreadsheet method is causing sellers frustration - they have to deal with crazy spreadsheets and endless refreshing to see if their child variations went through.

    Our new approach will let sellers edit parent and child listings more intuitively, resulting in more sales and higher rankings. We also want to add advanced launch tactics to help sellers get maximum listing traffic.

    The goal is to make catalog management feel effortless while giving sellers powerful tools to optimize their listings for better performance.`
  }
];

// Generate demo content for the current user's company
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    
    // Get user and company data
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    if (!user || !user.company) {
      return res.status(404).json({ error: 'Company not found. Please complete onboarding first.' });
    }

    const company = user.company;
    console.log('🎯 Generating demo content for company:', company.name);

    // Select a random sample meeting topic
    const sampleMeeting = SAMPLE_MEETING_TOPICS[Math.floor(Math.random() * SAMPLE_MEETING_TOPICS.length)];
    
    // Create a demo meeting record
    const meeting = await prisma.meeting.create({
      data: {
        companyId: company.id,
        readaiId: `demo-${Date.now()}`,
        title: `[DEMO] ${sampleMeeting.title}`,
        transcript: sampleMeeting.transcript,
        summary: `Demo meeting content for ${company.name}`,
        processedAt: new Date()
      }
    });

    console.log('📝 Created demo meeting:', meeting.title);

    // Generate content hooks from the transcript
    const hooks = await generateContentHooks(
      sampleMeeting.transcript, 
      company.brandVoiceData,
      JSON.parse(company.contentPillars || '[]')
    );

    console.log('🎣 Generated hooks:', hooks.length);

    // Create ContentHook records and generate LinkedIn posts
    const generatedPosts = [];
    
    for (const hookText of hooks) {
      // Create the hook record
      const contentHook = await prisma.contentHook.create({
        data: {
          meetingId: meeting.id,
          hook: hookText,
          pillar: 'Demo Content' // Since we removed content pillars from onboarding
        }
      });

      console.log('✨ Created content hook:', contentHook.id);

      // Generate LinkedIn post from this hook
      const linkedinPost = await generateLinkedInPost(
        hookText,
        company.brandVoiceData,
        JSON.parse(company.contentPillars || '[]')
      );

      // Create ContentPost record
      const contentPost = await prisma.contentPost.create({
        data: {
          hookId: contentHook.id,
          content: linkedinPost.content,
          imagePrompt: linkedinPost.imagePrompt,
          status: 'PENDING' // Goes to approval queue
        }
      });

      generatedPosts.push({
        id: contentPost.id,
        hook: hookText,
        content: linkedinPost.content,
        imagePrompt: linkedinPost.imagePrompt,
        status: contentPost.status,
        createdAt: contentPost.createdAt
      });

      console.log('📱 Generated LinkedIn post:', contentPost.id);
    }

    console.log('🎉 Demo content generation complete!');

    res.json({
      message: 'Demo content generated successfully!',
      meeting: {
        id: meeting.id,
        title: meeting.title,
        summary: meeting.summary
      },
      postsGenerated: generatedPosts.length,
      posts: generatedPosts
    });

  } catch (error) {
    console.error('Demo content generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate demo content',
      details: error.message 
    });
  }
});

export default router;