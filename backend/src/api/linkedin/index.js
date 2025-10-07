import express from 'express';
import axios from 'axios';
import { requireAuth, getUserId } from '../../middleware/clerk.js';
import postingRouter from './posting.js';
import prisma from '../../models/prisma.js';
import {
  saveLinkedInConnection,
  getLinkedInConnection,
  hasLinkedInConnection,
  removeLinkedInConnection,
  getLinkedInProfile
} from '../../services/linkedin/connection.js';

const router = express.Router();

// LinkedIn posting endpoints  
router.use('/', postingRouter);

// Start LinkedIn OAuth flow
router.get('/auth', requireAuth, (req, res) => {
  const state = Math.random().toString(36).substring(7);
  // Updated to LinkedIn API v2 scopes
  const scope = 'openid%20profile%20email%20w_member_social';

  const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI)}&state=${state}&scope=${scope}`;

  // Store state in session/cache for validation
  // TODO: Implement proper state validation

  res.json({ authUrl: linkedinAuthUrl });
});

// Handle LinkedIn OAuth callback
router.post('/callback', requireAuth, async (req, res) => {
  try {
    const { code, state } = req.body;
    const clerkId = getUserId(req);

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Get user ID from clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, expires_in, refresh_token } = tokenResponse.data;

    // Get LinkedIn profile data using OpenID Connect userinfo endpoint
    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    // Save connection using PlatformConnection model
    await saveLinkedInConnection(
      user.id,
      access_token,
      expires_in,
      refresh_token,
      profileResponse.data
    );

    res.json({
      success: true,
      expiresIn: expires_in,
      profile: {
        name: profileResponse.data.name || `${profileResponse.data.given_name || ''} ${profileResponse.data.family_name || ''}`.trim(),
        id: profileResponse.data.sub
      }
    });

  } catch (error) {
    console.error('LinkedIn callback error:', error);
    res.status(500).json({ error: 'Failed to authenticate with LinkedIn' });
  }
});

// Note: /status endpoint is handled by posting router for rate limit info

// Test LinkedIn connection
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profileData = await getLinkedInProfile(user.id);
    res.json(profileData);

  } catch (error) {
    console.error('LinkedIn profile error:', error);

    if (error.message === 'LinkedIn token expired') {
      return res.status(401).json({ error: 'LinkedIn token expired' });
    }

    if (error.message === 'No LinkedIn connection found') {
      return res.status(401).json({ error: 'LinkedIn not connected' });
    }

    res.status(500).json({ error: 'Failed to get LinkedIn profile' });
  }
});

// Disconnect LinkedIn
router.delete('/disconnect', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Try to remove connection, but don't fail if it doesn't exist
    try {
      await removeLinkedInConnection(user.id);
    } catch (deleteError) {
      // Connection might not exist, which is fine
      console.log('No LinkedIn connection to remove for user:', user.id);
    }

    res.json({ success: true, message: 'LinkedIn account disconnected' });

  } catch (error) {
    console.error('LinkedIn disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect LinkedIn' });
  }
});

export default router;