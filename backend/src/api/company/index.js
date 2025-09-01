import express from 'express';
import { requireAuth, getUserId } from '../../middleware/clerk.js';
import prisma from '../../models/prisma.js';

const router = express.Router();

// Get company profile
router.get('/', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.company);
  } catch (error) {
    console.error('Company fetch error:', error);
    res.status(500).json({ error: 'Failed to get company' });
  }
});

// Get current user's company (alias for frontend API service)
router.get('/current', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(user.company);
  } catch (error) {
    console.error('Company fetch error:', error);
    res.status(500).json({ error: 'Failed to get company' });
  }
});

// Create or update company profile
router.post('/', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    const { 
      name, 
      brandVoiceData, 
      contentPillars, 
      postingSchedule 
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let company;
    if (user.company) {
      // Update existing company
      company = await prisma.company.update({
        where: { userId: user.id },
        data: {
          name,
          brandVoiceData: brandVoiceData || {},
          contentPillars: contentPillars || [],
          postingSchedule: postingSchedule || {
            defaultTimes: ['09:00', '13:00'],
            timezone: 'America/New_York'
          }
        }
      });
    } else {
      // Create new company
      company = await prisma.company.create({
        data: {
          userId: user.id,
          name,
          brandVoiceData: brandVoiceData || {},
          contentPillars: contentPillars || [],
          postingSchedule: postingSchedule || {
            defaultTimes: ['09:00', '13:00'],
            timezone: 'America/New_York'
          }
        }
      });
    }

    res.json(company);
  } catch (error) {
    console.error('Company update error:', error);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

export default router;