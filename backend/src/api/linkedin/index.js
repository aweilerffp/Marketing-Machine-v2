import express from 'express';
import axios from 'axios';
import { requireAuth, getUserId } from '../../middleware/clerk.js';
import postingRouter from './posting.js';
import prisma from '../../models/prisma.js';

const router = express.Router();

// LinkedIn posting endpoints  
router.use('/', postingRouter);

// Start LinkedIn OAuth flow
router.get('/auth', requireAuth, (req, res) => {
  const state = Math.random().toString(36).substring(7);
  const scope = 'r_liteprofile%20r_emailaddress%20w_member_social';
  
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

    const { access_token, expires_in } = tokenResponse.data;

    // TODO: Encrypt token before storing
    await prisma.user.update({
      where: { clerkId },
      data: { 
        linkedinToken: access_token 
      }
    });

    res.json({ 
      success: true, 
      expiresIn: expires_in 
    });

  } catch (error) {
    console.error('LinkedIn callback error:', error);
    res.status(500).json({ error: 'Failed to authenticate with LinkedIn' });
  }
});

// Get LinkedIn connection status
router.get('/status', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { linkedinToken: true }
    });

    res.json({
      connected: !!user?.linkedinToken
    });

  } catch (error) {
    console.error('LinkedIn status error:', error);
    res.status(500).json({ error: 'Failed to get LinkedIn status' });
  }
});

// Test LinkedIn connection
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { linkedinToken: true }
    });

    if (!user?.linkedinToken) {
      return res.status(401).json({ error: 'LinkedIn not connected' });
    }

    // Test the token by fetching profile
    const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${user.linkedinToken}`
      }
    });

    res.json(profileResponse.data);

  } catch (error) {
    console.error('LinkedIn profile error:', error);
    
    if (error.response?.status === 401) {
      // Token expired, clear it
      await prisma.user.update({
        where: { clerkId: getUserId(req) },
        data: { linkedinToken: null }
      });
      return res.status(401).json({ error: 'LinkedIn token expired' });
    }

    res.status(500).json({ error: 'Failed to get LinkedIn profile' });
  }
});

export default router;