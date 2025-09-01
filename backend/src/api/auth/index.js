import express from 'express';
import { requireAuth, getUserId } from '../../middleware/clerk.js';
import prisma from '../../models/prisma.js';

const router = express.Router();

// Get or create user profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    
    let user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        company: true
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
          company: true
        }
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Failed to get user' });
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