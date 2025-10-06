import express from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { transcriptQueue } from '../../services/queue/index.js';
import { ensureMeetingSessionHistory } from '../../models/meetingSessionUtils.js';

// Ensure environment variables are loaded
dotenv.config();

// Use shared Prisma client instance (don't create a new one with hardcoded SQLite config)
// This was causing the webhook to fail when using PostgreSQL
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error']
});

const router = express.Router();

// Read.ai webhook handler
router.post('/', async (req, res) => {
  try {
    console.log('📥 Received Read.ai webhook:', req.body);
    
    const { companyId, token } = req.params;
    let targetCompany = null;

    // Handle array payload format - Read.ai sends [{ ... }] instead of { ... }
    const webhookData = Array.isArray(req.body) ? req.body[0] : req.body;
    
    if (!webhookData) {
      return res.status(400).json({ error: 'Empty webhook payload' });
    }

    // Token-based authentication (new secure method)
    if (companyId && token) {
      targetCompany = await prisma.company.findFirst({
        where: {
          id: companyId,
          webhookToken: token,
          webhookActive: true
        },
        include: { user: true }
      });

      if (!targetCompany) {
        console.log(`❌ Invalid webhook token for company ${companyId}`);
        return res.status(401).json({ 
          error: 'Invalid webhook token or webhook is disabled' 
        });
      }

      console.log(`🔐 Token validated for company: ${targetCompany.name}`);
    }
    
    const { 
      session_id,
      trigger,
      title,
      start_time,
      end_time,
      participants,
      owner,
      summary,
      action_items,
      key_questions,
      topics,
      report_url,
      chapter_summaries,
      transcript
    } = webhookData;

    // Validate required fields
    if (!session_id || trigger !== 'meeting_end') {
      return res.status(400).json({ 
        error: 'Invalid webhook payload' 
      });
    }

    await ensureMeetingSessionHistory(prisma);

    // Determine sequencing for this Read.ai session so previous meetings remain untouched
    const latestMeeting = await prisma.meeting.findFirst({
      where: {
        OR: [
          { sourceSessionId: session_id },
          { readaiId: session_id } // legacy records without sourceSessionId
        ]
      },
      orderBy: {
        sessionSequence: 'desc'
      }
    });

    const lastSequence = latestMeeting?.sessionSequence ?? 0;
    const nextSequence = lastSequence + 1;
    const internalSessionId = nextSequence === 1 ? session_id : `${session_id}#${nextSequence}`;

    if (latestMeeting) {
      console.log(`🔁 Incoming Read.ai meeting ${session_id} detected (seq ${nextSequence}). Keeping previous ${lastSequence} version(s).`);
    }

    // Extract transcript with multiple fallbacks for maximum content richness
    let fullTranscript = '';
    
    // Priority 1: Use rich transcript from speaker_blocks if available
    if (transcript && transcript.speaker_blocks && Array.isArray(transcript.speaker_blocks)) {
      fullTranscript = transcript.speaker_blocks
        .map(block => {
          const speaker = block.speaker?.name || 'Unknown Speaker';
          const words = block.words || '';
          return `${speaker}: ${words}`;
        })
        .join('\n');
      console.log(`📝 Extracted rich transcript: ${fullTranscript.length} characters from speaker blocks`);
    }
    // Priority 2: Fallback to chapter summaries (using correct 'description' field)
    else if (chapter_summaries && Array.isArray(chapter_summaries)) {
      fullTranscript = chapter_summaries
        .map(chapter => chapter.description || chapter.summary || '')
        .filter(text => text.trim().length > 0)
        .join('\n\n');
      console.log(`📝 Extracted transcript from chapter summaries: ${fullTranscript.length} characters`);
    }
    // Priority 3: Final fallback to summary
    if (!fullTranscript || fullTranscript.trim().length === 0) {
      fullTranscript = summary || '';
      console.log(`📝 Using summary as transcript: ${fullTranscript.length} characters`);
    }
    
    // Add to processing queue
    const jobData = {
      sessionId: internalSessionId,
      title: title || 'Untitled Meeting',
      summary: summary || '',
      transcript: fullTranscript,
      actionItems: action_items || [],
      keyQuestions: key_questions || [],
      topics: topics || [],
      owner: owner || null,
      participants: participants || [],
      reportUrl: report_url || null,
      receivedAt: new Date().toISOString(),
      // Include company information if authenticated via token
      companyId: targetCompany?.id || null,
      companyName: targetCompany?.name || null,
      sourceSessionId: session_id,
      sessionSequence: nextSequence
    };

    await transcriptQueue.add('process-transcript', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 10,
      removeOnFail: 5,
    });
    
    console.log(`✅ Read.ai webhook queued for processing: ${internalSessionId}`);
    console.log(`📊 Meeting title: ${title}`);
    console.log(`👥 Participants: ${participants?.length || 0}`);
    console.log(`📝 Transcript length: ${fullTranscript.length} characters`);
    
    res.status(200).json({ 
      received: true,
      sessionId: session_id,
      message: 'Webhook received and queued for processing'
    });

  } catch (error) {
    console.error('❌ Read.ai webhook error:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed' 
    });
  }
});

export default router;
