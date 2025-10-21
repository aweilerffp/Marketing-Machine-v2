import express from 'express';
import { PrismaClient } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';
import { transcriptQueue } from '../../services/queue/index.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * System Status Endpoint
 * Returns health status of all core services
 */
router.get('/', async (req, res) => {
  const statuses = {
    timestamp: new Date().toISOString(),
    overall: 'operational', // operational, degraded, down
    services: {}
  };

  // 1. Database Check
  try {
    await prisma.$queryRaw`SELECT 1`;
    statuses.services.database = {
      status: 'operational',
      message: 'PostgreSQL connected',
      responseTime: null
    };
  } catch (error) {
    statuses.services.database = {
      status: 'down',
      message: error.message,
      responseTime: null
    };
    statuses.overall = 'down';
  }

  // 2. Webhook Configuration Check
  try {
    const companies = await prisma.company.findMany({
      where: { webhookActive: true },
      select: { id: true, name: true, webhookToken: true }
    });

    if (companies.length > 0) {
      statuses.services.webhook = {
        status: 'operational',
        message: `${companies.length} active webhook(s) configured`,
        activeWebhooks: companies.length
      };
    } else {
      statuses.services.webhook = {
        status: 'warning',
        message: 'No active webhooks configured',
        activeWebhooks: 0
      };
      if (statuses.overall === 'operational') {
        statuses.overall = 'degraded';
      }
    }
  } catch (error) {
    statuses.services.webhook = {
      status: 'down',
      message: error.message,
      activeWebhooks: 0
    };
    statuses.overall = 'down';
  }

  // 3. AI Service Check (Anthropic API)
  try {
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
      statuses.services.ai = {
        status: 'down',
        message: 'Anthropic API key not configured'
      };
      statuses.overall = 'down';
    } else {
      // Quick validation without making a full API call
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });

      statuses.services.ai = {
        status: 'operational',
        message: 'Anthropic API configured',
        model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022'
      };
    }
  } catch (error) {
    statuses.services.ai = {
      status: 'down',
      message: error.message
    };
    statuses.overall = 'down';
  }

  // 4. Queue System Check
  try {
    const jobCounts = await transcriptQueue.getJobCounts();
    const hasStuckJobs = jobCounts.failed > 10;

    statuses.services.queue = {
      status: hasStuckJobs ? 'warning' : 'operational',
      message: hasStuckJobs ? 'High number of failed jobs' : 'Queue operational',
      jobs: {
        waiting: jobCounts.waiting,
        active: jobCounts.active,
        completed: jobCounts.completed,
        failed: jobCounts.failed
      }
    };

    if (hasStuckJobs && statuses.overall === 'operational') {
      statuses.overall = 'degraded';
    }
  } catch (error) {
    statuses.services.queue = {
      status: 'down',
      message: error.message
    };
    statuses.overall = 'down';
  }

  // 5. Recent Meeting Processing Check
  try {
    const recentMeetings = await prisma.meeting.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    statuses.services.meetings = {
      status: 'operational',
      message: `${recentMeetings} meeting(s) processed in last 24h`,
      count24h: recentMeetings
    };
  } catch (error) {
    statuses.services.meetings = {
      status: 'down',
      message: error.message,
      count24h: 0
    };
    statuses.overall = 'down';
  }

  res.json(statuses);
});

export default router;
