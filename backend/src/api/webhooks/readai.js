import express from 'express';
import prisma from '../../models/prisma.js';
import { transcriptQueue } from '../../services/queue/index.js';

const router = express.Router();

// Read.ai webhook handler
router.post('/', async (req, res) => {
  try {
    console.log('📥 Received Read.ai webhook:', req.body);
    
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
      chapter_summaries
    } = req.body;

    // Validate required fields
    if (!session_id || trigger !== 'meeting_end') {
      return res.status(400).json({ 
        error: 'Invalid webhook payload' 
      });
    }

    // Check if meeting already exists
    const existingMeeting = await prisma.meeting.findUnique({
      where: { readaiId: session_id }
    });

    if (existingMeeting) {
      console.log(`📝 Meeting ${session_id} already processed`);
      return res.status(200).json({ 
        message: 'Meeting already processed' 
      });
    }

    // Extract transcript from chapter summaries if available
    let fullTranscript = '';
    if (chapter_summaries && Array.isArray(chapter_summaries)) {
      fullTranscript = chapter_summaries
        .map(chapter => chapter.summary || '')
        .join('\n\n');
    }
    
    // Add to processing queue
    const jobData = {
      sessionId: session_id,
      title: title || 'Untitled Meeting',
      summary: summary || '',
      transcript: fullTranscript || summary || '',
      actionItems: action_items || [],
      keyQuestions: key_questions || [],
      topics: topics || [],
      owner: owner || null,
      participants: participants || [],
      reportUrl: report_url || null,
      receivedAt: new Date().toISOString()
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
    
    console.log(`✅ Read.ai webhook queued for processing: ${session_id}`);
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