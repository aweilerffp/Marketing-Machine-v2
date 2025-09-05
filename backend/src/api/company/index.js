import express from 'express';
import { requireAuth, getUserId } from '../../middleware/clerk.js';
import prisma from '../../models/prisma.js';
import crypto from 'crypto';

const router = express.Router();

// Get company profile
router.get('/', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    
    let user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    // Just-in-time user creation: if user doesn't exist, create them
    if (!user) {
      console.log(`Creating new user for Clerk ID: ${clerkId}`);
      user = await prisma.user.create({
        data: {
          clerkId,
          email: req.auth.user?.emailAddresses?.[0]?.emailAddress || `${clerkId}@example.com`
        },
        include: { company: true }
      });
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
    
    let user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    // Just-in-time user creation: if user doesn't exist, create them
    if (!user) {
      console.log(`Creating new user for Clerk ID: ${clerkId}`);
      user = await prisma.user.create({
        data: {
          clerkId,
          email: req.auth.user?.emailAddresses?.[0]?.emailAddress || `${clerkId}@example.com`
        },
        include: { company: true }
      });
    }

    // Return null if no company exists (onboarding needed)
    res.json(user.company || null);
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

    let user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    // Just-in-time user creation: if user doesn't exist, create them
    if (!user) {
      console.log(`Creating new user for Clerk ID: ${clerkId}`);
      user = await prisma.user.create({
        data: {
          clerkId,
          email: req.auth.user?.emailAddresses?.[0]?.emailAddress || `${clerkId}@example.com`
        },
        include: { company: true }
      });
    }

    let company;
    if (user.company) {
      // Update existing company
      company = await prisma.company.update({
        where: { userId: user.id },
        data: {
          name,
          brandVoiceData: brandVoiceData || {},
          contentPillars: JSON.stringify(contentPillars || []),
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
          contentPillars: JSON.stringify(contentPillars || []),
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

// Update scheduling settings
router.put('/scheduling', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    const schedulingConfig = req.body;

    if (!schedulingConfig) {
      return res.status(400).json({ error: 'Scheduling configuration is required' });
    }

    let user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    // Just-in-time user creation: if user doesn't exist, create them
    if (!user) {
      console.log(`Creating new user for Clerk ID: ${clerkId}`);
      user = await prisma.user.create({
        data: {
          clerkId,
          email: req.auth.user?.emailAddresses?.[0]?.emailAddress || `${clerkId}@example.com`
        },
        include: { company: true }
      });
    }

    if (!user.company) {
      return res.status(404).json({ error: 'Company profile not found. Please complete onboarding first.' });
    }

    const updatedCompany = await prisma.company.update({
      where: { userId: user.id },
      data: {
        postingSchedule: schedulingConfig
      }
    });

    res.json({ 
      message: 'Scheduling settings updated successfully',
      postingSchedule: updatedCompany.postingSchedule 
    });
  } catch (error) {
    console.error('Scheduling update error:', error);
    res.status(500).json({ error: 'Failed to update scheduling settings' });
  }
});

// Delete company profile (for reset)
router.delete('/', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    if (!user || !user.company) {
      return res.status(404).json({ error: 'No company to delete' });
    }

    await prisma.company.delete({
      where: { userId: user.id }
    });

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Company delete error:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

// ========================
// WEBHOOK MANAGEMENT ENDPOINTS
// ========================

// Get current webhook URL for company
router.get('/webhook', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    if (!user || !user.company) {
      return res.status(404).json({ error: 'Company profile not found. Please complete onboarding first.' });
    }

    const company = user.company;
    
    // If no webhook token exists, return null
    if (!company.webhookToken) {
      return res.json({ 
        webhookUrl: null,
        isActive: false,
        instructions: 'Generate a webhook URL to start receiving Read.ai notifications'
      });
    }

    // Generate the full webhook URL
    let baseUrl;
    if (process.env.NGROK_URL) {
      // Use ngrok URL for development testing
      baseUrl = process.env.NGROK_URL;
    } else {
      baseUrl = process.env.FRONTEND_URL?.replace(':5173', ':3001') || 'http://localhost:3001';
    }
    const webhookUrl = `${baseUrl}/api/webhooks/readai/${company.id}/${company.webhookToken}`;

    res.json({
      webhookUrl,
      isActive: company.webhookActive,
      companyId: company.id,
      tokenPreview: `${company.webhookToken.substring(0, 8)}...`
    });

  } catch (error) {
    console.error('Webhook fetch error:', error);
    res.status(500).json({ error: 'Failed to get webhook configuration' });
  }
});

// Generate or regenerate webhook URL
router.post('/webhook/generate', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    if (!user || !user.company) {
      return res.status(404).json({ error: 'Company profile not found. Please complete onboarding first.' });
    }

    // Generate cryptographically secure random token
    const webhookToken = crypto.randomBytes(32).toString('hex');

    // Update company with new webhook token
    const updatedCompany = await prisma.company.update({
      where: { id: user.company.id },
      data: {
        webhookToken,
        webhookActive: true
      }
    });

    // Generate the full webhook URL
    let baseUrl;
    if (process.env.NGROK_URL) {
      // Use ngrok URL for development testing
      baseUrl = process.env.NGROK_URL;
    } else {
      baseUrl = process.env.FRONTEND_URL?.replace(':5173', ':3001') || 'http://localhost:3001';
    }
    const webhookUrl = `${baseUrl}/api/webhooks/readai/${updatedCompany.id}/${webhookToken}`;

    console.log(`🔗 Generated webhook URL for company ${updatedCompany.name}: ${webhookUrl.replace(webhookToken, 'TOKEN_HIDDEN')}`);

    res.json({
      webhookUrl,
      isActive: updatedCompany.webhookActive,
      companyId: updatedCompany.id,
      tokenPreview: `${webhookToken.substring(0, 8)}...`,
      message: 'Webhook URL generated successfully! Copy this URL to your Read.ai webhook configuration.'
    });

  } catch (error) {
    console.error('Webhook generation error:', error);
    res.status(500).json({ error: 'Failed to generate webhook URL' });
  }
});

// Toggle webhook active/inactive
router.put('/webhook/toggle', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    if (!user || !user.company) {
      return res.status(404).json({ error: 'Company profile not found. Please complete onboarding first.' });
    }

    if (!user.company.webhookToken) {
      return res.status(400).json({ error: 'No webhook URL exists. Generate one first.' });
    }

    // Toggle the active state
    const updatedCompany = await prisma.company.update({
      where: { id: user.company.id },
      data: {
        webhookActive: !user.company.webhookActive
      }
    });

    const action = updatedCompany.webhookActive ? 'activated' : 'deactivated';
    console.log(`🔄 Webhook ${action} for company ${updatedCompany.name}`);

    res.json({
      isActive: updatedCompany.webhookActive,
      message: `Webhook ${action} successfully`
    });

  } catch (error) {
    console.error('Webhook toggle error:', error);
    res.status(500).json({ error: 'Failed to toggle webhook status' });
  }
});

export default router;