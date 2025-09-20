import express from 'express';
import { requireAuth, getUserId } from '../../middleware/clerk.js';
import prisma from '../../models/prisma.js';
import crypto from 'crypto';
import { generateCustomLinkedInPrompt, getCustomLinkedInPrompt, generateCustomHookPrompt, getCustomHookPrompt } from '../../services/ai/promptGeneration.js';

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
    
    // In dev mode with mock auth, ensure we have a specific dev user and company
    if (clerkId === 'dev_user_123') {
      // Find or create dev user
      let devUser = await prisma.user.findUnique({
        where: { clerkId: 'dev_user_123' },
        include: { company: true }
      });

      if (!devUser) {
        console.log('🚧 Dev mode: Creating dev user');
        devUser = await prisma.user.create({
          data: {
            clerkId: 'dev_user_123',
            email: 'dev@example.com'
          },
          include: { company: true }
        });
      }

      // If dev user has no company, find an existing company with brand voice data and assign it
      if (!devUser.company) {
        const existingCompany = await prisma.company.findFirst({
          where: {
            AND: [
              { brandVoiceData: { not: null } },
              { name: { not: 'temp' } },
              { userId: null } // Unassigned company
            ]
          }
        });

        if (existingCompany) {
          console.log(`🚧 Dev mode: Assigning existing company ${existingCompany.name} to dev user`);
          const updatedCompany = await prisma.company.update({
            where: { id: existingCompany.id },
            data: { userId: devUser.id }
          });
          return res.json(updatedCompany);
        }
      }

      if (devUser.company) {
        console.log(`🚧 Dev mode: Using dev user's company: ${devUser.company.name}`);
        return res.json(devUser.company);
      }

      // No company found, will proceed to create one or return null
      console.log('🚧 Dev mode: No company found for dev user');
      return res.json(null);
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

    // Generate custom LinkedIn prompt after brand onboarding completion
    if (brandVoiceData && Object.keys(brandVoiceData).length > 0) {
      console.log(`🎯 Triggering custom prompt generation for company: ${company.name}`);
      
      // Generate custom prompt in background (don't wait for it)
      generateCustomLinkedInPrompt(company.id).then(() => {
        console.log(`✨ Custom LinkedIn prompt generated for ${company.name}`);
      }).catch(error => {
        console.error(`❌ Failed to generate custom prompt for ${company.name}:`, error);
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
    
    // In dev mode with mock auth, use existing company with brand voice data
    let company;
    if (clerkId === 'dev_user_123') {
      company = await prisma.company.findFirst({
        where: {
          AND: [
            { brandVoiceData: { not: null } },
            { name: { not: 'temp' } }
          ]
        }
      });
      
      if (!company) {
        return res.status(404).json({ error: 'No company found in dev mode.' });
      }
    } else {
      const user = await prisma.user.findUnique({
        where: { clerkId },
        include: { company: true }
      });

      if (!user || !user.company) {
        return res.status(404).json({ error: 'Company profile not found. Please complete onboarding first.' });
      }
      company = user.company;
    }
    
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
    
    // In dev mode with mock auth, use existing company with brand voice data
    let company;
    if (clerkId === 'dev_user_123') {
      company = await prisma.company.findFirst({
        where: {
          AND: [
            { brandVoiceData: { not: null } },
            { name: { not: 'temp' } }
          ]
        }
      });
      
      if (!company) {
        return res.status(404).json({ error: 'No company found in dev mode.' });
      }
    } else {
      const user = await prisma.user.findUnique({
        where: { clerkId },
        include: { company: true }
      });

      if (!user || !user.company) {
        return res.status(404).json({ error: 'Company profile not found. Please complete onboarding first.' });
      }
      company = user.company;
    }

    // Generate cryptographically secure random token
    const webhookToken = crypto.randomBytes(32).toString('hex');

    // Update company with new webhook token
    const updatedCompany = await prisma.company.update({
      where: { id: company.id },
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

// ========================
// PROMPT MANAGEMENT ENDPOINTS
// ========================

// Get current custom LinkedIn prompt
router.get('/prompt', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    
    // Use the same logic as /current endpoint to find the right company
    let company;
    if (clerkId === 'dev_user_123') {
      // Find or create dev user
      let devUser = await prisma.user.findUnique({
        where: { clerkId: 'dev_user_123' },
        include: { company: true }
      });

      if (!devUser) {
        console.log('🚧 Dev mode: Creating dev user');
        devUser = await prisma.user.create({
          data: {
            clerkId: 'dev_user_123',
            email: 'dev@example.com'
          },
          include: { company: true }
        });
      }

      // If dev user has no company, find an existing company with brand voice data and assign it
      if (!devUser.company) {
        const existingCompany = await prisma.company.findFirst({
          where: {
            AND: [
              { brandVoiceData: { not: null } },
              { name: { not: 'temp' } },
              { userId: null } // Unassigned company
            ]
          }
        });

        if (existingCompany) {
          console.log(`🚧 Dev mode: Assigning existing company ${existingCompany.name} to dev user`);
          const updatedCompany = await prisma.company.update({
            where: { id: existingCompany.id },
            data: { userId: devUser.id }
          });
          company = updatedCompany;
        }
      } else {
        company = devUser.company;
      }
      
      if (!company) {
        return res.status(404).json({ error: 'No company found in dev mode.' });
      }
    } else {
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
      company = user.company;
    }

    // Get or generate custom prompt
    const prompt = await getCustomLinkedInPrompt(company.id);
    const hasCustomPrompt = !!company.customLinkedInPrompt;

    res.json({
      prompt,
      lastGenerated: company.updatedAt,
      lastModified: company.updatedAt,
      isCustom: hasCustomPrompt,
      companyName: company.name
    });

  } catch (error) {
    console.error('Prompt fetch error:', error);
    res.status(500).json({ error: 'Failed to get custom prompt' });
  }
});

// Update custom LinkedIn prompt
router.put('/prompt', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt content is required' });
    }

    if (prompt.length > 10000) {
      return res.status(400).json({ error: 'Prompt too long (max 10,000 characters)' });
    }

    // Basic validation - ensure prompt has essential structure
    const requiredElements = ['Hook:', 'Content Pillar:', 'Brand Voice'];
    const missingElements = requiredElements.filter(element => !prompt.includes(element));
    
    if (missingElements.length > 0) {
      return res.status(400).json({ 
        error: `Prompt missing required elements: ${missingElements.join(', ')}`,
        hint: 'Ensure your prompt includes placeholders for Hook, Content Pillar, and Brand Voice data'
      });
    }

    // In dev mode with mock auth, use existing company with brand voice data
    let company;
    if (clerkId === 'dev_user_123') {
      company = await prisma.company.findFirst({
        where: {
          AND: [
            { brandVoiceData: { not: null } },
            { name: { not: 'temp' } }
          ]
        }
      });
      
      if (!company) {
        return res.status(404).json({ error: 'No company found in dev mode.' });
      }
    } else {
      const user = await prisma.user.findUnique({
        where: { clerkId },
        include: { company: true }
      });

      if (!user || !user.company) {
        return res.status(404).json({ error: 'Company profile not found. Please complete onboarding first.' });
      }
      company = user.company;
    }

    // Update the custom prompt
    const updatedCompany = await prisma.company.update({
      where: { id: company.id },
      data: {
        customLinkedInPrompt: prompt
      }
    });

    console.log(`📝 Custom LinkedIn prompt updated for ${updatedCompany.name} by user`);

    res.json({
      prompt,
      lastModified: updatedCompany.updatedAt,
      message: 'Custom prompt updated successfully',
      companyName: updatedCompany.name
    });

  } catch (error) {
    console.error('Prompt update error:', error);
    res.status(500).json({ error: 'Failed to update custom prompt' });
  }
});

// Regenerate custom LinkedIn prompt from brand voice data
router.post('/prompt/regenerate', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    
    // Use the same logic as /current endpoint to find the right company
    let company;
    if (clerkId === 'dev_user_123') {
      // Find or create dev user
      let devUser = await prisma.user.findUnique({
        where: { clerkId: 'dev_user_123' },
        include: { company: true }
      });

      if (!devUser) {
        console.log('🚧 Dev mode: Creating dev user');
        devUser = await prisma.user.create({
          data: {
            clerkId: 'dev_user_123',
            email: 'dev@example.com'
          },
          include: { company: true }
        });
      }

      // If dev user has no company, find an existing company with brand voice data and assign it
      if (!devUser.company) {
        const existingCompany = await prisma.company.findFirst({
          where: {
            AND: [
              { brandVoiceData: { not: null } },
              { name: { not: 'temp' } },
              { userId: null } // Unassigned company
            ]
          }
        });

        if (existingCompany) {
          console.log(`🚧 Dev mode: Assigning existing company ${existingCompany.name} to dev user`);
          const updatedCompany = await prisma.company.update({
            where: { id: existingCompany.id },
            data: { userId: devUser.id }
          });
          company = updatedCompany;
        }
      } else {
        company = devUser.company;
      }
      
      if (!company) {
        return res.status(404).json({ error: 'No company found in dev mode.' });
      }
    } else {
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
      company = user.company;
    }

    if (!company.brandVoiceData || Object.keys(company.brandVoiceData).length === 0) {
      return res.status(400).json({ 
        error: 'No brand voice data available. Please complete brand onboarding first.' 
      });
    }

    console.log(`🔄 Regenerating custom LinkedIn prompt for ${company.name}`);

    // Force regeneration of custom prompt
    const newPrompt = await generateCustomLinkedInPrompt(company.id);

    res.json({
      prompt: newPrompt,
      lastGenerated: new Date().toISOString(),
      message: 'Custom prompt regenerated successfully from brand voice data',
      companyName: company.name
    });

  } catch (error) {
    console.error('Prompt regeneration error:', error);
    res.status(500).json({ error: 'Failed to regenerate custom prompt' });
  }
});

