import express from 'express';
import { requireAuth, getUserId } from '../../middleware/clerk.js';
import { linkedInService } from '../../services/linkedin/LinkedInService.js';
import { authService } from '../../services/auth/AuthService.js';
import prisma from '../../models/prisma.js';

const router = express.Router();

/**
 * Post content to LinkedIn
 */
router.post('/post', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    const { contentId, content, scheduleFor } = req.body;

    if (!content || !content.text) {
      return res.status(400).json({ error: 'Content text is required' });
    }

    // Get user and LinkedIn token
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const linkedInToken = await authService.getLinkedInToken(user.id);
    if (!linkedInToken) {
      return res.status(400).json({ 
        error: 'LinkedIn not connected. Please connect your LinkedIn account first.' 
      });
    }

    // Validate LinkedIn connection
    const connectionStatus = await linkedInService.validateConnection(linkedInToken);
    if (!connectionStatus.connected) {
      return res.status(400).json({ 
        error: 'LinkedIn connection expired. Please reconnect your account.' 
      });
    }

    // Post to LinkedIn
    const postResult = await linkedInService.postContent({
      text: content.text,
      imagePrompt: content.imagePrompt,
      scheduledFor: scheduleFor ? new Date(scheduleFor) : undefined
    }, linkedInToken);

    if (!postResult.success) {
      return res.status(500).json({ 
        error: `LinkedIn posting failed: ${postResult.error}` 
      });
    }

    // Update content post record if provided
    if (contentId) {
      await prisma.contentPost.update({
        where: { id: contentId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(postResult.publishedAt),
          platformContent: JSON.stringify({
            linkedin: {
              postId: postResult.linkedinPostId,
              publishedAt: postResult.publishedAt
            }
          })
        }
      });
    }

    console.log('✅ LinkedIn post successful:', postResult.linkedinPostId);

    res.json({
      success: true,
      linkedinPostId: postResult.linkedinPostId,
      publishedAt: postResult.publishedAt,
      message: 'Successfully posted to LinkedIn!'
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
 * Check LinkedIn connection status
 */
router.get('/status', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const linkedInToken = await authService.getLinkedInToken(user.id);
    if (!linkedInToken) {
      return res.json({ 
        connected: false,
        message: 'LinkedIn not connected'
      });
    }

    const connectionStatus = await linkedInService.validateConnection(linkedInToken);
    const rateLimitStatus = await linkedInService.getRateLimitStatus(linkedInToken);

    res.json({
      connected: connectionStatus.connected,
      expiresAt: connectionStatus.expiresAt,
      rateLimit: rateLimitStatus,
      message: connectionStatus.connected ? 'LinkedIn connected' : 'LinkedIn connection expired'
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
 * Store LinkedIn OAuth token (called after OAuth flow)
 */
router.post('/connect', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    const { accessToken, expiresIn } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate expiration date
    const expiresAt = expiresIn ? 
      new Date(Date.now() + (expiresIn * 1000)) : 
      new Date(Date.now() + (60 * 24 * 60 * 60 * 1000)); // 60 days default

    // Store encrypted token
    await authService.storeEncryptedToken(user.id, accessToken, expiresAt);

    console.log('✅ LinkedIn token stored for user:', user.id);

    res.json({
      success: true,
      message: 'LinkedIn connected successfully!'
    });

  } catch (error) {
    console.error('LinkedIn connection error:', error);
    res.status(500).json({ 
      error: 'Failed to connect LinkedIn',
      details: error.message 
    });
  }
});

export default router;