import express from 'express';
import multer from 'multer';
import { requireAuth, getUserId } from '../../middleware/clerk.js';
import prisma from '../../models/prisma.js';
import crypto from 'crypto';
import { generateCustomLinkedInPrompt, getCustomLinkedInPrompt, generateCustomHookPrompt, getCustomHookPrompt, generateCustomImagePrompt, getCustomImagePrompt } from '../../services/ai/promptGeneration.js';
import { captureWebsiteScreenshot, convertScreenshotToBase64, cleanupOldScreenshots } from '../../services/screenshot/capture.js';
import { analyzeWebsiteVisualStyle } from '../../services/ai/brandVoiceProcessor.js';
import { analyzeWebsite, isValidUrl } from '../../services/brandExtraction/index.js';

const router = express.Router();

// Configure multer for screenshot uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const DEFAULT_CONTENT_PILLARS = ['Industry Insights', 'Product Updates', 'Customer Success'];

const parseBrandVoiceData = (raw) => {
  if (!raw) {
    return {};
  }

  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.warn('⚠️ Failed to parse brand voice JSON, falling back to empty object');
      return {};
    }
  }

  return raw;
};

const sanitizeStringArray = (value, fallback = []) => {
  let candidate = [];

  if (Array.isArray(value)) {
    candidate = value;
  } else if (typeof value === 'string' && value.trim().length > 0) {
    candidate = value.split(',');
  }

  const cleaned = candidate
    .map(item => (typeof item === 'string' ? item.trim() : ''))
    .filter(item => item.length > 0);

  if (cleaned.length > 0) {
    return cleaned;
  }

  const fallbackArray = Array.isArray(fallback) ? fallback : [];
  return fallbackArray
    .map(item => (typeof item === 'string' ? item.trim() : ''))
    .filter(item => item.length > 0);
};

const parseContentPillars = (pillars) => {
  if (!pillars) {
    return [];
  }

  if (Array.isArray(pillars)) {
    return pillars;
  }

  if (typeof pillars === 'string') {
    try {
      const parsed = JSON.parse(pillars);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('⚠️ Failed to parse content pillars, using empty array');
      return [];
    }
  }

  return [];
};

const normalizeContentPillars = (pillars, fallback = DEFAULT_CONTENT_PILLARS) => {
  const candidateArray = parseContentPillars(pillars);

  const cleaned = candidateArray
    .map(item => (typeof item === 'string' ? item.trim() : ''))
    .filter(item => item.length > 0);

  const unique = Array.from(new Set(cleaned));
  if (unique.length > 0) {
    return unique;
  }

  const fallbackArray = parseContentPillars(fallback);
  const cleanedFallback = fallbackArray
    .map(item => (typeof item === 'string' ? item.trim() : ''))
    .filter(item => item.length > 0);

  return cleanedFallback.length > 0 ? Array.from(new Set(cleanedFallback)) : DEFAULT_CONTENT_PILLARS;
};

const normalizeBrandVoicePayload = (existingRaw = {}, incomingRaw = {}, fallbackName = '') => {
  const existing = parseBrandVoiceData(existingRaw);
  const incoming = parseBrandVoiceData(incomingRaw);

  const merged = {
    ...existing,
    ...incoming
  };

  const applyStringField = (key, fallback = '') => {
    const incomingValue = typeof incoming[key] === 'string' ? incoming[key].trim() : '';
    const existingValue = typeof existing[key] === 'string' ? existing[key].trim() : '';
    const fallbackValue = typeof fallback === 'string' ? fallback.trim() : '';
    const resolved = incomingValue || existingValue || fallbackValue;
    if (resolved) {
      merged[key] = resolved;
    } else {
      delete merged[key];
    }
  };

  applyStringField('companyName', fallbackName);
  applyStringField('industry');
  applyStringField('targetAudience');
  applyStringField('tone');
  applyStringField('websiteContent');

  const samplePosts = sanitizeStringArray(incoming.samplePosts, existing.samplePosts);
  if (samplePosts.length > 0) {
    merged.samplePosts = samplePosts;
  } else if (Array.isArray(existing.samplePosts) && existing.samplePosts.length > 0) {
    merged.samplePosts = sanitizeStringArray(existing.samplePosts);
  } else {
    delete merged.samplePosts;
  }

  // Normalize colors - handle both 'colors' and 'brandColors'
  const incomingColors = sanitizeStringArray(incoming.colors || incoming.brandColors);
  const existingColors = sanitizeStringArray(existing.colors || existing.brandColors);

  const finalColors = incomingColors.length > 0 ? incomingColors : existingColors;

  if (finalColors.length > 0) {
    // Store in both fields for compatibility
    merged.colors = finalColors;
    merged.brandColors = finalColors;
  } else {
    delete merged.colors;
    delete merged.brandColors;
  }

  merged.keywords = sanitizeStringArray(incoming.keywords, existing.keywords);
  merged.painPoints = sanitizeStringArray(incoming.painPoints, existing.painPoints);

  if (!Array.isArray(merged.personality) || merged.personality.length === 0) {
    merged.personality = ['professional', 'helpful', 'authoritative'];
  }

  Object.keys(merged).forEach(key => {
    if (typeof merged[key] === 'string') {
      merged[key] = merged[key].trim();
    }
  });

  return merged;
};

