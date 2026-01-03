import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { requireAuth, getUserId } from '../../middleware/clerk.js';
import prisma from '../../models/prisma.js';
import {
  saveZoomConnection,
  getZoomConnection,
  hasZoomConnection,
  removeZoomConnection,
  getZoomProfile
} from '../../services/zoom/connection.js';

const router = express.Router();

// Start Zoom OAuth flow
router.get('/auth', requireAuth, (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');

  // Zoom OAuth scopes for cloud recording access
  const scopes = [
    'cloud_recording:read:list_recording_files',
    'user:read:list_recordings'
  ];
  const scope = encodeURIComponent(scopes.join(' '));

  const zoomAuthUrl = `https://zoom.us/oauth/authorize?` +
    `response_type=code&` +
    `client_id=${process.env.ZOOM_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(process.env.ZOOM_REDIRECT_URI)}&` +
    `state=${state}&` +
    `scope=${scope}`;

  // TODO: Store state in session/cache for CSRF validation

  res.json({ authUrl: zoomAuthUrl, state });
});

// Handle Zoom OAuth callback
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
    // Zoom uses Basic auth with client_id:client_secret
    const tokenResponse = await axios.post('https://zoom.us/oauth/token', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.ZOOM_REDIRECT_URI
      },
      headers: {
        'Authorization': `Basic ${Buffer.from(
          `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
        ).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Get Zoom user profile
    const profileResponse = await axios.get('https://api.zoom.us/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    // Save connection using PlatformConnection model
    await saveZoomConnection(
      user.id,
      access_token,
      refresh_token,
      expires_in,
      profileResponse.data
    );

    res.json({
      success: true,
      expiresIn: expires_in,
      profile: {
        name: `${profileResponse.data.first_name || ''} ${profileResponse.data.last_name || ''}`.trim(),
        email: profileResponse.data.email,
        id: profileResponse.data.id
      }
    });

  } catch (error) {
    console.error('Zoom callback error:', error.response?.data || error);
    res.status(500).json({ error: 'Failed to authenticate with Zoom' });
  }
});

// Get Zoom connection status
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

    const connection = await prisma.platformConnection.findUnique({
      where: {
        userId_platform: {
          userId: user.id,
          platform: 'zoom'
        }
      }
    });

    if (!connection) {
      return res.json({
        connected: false
      });
    }

    res.json({
      connected: true,
      profile: {
        email: connection.connectionMetadata?.email,
        firstName: connection.connectionMetadata?.firstName,
        lastName: connection.connectionMetadata?.lastName,
        connectedAt: connection.connectionMetadata?.connectedAt
      },
      expiresAt: connection.expiresAt
    });

  } catch (error) {
    console.error('Zoom status error:', error);
    res.status(500).json({ error: 'Failed to get Zoom status' });
  }
});

// Get Zoom profile (validates connection)
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

    const profileData = await getZoomProfile(user.id);
    res.json(profileData);

  } catch (error) {
    console.error('Zoom profile error:', error);

    if (error.message === 'Zoom token expired') {
      return res.status(401).json({ error: 'Zoom token expired', code: 'TOKEN_EXPIRED' });
    }

    if (error.message === 'No Zoom connection found') {
      return res.status(401).json({ error: 'Zoom not connected', code: 'NOT_CONNECTED' });
    }

    res.status(500).json({ error: 'Failed to get Zoom profile' });
  }
});

// Disconnect Zoom
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

    // Remove Zoom connection
    await removeZoomConnection(user.id);

    res.json({ success: true, message: 'Zoom account disconnected' });

  } catch (error) {
    console.error('Zoom disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Zoom' });
  }
});

export default router;
