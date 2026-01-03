import express from 'express';
import crypto from 'crypto';
import prisma from '../../models/prisma.js';
import { transcriptQueue } from '../../services/queue/index.js';
import { parseVttTranscript, extractParticipants } from '../../services/zoom/vttParser.js';
import {
  findConnectionByZoomEmail,
  downloadZoomTranscript,
  getZoomAccessToken
} from '../../services/zoom/connection.js';

const router = express.Router();

/**
 * Verify Zoom webhook signature
 * @param {object} req - Express request object
 * @returns {boolean} - Whether signature is valid
 */
function verifyZoomWebhook(req) {
  const timestamp = req.headers['x-zm-request-timestamp'];
  const signature = req.headers['x-zm-signature'];

  if (!timestamp || !signature) {
    console.log('Missing Zoom webhook headers');
    return false;
  }

  const message = `v0:${timestamp}:${JSON.stringify(req.body)}`;
  const hashForVerify = crypto
    .createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET_TOKEN)
    .update(message)
    .digest('hex');

  const expectedSignature = `v0=${hashForVerify}`;

  return signature === expectedSignature;
}

/**
 * Main webhook endpoint
 * Handles URL validation, transcript completion, and deauthorization
 */
router.post('/', async (req, res) => {
  try {
    const { event, payload } = req.body;

    // Handle Zoom URL validation (no signature verification needed)
    if (event === 'endpoint.url_validation') {
      console.log('Zoom webhook URL validation request received');

      const hashForValidate = crypto
        .createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET_TOKEN)
        .update(payload.plainToken)
        .digest('hex');

      return res.json({
        plainToken: payload.plainToken,
        encryptedToken: hashForValidate
      });
    }

    // Verify webhook signature for all other events
    if (!verifyZoomWebhook(req)) {
      console.error('Zoom webhook signature verification failed');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Handle events
    switch (event) {
      case 'recording.transcript_completed':
        await handleTranscriptCompleted(payload);
        break;

      case 'app_deauthorized':
        await handleDeauthorization(payload);
        break;

      default:
        console.log(`Unhandled Zoom event: ${event}`);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Zoom webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle recording.transcript_completed event
 * Downloads transcript, parses VTT, and queues for processing
 */
async function handleTranscriptCompleted(payload) {
  const { object } = payload;
  const meetingId = object.uuid;
  const hostEmail = object.host_email;
  const topic = object.topic || 'Untitled Meeting';

  console.log(`📝 Transcript completed for meeting: ${meetingId} (${topic})`);
  console.log(`👤 Host email: ${hostEmail}`);

  // Find user by Zoom email
  const connection = await findConnectionByZoomEmail(hostEmail);

  if (!connection) {
    console.log(`⚠️ No Zoom connection found for email: ${hostEmail}`);
    return;
  }

  const user = connection.user;
  const company = user?.company;
  const consent = user?.consent;

  // Check AI consent before processing
  if (!consent?.aiProcessingConsent) {
    console.log(`⚠️ No AI consent for user ${hostEmail}, skipping transcript`);
    return;
  }

  if (!company) {
    console.log(`⚠️ No company found for user ${hostEmail}, skipping transcript`);
    return;
  }

  // Find transcript file in recording_files
  const transcriptFile = object.recording_files?.find(
    f => f.file_type === 'TRANSCRIPT' && f.file_extension === 'VTT'
  );

  if (!transcriptFile) {
    console.log(`⚠️ No VTT transcript found for meeting ${meetingId}`);
    return;
  }

  console.log(`📥 Downloading transcript from: ${transcriptFile.download_url}`);

  // Get access token for the user
  const accessToken = await getZoomAccessToken(user.id);

  if (!accessToken) {
    console.error(`❌ Could not get access token for user ${user.id}`);
    return;
  }

  // Download transcript file
  const vttContent = await downloadZoomTranscript(transcriptFile.download_url, accessToken);

  // Parse VTT content
  const parsedTranscript = parseVttTranscript(vttContent);
  const participants = extractParticipants(parsedTranscript);

  console.log(`📊 Parsed transcript: ${parsedTranscript.speakers.length} speakers, ${parsedTranscript.segments.length} segments`);

  // Queue for processing
  const jobData = {
    sessionId: meetingId,
    sourceSessionId: meetingId,
    title: topic,
    transcript: parsedTranscript.text,
    summary: null, // Zoom doesn't provide summaries
    actionItems: null,
    participants,
    owner: {
      email: hostEmail,
      name: `${connection.connectionMetadata?.firstName || ''} ${connection.connectionMetadata?.lastName || ''}`.trim()
    },
    companyId: company.id,
    companyName: company.name,
    sourceType: 'ZOOM'
  };

  await transcriptQueue.add('process-transcript', jobData, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  });

  console.log(`✅ Transcript queued for processing: ${meetingId}`);
}

/**
 * Handle app_deauthorized event
 * Schedules user data deletion in 10 days
 */
async function handleDeauthorization(payload) {
  const { user_id: zoomUserId, account_id: accountId, deauthorization_time } = payload;

  console.log(`🔓 Deauthorization received for Zoom user: ${zoomUserId}`);

  // Find connection by Zoom user ID
  const connection = await prisma.platformConnection.findFirst({
    where: {
      platform: 'zoom',
      platformUserId: zoomUserId
    },
    include: {
      user: true
    }
  });

  if (!connection) {
    console.log(`⚠️ No connection found for Zoom user: ${zoomUserId}`);
    return;
  }

  // Schedule data deletion in 10 days (maximum allowed by Zoom)
  const scheduledFor = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

  // Create deletion request
  await prisma.deletionRequest.create({
    data: {
      userId: connection.userId,
      zoomUserId,
      status: 'PENDING',
      scheduledFor
    }
  });

  // Remove Zoom connection immediately
  await prisma.platformConnection.delete({
    where: { id: connection.id }
  });

  console.log(`📅 Deletion scheduled for ${scheduledFor.toISOString()} for user: ${connection.userId}`);
}

export default router;
