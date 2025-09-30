import express from 'express';
import { requireAuth, getUserId } from '../../middleware/clerk.js';
import {
  getLinkedInConnection,
  hasLinkedInConnection
} from '../../services/linkedin/connection.js';
import {
  postTextToLinkedIn,
  getLinkedInPersonUrn,
  validateLinkedInConnection,
  getLinkedInRateLimit
} from '../../services/linkedin/posting.js';
import {
  getLinkedInPostingHistory,
  getLinkedInPostingStats,
  checkLinkedInRateLimit
} from '../../services/linkedin/tracking.js';
import prisma from '../../models/prisma.js';

const router = express.Router();

/**
 * Post content to LinkedIn manually
 */
router.post('/post', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    const { text, contentId, visibility = 'PUBLIC' } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Post text is required' });
    }

    if (text.length > 3000) {
      return res.status(400).json({ error: 'Post text cannot exceed 3,000 characters' });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get LinkedIn connection
    const connection = await getLinkedInConnection(user.id);
    if (!connection) {
      return res.status(400).json({
        error: 'LinkedIn not connected. Please connect your LinkedIn account first.'
      });
    }

    // Validate connection
    const connectionStatus = await validateLinkedInConnection(connection.accessToken);
    if (!connectionStatus.connected) {
      return res.status(400).json({
        error: 'LinkedIn connection expired. Please reconnect your account.'
      });
    }

    // Get person URN
    const personUrn = await getLinkedInPersonUrn(connection.accessToken);

    // Post to LinkedIn
    const postResult = await postTextToLinkedIn(
      connection.accessToken,
      personUrn,
      text,
      visibility
    );

    if (!postResult.success) {
      return res.status(500).json({
        error: `LinkedIn posting failed: ${postResult.error}`,
        statusCode: postResult.statusCode
      });
    }

    // Update content post record if provided
    if (contentId) {
      try {
        await prisma.contentPost.update({
          where: { id: contentId },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
            platformContent: {
              linkedin: {
                postId: postResult.linkedinPostId,
                publishedAt: postResult.publishedAt,
                visibility: visibility
              }
            }
          }
        });
      } catch (updateError) {
        console.warn('Failed to update ContentPost record:', updateError);
        // Don't fail the request if the post was successful
      }
    }

    console.log('✅ LinkedIn post successful:', postResult.linkedinPostId);

    res.json({
      success: true,
      linkedinPostId: postResult.linkedinPostId,
      publishedAt: postResult.publishedAt,
      message: 'Successfully posted to LinkedIn!',
      visibility: visibility
    });

  } catch (error) {
    console.error('LinkedIn posting error:', error);
    res.status(500).json({
      error: 'Failed to post to LinkedIn',
      details: error.message
    });
  }
});

/**
 * Check LinkedIn posting status and rate limits
 */
router.get('/status', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const connection = await getLinkedInConnection(user.id);
    if (!connection) {
      return res.json({
        connected: false,
        message: 'LinkedIn not connected'
      });
    }

    const connectionStatus = await validateLinkedInConnection(connection.accessToken);
    const rateLimitStatus = await checkLinkedInRateLimit(user.id);

    res.json({
      connected: connectionStatus.connected,
      expiresAt: connection.expiresAt,
      rateLimit: rateLimitStatus,
      profile: connection.connectionMetadata,
      message: connectionStatus.connected ? 'LinkedIn connected and ready for posting' : 'LinkedIn connection expired'
    });

  } catch (error) {
    console.error('LinkedIn status check error:', error);
    res.status(500).json({
      error: 'Failed to check LinkedIn status',
      details: error.message
    });
  }
});

/**
 * Test post to LinkedIn (for manual testing)
 */
router.post('/test', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const connection = await getLinkedInConnection(user.id);
    if (!connection) {
      return res.status(400).json({
        error: 'LinkedIn not connected. Please connect your LinkedIn account first.'
      });
    }

    const testText = `Test post from Marketing Machine - ${new Date().toISOString()}`;

    // Get person URN
    const personUrn = await getLinkedInPersonUrn(connection.accessToken);

    // Post test content
    const postResult = await postTextToLinkedIn(
      connection.accessToken,
      personUrn,
      testText,
      'CONNECTIONS' // Use connections only for test posts
    );

    if (!postResult.success) {
      return res.status(500).json({
        error: `Test post failed: ${postResult.error}`,
        statusCode: postResult.statusCode
      });
    }

    res.json({
      success: true,
      message: 'Test post successful!',
      linkedinPostId: postResult.linkedinPostId,
      testText: testText
    });

  } catch (error) {
    console.error('LinkedIn test post error:', error);
    res.status(500).json({
      error: 'Failed to create test post',
      details: error.message
    });
  }
});

/**
 * Get LinkedIn posting history
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    const limit = parseInt(req.query.limit) || 10;

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const history = await getLinkedInPostingHistory(user.id, limit);

    res.json({
      success: true,
      posts: history,
      total: history.length
    });

  } catch (error) {
    console.error('LinkedIn history error:', error);
    res.status(500).json({
      error: 'Failed to get LinkedIn posting history',
      details: error.message
    });
  }
});

/**
 * Get LinkedIn posting statistics
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    const days = parseInt(req.query.days) || 30;

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stats = await getLinkedInPostingStats(user.id, days);

    res.json({
      success: true,
      stats,
      period: `${days} days`
    });

  } catch (error) {
    console.error('LinkedIn stats error:', error);
    res.status(500).json({
      error: 'Failed to get LinkedIn posting statistics',
      details: error.message
    });
  }
});

export default router;