// HOOK PROMPT MANAGEMENT ENDPOINTS
// ===============================

// Get current custom hook prompt
router.get('/hook-prompt', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    
    let user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let company = user.company;
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Get or generate custom hook prompt
    const prompt = await getCustomHookPrompt(company.id);
    const hasCustomPrompt = !!company.customHookPrompt;

    res.json({
      prompt,
      lastGenerated: company.updatedAt,
      lastModified: company.updatedAt,
      isCustom: hasCustomPrompt,
      companyName: company.name
    });

  } catch (error) {
    console.error('Hook prompt fetch error:', error);
    res.status(500).json({ error: 'Failed to get custom hook prompt' });
  }
});

// Update custom hook prompt
router.put('/hook-prompt', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Hook prompt content is required' });
    }

    if (prompt.length > 10000) {
      return res.status(400).json({ error: 'Hook prompt too long (max 10,000 characters)' });
    }

    // Basic validation - ensure prompt has essential structure for hooks
    const requiredElements = ['transcript', 'hooks', 'meeting'];
    const missingElements = requiredElements.filter(element => 
      !prompt.toLowerCase().includes(element.toLowerCase())
    );
    
    if (missingElements.length > 0) {
      return res.status(400).json({ 
        error: `Hook prompt missing required elements: ${missingElements.join(', ')}`,
        hint: 'Ensure your prompt includes placeholders for transcript, hooks, and meeting data'
      });
    }

    let user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let company = user.company;
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Update the custom hook prompt
    const updatedCompany = await prisma.company.update({
      where: { id: company.id },
      data: {
        customHookPrompt: prompt
      }
    });

    console.log(`📝 Custom hook prompt updated for ${updatedCompany.name} by user`);

    res.json({
      prompt,
      lastModified: updatedCompany.updatedAt,
      message: 'Custom hook prompt updated successfully',
      companyName: updatedCompany.name
    });

  } catch (error) {
    console.error('Hook prompt update error:', error);
    res.status(500).json({ error: 'Failed to update custom hook prompt' });
  }
});

// Regenerate custom hook prompt from brand voice data
router.post('/hook-prompt/regenerate', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    
    let user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let company = user.company;
    if (!company) {
      return res.status(404).json({ 
        error: 'No company found. Please complete your company setup first.' 
      });
    }

    console.log(`🔄 Regenerating custom hook prompt for ${company.name}`);

    // Force regeneration of custom hook prompt
    const newPrompt = await generateCustomHookPrompt(company.id);

    res.json({
      prompt: newPrompt,
      lastGenerated: new Date().toISOString(),
      message: 'Custom hook prompt regenerated successfully from brand voice data',
      companyName: company.name
    });

  } catch (error) {
    console.error('Hook prompt regeneration error:', error);
    res.status(500).json({ error: 'Failed to regenerate custom hook prompt' });
  }
});

export default router;