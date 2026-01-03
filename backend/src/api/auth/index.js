import express from 'express';
import { requireAuth, getUserId } from '../../middleware/clerk.js';
import prisma from '../../models/prisma.js';
import { scheduleDeletion, cancelDeletion } from '../../services/compliance/dataDeletion.js';

const router = express.Router();

// Get or create user profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);

    let user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        company: true,
        consent: true,
        platformConnections: {
          select: {
            platform: true,
            connectionMetadata: true,
            expiresAt: true
          }
        }
      }
    });

    // Create user if doesn't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId,
          email: req.auth.emailAddresses?.[0]?.emailAddress || ''
        },
        include: {
          company: true,
          consent: true,
          platformConnections: {
            select: {
              platform: true,
              connectionMetadata: true,
              expiresAt: true
            }
          }
        }
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Get user consent status
router.get('/consent', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const consent = await prisma.userConsent.findUnique({
      where: { userId: user.id }
    });

    res.json({
      hasConsent: !!consent?.aiProcessingConsent,
      consentGrantedAt: consent?.aiConsentGrantedAt,
      consentVersion: consent?.consentVersion || '1.0'
    });
  } catch (error) {
    console.error('Consent fetch error:', error);
    res.status(500).json({ error: 'Failed to get consent status' });
  }
});

// Grant or update consent
router.post('/consent', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    const { aiProcessingConsent } = req.body;

    if (typeof aiProcessingConsent !== 'boolean') {
      return res.status(400).json({ error: 'aiProcessingConsent must be a boolean' });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const consent = await prisma.userConsent.upsert({
      where: { userId: user.id },
      update: {
        aiProcessingConsent,
        aiConsentGrantedAt: aiProcessingConsent ? new Date() : null,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        aiProcessingConsent,
        aiConsentGrantedAt: aiProcessingConsent ? new Date() : null
      }
    });

    res.json({
      success: true,
      consent: {
        aiProcessingConsent: consent.aiProcessingConsent,
        consentGrantedAt: consent.aiConsentGrantedAt,
        consentVersion: consent.consentVersion
      }
    });
  } catch (error) {
    console.error('Consent update error:', error);
    res.status(500).json({ error: 'Failed to update consent' });
  }
});

// Request account deletion
router.post('/delete-account', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
      include: {
        platformConnections: {
          where: { platform: 'zoom' },
          select: { platformUserId: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get Zoom user ID if connected
    const zoomUserId = user.platformConnections?.[0]?.platformUserId || null;

    // Schedule deletion in 10 days
    const deletionRequest = await scheduleDeletion(user.id, zoomUserId, 10);

    res.json({
      success: true,
      scheduledFor: deletionRequest.scheduledFor,
      message: 'Account deletion scheduled. All data will be permanently deleted in 10 days.'
    });
  } catch (error) {
    console.error('Account deletion request error:', error);
    res.status(500).json({ error: 'Failed to schedule account deletion' });
  }
});

// Cancel pending account deletion
router.delete('/delete-account', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find pending deletion request
    const pendingRequest = await prisma.deletionRequest.findFirst({
      where: {
        userId: user.id,
        status: 'PENDING'
      }
    });

    if (!pendingRequest) {
      return res.status(404).json({ error: 'No pending deletion request found' });
    }

    await cancelDeletion(pendingRequest.id);

    res.json({
      success: true,
      message: 'Account deletion cancelled'
    });
  } catch (error) {
    console.error('Cancel deletion error:', error);
    res.status(500).json({ error: 'Failed to cancel account deletion' });
  }
});

// Update LinkedIn token
router.put('/linkedin-token', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // TODO: Encrypt token before storing
    const user = await prisma.user.update({
      where: { clerkId },
      data: { linkedinToken: token }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('LinkedIn token update error:', error);
    res.status(500).json({ error: 'Failed to update token' });
  }
});

export default router;