// Get company profile
router.get('/', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    console.log(`🔍 Company API called with clerkId: ${clerkId}`);
    
    // In dev mode with mock auth, ensure we have a specific dev user and company
    if (clerkId === 'dev_user_123') {
      // Debug: Check all users in the database first
      const allUsers = await prisma.user.findMany({
        where: { clerkId: 'dev_user_123' }
      });
      console.log(`🚧 Dev mode: Found ${allUsers.length} users with clerkId dev_user_123:`, allUsers.map(u => ({id: u.id, email: u.email})));
      
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

      console.log(`🚧 Dev mode: Found user with ID ${devUser.id} and clerkId ${devUser.clerkId}`);

      // If dev user already has a company, return it  
      // First check the Prisma relationship
      console.log(`🚧 Dev mode: devUser.company status:`, devUser.company ? `Found: ${devUser.company.name}` : 'NULL');
      if (devUser.company) {
        console.log(`🚧 Dev mode: Using dev user's existing company: ${devUser.company.name}`);
        return res.json(devUser.company);
      }
      
      // If Prisma relationship failed, try direct query by userId
      console.log(`🚧 Dev mode: Prisma relationship failed, trying direct query for userId: ${devUser.id}`);
      const directCompany = await prisma.company.findFirst({
        where: { userId: devUser.id }
      });
      
      if (directCompany) {
        console.log(`🚧 Dev mode: Found company via direct query: ${directCompany.name}`);
        return res.json(directCompany);
      }

      // If dev user has no company, find an existing company with brand voice data
      const existingCompany = await prisma.company.findFirst({
        where: {
          AND: [
            { brandVoiceData: { not: null } },
            { name: { not: 'temp' } }
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

      // If no existing company found, return null to indicate onboarding needed
      // Last resort: try to find Emplicit company specifically
      console.log(`🚧 Dev mode: Last resort - looking for Emplicit company specifically`);
      const emplicityCompany = await prisma.company.findFirst({
        where: { name: 'Emplicit' }
      });

      if (emplicityCompany) {
        console.log(`🚧 Dev mode: Found Emplicit company with ID ${emplicityCompany.id}, assigning to dev user`);
        const updatedCompany = await prisma.company.update({
          where: { id: emplicityCompany.id },
          data: { userId: devUser.id }
        });
        return res.json(updatedCompany);
      }

      console.log('🚧 Dev mode: No existing company found, user needs onboarding');
      return res.json(null);
    }
    
    // Normal production user lookup
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
    console.log(`🔍 Company API /current called with clerkId: ${clerkId}`);
    console.log(`🔍 Auth user data:`, JSON.stringify(req.auth.user, null, 2));
    
    // In dev mode with mock auth, ensure we have a specific dev user and company
    if (clerkId === 'dev_user_123') {
      // Debug: Check all users in the database first
      const allUsers = await prisma.user.findMany({
        where: { clerkId: 'dev_user_123' }
      });
      console.log(`🚧 Dev mode: Found ${allUsers.length} users with clerkId dev_user_123:`, allUsers.map(u => ({id: u.id, email: u.email})));
      
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

      console.log(`🚧 Dev mode: Found user with ID ${devUser.id} and clerkId ${devUser.clerkId}`);

      // If dev user already has a company, return it  
      // First check the Prisma relationship
      console.log(`🚧 Dev mode: devUser.company status:`, devUser.company ? `Found: ${devUser.company.name}` : 'NULL');
      if (devUser.company) {
        console.log(`🚧 Dev mode: Using dev user's existing company: ${devUser.company.name}`);
        return res.json(devUser.company);
      }
      
      // If Prisma relationship failed, try direct query by userId
      console.log(`🚧 Dev mode: Prisma relationship failed, trying direct query for userId: ${devUser.id}`);
      const directCompany = await prisma.company.findFirst({
        where: { userId: devUser.id }
      });
      
      if (directCompany) {
        console.log(`🚧 Dev mode: Found company via direct query: ${directCompany.name}`);
        return res.json(directCompany);
      }

      // If dev user has no company, find an existing company with brand voice data
      const existingCompany = await prisma.company.findFirst({
        where: {
          AND: [
            { brandVoiceData: { not: null } },
            { name: { not: 'temp' } }
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

      // If no existing company found, return null to indicate onboarding needed
      // Last resort: try to find Emplicit company specifically
      console.log(`🚧 Dev mode: Last resort - looking for Emplicit company specifically`);
      const emplicityCompany = await prisma.company.findFirst({
        where: { name: 'Emplicit' }
      });

      if (emplicityCompany) {
        console.log(`🚧 Dev mode: Found Emplicit company with ID ${emplicityCompany.id}, assigning to dev user`);
        const updatedCompany = await prisma.company.update({
          where: { id: emplicityCompany.id },
          data: { userId: devUser.id }
        });
        return res.json(updatedCompany);
      }

      console.log('🚧 Dev mode: No existing company found, user needs onboarding');
      return res.json(null);
    }
    
    // Normal production user lookup
    let user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    console.log(`📊 User lookup result:`, {
      found: !!user,
      userId: user?.id,
      email: user?.email,
      hasCompany: !!user?.company,
      companyId: user?.company?.id,
      companyName: user?.company?.name
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

    // If user.company is null, try direct query
    if (user && !user.company) {
      console.log(`⚠️ Prisma relationship failed, trying direct query for userId: ${user.id}`);
      const directCompany = await prisma.company.findFirst({
        where: { userId: user.id }
      });
      console.log(`📊 Direct query result:`, {
        found: !!directCompany,
        companyId: directCompany?.id,
        companyName: directCompany?.name
      });
      if (directCompany) {
        console.log(`✅ Returning company from direct query: ${directCompany.name}`);
        return res.json(directCompany);
      }
    }

    console.log(`📤 Returning company:`, user?.company ? user.company.name : 'null (onboarding needed)');
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

    const existingCompany = user.company || null;
    const hasIncomingBrandVoice = typeof brandVoiceData !== 'undefined' && brandVoiceData !== null;
    const parsedIncomingBrandVoice = hasIncomingBrandVoice ? parseBrandVoiceData(brandVoiceData) : {};
    const normalizedBrandVoiceData = normalizeBrandVoicePayload(
      existingCompany?.brandVoiceData,
      hasIncomingBrandVoice ? parsedIncomingBrandVoice : existingCompany?.brandVoiceData,
      name
    );

    // Keep visual style profile from onboarding (don't delete it!)
    // The visualStyleProfile is already in normalizedBrandVoiceData if it came from onboarding

    const existingContentPillars = parseContentPillars(existingCompany?.contentPillars);
    const normalizedContentPillarsArray = normalizeContentPillars(
      typeof contentPillars !== 'undefined' ? contentPillars : existingContentPillars,
      existingContentPillars.length > 0 ? existingContentPillars : DEFAULT_CONTENT_PILLARS
    );

    const normalizedPostingSchedule = postingSchedule && Object.keys(postingSchedule).length > 0
      ? postingSchedule
      : existingCompany?.postingSchedule || {
          defaultTimes: ['09:00', '13:00'],
          timezone: 'America/New_York'
        };

    // Check if this is a real brand voice update (has core fields like tone, industry, or targetAudience)
    const hasCoreFields = parsedIncomingBrandVoice.tone || parsedIncomingBrandVoice.industry || parsedIncomingBrandVoice.targetAudience;
    const shouldGenerateCustomPrompt = hasIncomingBrandVoice && hasCoreFields;

    let company;
    if (existingCompany) {
      // Update existing company
      // If brand voice is being updated, clear existing custom prompts so they get regenerated
      const updateData = {
        name,
        brandVoiceData: normalizedBrandVoiceData,
        contentPillars: JSON.stringify(normalizedContentPillarsArray),
        postingSchedule: normalizedPostingSchedule
      };

      // Clear prompts if brand voice is being updated - forces regeneration
      if (shouldGenerateCustomPrompt) {
        console.log(`🔄 Brand voice updated - clearing existing prompts for regeneration`);
        updateData.customLinkedInPrompt = null;
        updateData.customHookPrompt = null;
        updateData.customImagePrompt = null;
      }

      company = await prisma.company.update({
        where: { userId: user.id },
        data: updateData
      });
    } else {
      // Create new company
      company = await prisma.company.create({
        data: {
          userId: user.id,
          name,
          brandVoiceData: normalizedBrandVoiceData,
          contentPillars: JSON.stringify(normalizedContentPillarsArray),
          postingSchedule: normalizedPostingSchedule
        }
      });
    }

    console.log('🔍 Prompt generation check:', {
      hasIncomingBrandVoice,
      hasCoreFields,
      parsedKeys: Object.keys(parsedIncomingBrandVoice),
      shouldGenerate: shouldGenerateCustomPrompt,
      companyName: company.name
    });

    // Generate custom prompts after brand onboarding completion
    // Wait for all prompts to generate before returning - ensures they're ready when user navigates to settings
    if (shouldGenerateCustomPrompt) {
      console.log(`🎯 Generating custom prompts for company: ${company.name}`);

      try {
        await Promise.all([
          generateCustomLinkedInPrompt(company.id),
          generateCustomHookPrompt(company.id),
          generateCustomImagePrompt(company.id)
        ]);
        console.log(`✨ All custom prompts generated for ${company.name}`);
      } catch (error) {
        console.error(`❌ Error generating custom prompts for ${company.name}:`, error);
        // Don't fail the request if prompt generation fails
      }
    }

    console.log(`📦 Returning company data to frontend: ${company.name}`);
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

    // Basic validation - ensure prompt has essential structure (case-insensitive, flexible placeholders)
    const requiredElementChecks = [
      {
        label: 'Hook placeholder (e.g. "Hook:" or "{HOOK_LIST}")',
        patterns: ['hook:', 'hooks:', 'hook -', '{hook']
      },
      {
        label: 'Brand voice placeholder (e.g. "Brand Voice:" or "{BRAND_VOICE_DATA}")',
        patterns: ['brand voice', '{brand_voice']
      }
    ];

    const normalizedPrompt = prompt.toLowerCase();
    const missingElements = requiredElementChecks.filter(({ patterns }) =>
      !patterns.some(pattern => normalizedPrompt.includes(pattern))
    );

    if (missingElements.length > 0) {
      return res.status(400).json({ 
        error: `Prompt missing required elements: ${missingElements.map(({ label }) => label).join(', ')}`,
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

// IMAGE PROMPT MANAGEMENT ENDPOINTS
// ==================================

// Get current custom image prompt
router.get('/image-prompt', requireAuth, async (req, res) => {
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

    // Get or generate custom image prompt
    const prompt = await getCustomImagePrompt(company.id);
    const hasCustomPrompt = !!company.customImagePrompt;

    res.json({
      prompt,
      lastGenerated: company.updatedAt,
      lastModified: company.updatedAt,
      isCustom: hasCustomPrompt,
      companyName: company.name
    });

  } catch (error) {
    console.error('Image prompt fetch error:', error);
    res.status(500).json({ error: 'Failed to get custom image prompt' });
  }
});

// Update custom image prompt
router.put('/image-prompt', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Image prompt content is required' });
    }

    if (prompt.length > 10000) {
      return res.status(400).json({ error: 'Image prompt too long (max 10,000 characters)' });
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

    // Update the custom image prompt
    const updatedCompany = await prisma.company.update({
      where: { id: company.id },
      data: {
        customImagePrompt: prompt
      }
    });

    console.log(`🎨 Custom image prompt updated for ${updatedCompany.name} by user`);

    res.json({
      prompt,
      lastModified: updatedCompany.updatedAt,
      message: 'Custom image prompt updated successfully',
      companyName: updatedCompany.name
    });

  } catch (error) {
    console.error('Image prompt update error:', error);
    res.status(500).json({ error: 'Failed to update custom image prompt' });
  }
});

// Regenerate custom image prompt from brand voice data
router.post('/image-prompt/regenerate', requireAuth, async (req, res) => {
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

    console.log(`🔄 Regenerating custom image prompt for ${company.name}`);

    // Force regeneration of custom image prompt
    const newPrompt = await generateCustomImagePrompt(company.id);

    res.json({
      prompt: newPrompt,
      lastGenerated: new Date().toISOString(),
      message: 'Custom image prompt regenerated successfully from brand voice data',
      companyName: company.name
    });

  } catch (error) {
    console.error('Image prompt regeneration error:', error);
    res.status(500).json({ error: 'Failed to regenerate custom image prompt' });
  }
});

// ===================================================================
// SCREENSHOT UPLOAD & VISUAL ANALYSIS
// ===================================================================

/**
 * Upload website screenshot for visual analysis
 * POST /api/company/screenshot/upload
 */
router.post('/screenshot/upload', requireAuth, upload.single('screenshot'), async (req, res) => {
  try {
    const clerkId = getUserId(req);

    if (!req.file) {
      return res.status(400).json({ error: 'No screenshot file provided' });
    }

    // Find user and company
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    if (!user || !user.company) {
      return res.status(404).json({ error: 'Company not found. Please complete onboarding first.' });
    }

    const company = user.company;

    // Convert uploaded file to base64
    const screenshotBase64 = req.file.buffer.toString('base64');

    console.log(`📸 Analyzing uploaded screenshot for ${company.name}...`);

    // Analyze visual style using Claude Vision API
    const visualStyle = await analyzeWebsiteVisualStyle(company.brandVoiceData, screenshotBase64);

    // Update brand voice data with visual style analysis
    const updatedBrandVoiceData = {
      ...company.brandVoiceData,
      visualStyleProfile: visualStyle
    };

    // Save analysis to database
    await prisma.company.update({
      where: { id: company.id },
      data: {
        brandVoiceData: updatedBrandVoiceData,
        updatedAt: new Date()
      }
    });

    // Regenerate custom image prompt with new visual analysis
    console.log(`🎨 Regenerating custom image prompt with visual analysis...`);
    const customImagePrompt = await generateCustomImagePrompt(company.id);

    console.log(`✅ Screenshot analyzed for ${company.name}: ${visualStyle.mood}, ${visualStyle.energyLevel} energy`);

    res.json({
      message: 'Screenshot analyzed successfully',
      visualStyle,
      customImagePrompt,
      companyName: company.name
    });

  } catch (error) {
    console.error('Screenshot upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload and analyze screenshot' });
  }
});

/**
 * Capture website screenshot from URL
 * POST /api/company/screenshot/capture
 * Body: { url: 'https://example.com' }
 */
router.post('/screenshot/capture', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Website URL is required' });
    }

    // Validate URL format
    let websiteUrl;
    try {
      websiteUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Find user and company
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    if (!user || !user.company) {
      return res.status(404).json({ error: 'Company not found. Please complete onboarding first.' });
    }

    const company = user.company;

    console.log(`📸 Capturing screenshot of ${url} for ${company.name}...`);

    // Capture screenshot using Puppeteer
    const { screenshotUrl, screenshotBase64 } = await captureWebsiteScreenshot(url, company.id);

    // Analyze visual style using Claude Vision API
    const visualStyle = await analyzeWebsiteVisualStyle(company.brandVoiceData, screenshotBase64);

    // Update brand voice data with visual style analysis and screenshot URL
    const updatedBrandVoiceData = {
      ...company.brandVoiceData,
      visualStyleProfile: visualStyle
    };

    // Save analysis and screenshot URL to database
    await prisma.company.update({
      where: { id: company.id },
      data: {
        brandVoiceData: updatedBrandVoiceData,
        websiteScreenshotUrl: screenshotUrl,
        updatedAt: new Date()
      }
    });

    // Clean up old screenshots
    await cleanupOldScreenshots(company.id);

    // Regenerate custom image prompt with new visual analysis
    console.log(`🎨 Regenerating custom image prompt with visual analysis...`);
    const customImagePrompt = await generateCustomImagePrompt(company.id);

    console.log(`✅ Screenshot captured and analyzed for ${company.name}: ${visualStyle.mood}, ${visualStyle.energyLevel} energy`);

    res.json({
      message: 'Website screenshot captured and analyzed successfully',
      screenshotUrl,
      visualStyle,
      customImagePrompt,
      companyName: company.name
    });

  } catch (error) {
    console.error('Screenshot capture error:', error);
    res.status(500).json({ error: error.message || 'Failed to capture and analyze screenshot' });
  }
});

/**
 * Get current visual style analysis
 * GET /api/company/visual-style
 */
router.get('/visual-style', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    if (!user || !user.company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const company = user.company;

    const brandVoiceData = parseBrandVoiceData(company.brandVoiceData);
    const visualStyle = brandVoiceData.visualStyleProfile || null;

    res.json({
      visualStyle,
      screenshotUrl: company.websiteScreenshotUrl,
      hasScreenshot: !!company.websiteScreenshotUrl,
      companyName: company.name
    });

  } catch (error) {
    console.error('Visual style retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve visual style' });
  }
});

// ===================================================================
// BRAND EXTRACTION & WEBSITE ANALYSIS
// ===================================================================

// In-memory storage for analysis jobs (in production, use Redis)
const analysisJobs = new Map();

/**
 * Start website analysis
 * POST /api/company/analyze-website
 * Body: { url: 'https://example.com' }
 */
router.post('/analyze-website', requireAuth, async (req, res) => {
  console.log('🎯 /analyze-website endpoint HIT with body:', req.body);
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Website URL is required' });
    }

    if (!isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Generate job ID
    const jobId = crypto.randomBytes(16).toString('hex');

    // Initialize job status
    analysisJobs.set(jobId, {
      status: 'processing',
      progress: {
        step: 'starting',
        percentage: 0,
        message: 'Starting analysis...'
      },
      startedAt: new Date()
    });

    console.log(`🔍 Starting brand analysis for ${url} (Job ID: ${jobId})`);
    console.log('🔧 About to call analyzeWebsite function...');

    // Start analysis in background
    const analysisPromise = analyzeWebsite(url, (progress) => {
      // Update job progress
      const job = analysisJobs.get(jobId);
      if (job) {
        job.progress = progress;
        analysisJobs.set(jobId, job);
      }
    });

    console.log('✅ analyzeWebsite promise created');

    analysisPromise
      .then((result) => {
        analysisJobs.set(jobId, {
          status: 'complete',
          data: result,
          completedAt: new Date()
        });
        console.log(`✅ Analysis complete for job ${jobId}`);
      })
      .catch((error) => {
        analysisJobs.set(jobId, {
          status: 'failed',
          error: error.message,
          failedAt: new Date()
        });
        console.error(`❌ Analysis failed for job ${jobId}:`, error);
      });

    // Return job ID immediately
    res.json({
      jobId,
      status: 'processing',
      estimatedTime: 30 // seconds
    });

  } catch (error) {
    console.error('Analysis start error:', error);
    res.status(500).json({ error: 'Failed to start website analysis' });
  }
});

/**
 * Get analysis status
 * GET /api/company/analysis-status/:jobId
 */
router.get('/analysis-status/:jobId', requireAuth, async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = analysisJobs.get(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Analysis job not found' });
    }

    res.json(job);

    // Clean up completed/failed jobs after 5 minutes
    if (job.status === 'complete' || job.status === 'failed') {
      setTimeout(() => {
        analysisJobs.delete(jobId);
        console.log(`🗑️ Cleaned up analysis job ${jobId}`);
      }, 5 * 60 * 1000);
    }

  } catch (error) {
    console.error('Analysis status error:', error);
    res.status(500).json({ error: 'Failed to get analysis status' });
  }
});

export default router;
