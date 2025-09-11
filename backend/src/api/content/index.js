import express from 'express';
import { requireAuth, getUserId } from '../../middleware/clerk.js';
import prisma from '../../models/prisma.js';
import demoRouter from './demo.js';
import { rewriteContent, generateEnhancedLinkedInPost } from '../../services/ai/contentGeneration.js';

const router = express.Router();

// Mount demo routes
router.use('/demo', demoRouter);

// Get consolidated dashboard data (posts + meetings + stats) in one call
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    const { limit = '25' } = req.query;
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    // Build where conditions for posts and meetings
    let meetingWhereCondition, postWhereCondition;
    
    if (process.env.NODE_ENV === 'development' && !user?.company) {
      console.log('🚧 Dev mode: Dashboard showing all data (no company filter)');
      meetingWhereCondition = {};
      postWhereCondition = {};
    } else if (process.env.NODE_ENV === 'development' && user?.company) {
      meetingWhereCondition = {
        OR: [
          { companyId: user.company.id },
          { companyId: null }
        ]
      };
      postWhereCondition = {
        hook: {
          meeting: {
            OR: [
              { companyId: user.company.id },
              { companyId: null }
            ]
          }
        }
      };
    } else {
      if (!user?.company) {
        return res.status(404).json({ error: 'Company not found' });
      }
      meetingWhereCondition = { companyId: user.company.id };
      postWhereCondition = {
        hook: {
          meeting: {
            companyId: user.company.id
          }
        }
      };
    }

    // Fetch all data in parallel for better performance
    const [posts, meetings, stats] = await Promise.all([
      // Recent posts
      prisma.contentPost.findMany({
        where: postWhereCondition,
        select: {
          id: true,
          content: true,
          imageUrl: true,
          status: true,
          scheduledFor: true,
          createdAt: true,
          hook: {
            select: {
              id: true,
              hook: true,
              pillar: true,
              meeting: {
                select: {
                  title: true,
                  createdAt: true,
                  processedStatus: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum
      }),
      
      // Recent meetings
      prisma.meeting.findMany({
        where: meetingWhereCondition,
        select: {
          id: true,
          readaiId: true,
          title: true,
          summary: true,
          processedStatus: true,
          processedAt: true,
          createdAt: true,
          contentHooks: {
            select: {
              id: true,
              hook: true,
              pillar: true,
              posts: {
                select: {
                  id: true,
                  status: true
                },
                take: 5
              }
            },
            take: 10
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum
      }),
      
      // Dashboard statistics
      Promise.all([
        prisma.contentPost.count({
          where: { ...postWhereCondition, status: 'PENDING' }
        }),
        prisma.contentPost.count({
          where: { ...postWhereCondition, status: 'SCHEDULED' }
        }),
        prisma.contentPost.count({
          where: { ...postWhereCondition, status: 'REJECTED' }
        }),
        prisma.meeting.count({
          where: meetingWhereCondition
        })
      ])
    ]);

    const [pendingCount, scheduledCount, rejectedCount, meetingsCount] = stats;

    res.json({
      posts,
      meetings,
      stats: {
        totalMeetings: meetingsCount,
        pendingPosts: pendingCount,
        scheduledPosts: scheduledCount,
        rejectedPosts: rejectedCount,
        totalPosts: posts.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Get content posts for approval queue
router.get('/queue', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    const { page = '1', limit = '50', status } = req.query;
    
    // Parse and validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Cap at 100 items per page
    const skip = (pageNum - 1) * limitNum;
    
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    // Development mode: Show all content if no company found
    if (!user?.company && process.env.NODE_ENV === 'development') {
      console.log('🚧 Dev mode: Showing all content (no company filter)');
      const posts = await prisma.contentPost.findMany({
        select: {
          id: true,
          content: true,
          imageUrl: true,
          imagePrompt: true,
          status: true,
          scheduledFor: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          hook: {
            select: {
              id: true,
              hook: true,
              pillar: true,
              meeting: {
                select: {
                  title: true,
                  createdAt: true,
                  processedStatus: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: skip,
        take: limitNum
      });

      // Get total count for pagination metadata
      const totalCount = await prisma.contentPost.count();
      const totalPages = Math.ceil(totalCount / limitNum);
      const hasNextPage = pageNum < totalPages;
      const hasPrevPage = pageNum > 1;

      return res.json({
        posts,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit: limitNum
        }
      });
    }

    // Development mode: Show all posts if no company found OR if posts exist without company
    if (!user?.company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // In development, also show posts that don't have a company association
    let whereCondition = process.env.NODE_ENV === 'development' 
      ? {
          hook: {
            meeting: {
              OR: [
                { companyId: user.company.id },
                { companyId: null }
              ]
            }
          }
        }
      : {
          hook: {
            meeting: {
              companyId: user.company.id
            }
          }
        };

    // Add status filter if provided
    if (status && ['PENDING', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'REJECTED'].includes(status)) {
      whereCondition = {
        ...whereCondition,
        status: status
      };
    }

    const posts = await prisma.contentPost.findMany({
      where: whereCondition,
      select: {
        id: true,
        content: true,
        imageUrl: true,
        imagePrompt: true,
        status: true,
        scheduledFor: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        hook: {
          select: {
            id: true,
            hook: true,
            pillar: true,
            meeting: {
              select: {
                title: true,
                createdAt: true,
                processedStatus: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: skip,
      take: limitNum
    });

    // Get total count for pagination metadata
    const totalCount = await prisma.contentPost.count({
      where: whereCondition
    });

    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      posts,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Queue fetch error:', error);
    res.status(500).json({ error: 'Failed to get content queue' });
  }
});

// Update post status (approve/reject)
router.put('/:postId/status', requireAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { status, scheduledFor } = req.body;
    const clerkId = getUserId(req);

    if (!['APPROVED', 'REJECTED', 'SCHEDULED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Single query with user and post lookup combined
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    // Optimized single query for post with company check
    let whereCondition;
    if (process.env.NODE_ENV === 'development') {
      // In development mode, allow posts without company or with user's company
      whereCondition = user?.company ? {
        id: postId,
        OR: [
          { hook: { meeting: { companyId: user.company.id } } },
          { hook: { meeting: { companyId: null } } }
        ]
      } : {
        id: postId
      };
    } else {
      // Production mode: strict company filtering
      whereCondition = {
        id: postId,
        hook: {
          meeting: {
            companyId: user?.company?.id || 'never-match'
          }
        }
      };
    }

    const post = await prisma.contentPost.findFirst({
      where: whereCondition
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const updatedPost = await prisma.contentPost.update({
      where: { id: postId },
      data: {
        status,
        scheduledFor: (status === 'APPROVED' || status === 'SCHEDULED') ? scheduledFor : null
      }
    });

    res.json(updatedPost);
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Rewrite post content with AI
router.post('/:postId/rewrite', requireAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { instructions } = req.body;
    const clerkId = getUserId(req);

    if (!instructions) {
      return res.status(400).json({ error: 'Rewrite instructions are required' });
    }

    // Verify user owns this post and get company brand voice
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    if (!user?.company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const post = await prisma.contentPost.findFirst({
      where: {
        id: postId,
        hook: {
          meeting: {
            companyId: user.company.id
          }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Rewrite content using AI
    const rewrittenContent = await rewriteContent(
      post.content,
      instructions,
      user.company.brandVoiceData || {}
    );

    res.json({ rewrittenContent });
  } catch (error) {
    console.error('Content rewrite error:', error);
    res.status(500).json({ error: 'Failed to rewrite content' });
  }
});

// Update post content
router.put('/:postId/content', requireAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const clerkId = getUserId(req);

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Verify user owns this post
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    const post = await prisma.contentPost.findFirst({
      where: {
        id: postId,
        hook: {
          meeting: {
            companyId: user.company.id
          }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Store edit history
    const editHistory = post.editHistory || [];
    editHistory.push({
      previousContent: post.content,
      editedAt: new Date(),
      editedBy: clerkId
    });

    const updatedPost = await prisma.contentPost.update({
      where: { id: postId },
      data: {
        content,
        editHistory
      }
    });

    res.json(updatedPost);
  } catch (error) {
    console.error('Content update error:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

// Get analyzed meetings with their content
router.get('/meetings', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    // Development mode: Show all meetings if no company found OR include NULL companyId meetings
    let meetings;
    if (process.env.NODE_ENV === 'development') {
      console.log('🚧 Dev mode: Showing all meetings (including NULL companyId)');
      
      // In dev mode, show meetings with matching companyId OR NULL companyId
      const whereCondition = user?.company ? {
        OR: [
          { companyId: user.company.id },
          { companyId: null }
        ]
      } : {};
      
      meetings = await prisma.meeting.findMany({
        where: whereCondition,
        select: {
          id: true,
          readaiId: true,
          title: true,
          summary: true,
          processedStatus: true,
          processedAt: true,
          createdAt: true,
          contentHooks: {
            select: {
              id: true,
              hook: true,
              pillar: true,
              posts: {
                select: {
                  id: true,
                  content: true,
                  status: true
                },
                take: 10 // Limit posts per hook to prevent huge payloads
              }
            },
            take: 20 // Limit hooks per meeting
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 25 // Limit initial meetings load
      });
    } else {
      if (!user?.company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      meetings = await prisma.meeting.findMany({
        where: {
          companyId: user.company.id
          // Show all meetings regardless of status
        },
        select: {
          id: true,
          readaiId: true,
          title: true,
          summary: true,
          processedStatus: true,
          processedAt: true,
          createdAt: true,
          contentHooks: {
            select: {
              id: true,
              hook: true,
              pillar: true,
              posts: {
                select: {
                  id: true,
                  content: true,
                  status: true
                },
                take: 10 // Limit posts per hook to prevent huge payloads
              }
            },
            take: 20 // Limit hooks per meeting
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 25 // Limit initial meetings load
      });
    }

    res.json(meetings);
  } catch (error) {
    console.error('Meetings fetch error:', error);
    res.status(500).json({ error: 'Failed to get meetings' });
  }
});

// Reprocess a meeting to regenerate content
router.post('/meetings/:meetingId/reprocess', requireAuth, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const clerkId = getUserId(req);

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    // Find the meeting to reprocess
    let meeting;
    if (process.env.NODE_ENV === 'development') {
      console.log('🚧 Dev mode: Reprocessing meeting with relaxed filters');
      meeting = await prisma.meeting.findFirst({
        where: {
          id: meetingId,
          OR: [
            { companyId: user?.company?.id },
            { companyId: null }
          ]
        },
        include: {
          contentHooks: {
            include: { posts: true }
          }
        }
      });
    } else {
      if (!user?.company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      meeting = await prisma.meeting.findFirst({
        where: {
          id: meetingId,
          companyId: user.company.id
        },
        include: {
          contentHooks: {
            include: { posts: true }
          }
        }
      });
    }

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Only allow reprocessing of completed meetings
    if (meeting.processedStatus !== 'COMPLETED') {
      return res.status(400).json({ 
        error: 'Only completed meetings can be reprocessed' 
      });
    }

    // Delete existing content hooks and posts
    await prisma.contentPost.deleteMany({
      where: {
        hook: {
          meetingId: meeting.id
        }
      }
    });

    await prisma.contentHook.deleteMany({
      where: {
        meetingId: meeting.id
      }
    });

    // Reset meeting status to PROCESSING
    await prisma.meeting.update({
      where: { id: meeting.id },
      data: { 
        processedStatus: 'PROCESSING',
        processedAt: new Date()
      }
    });

    // Re-queue the meeting for processing
    const jobData = {
      sessionId: meeting.readaiId,
      title: meeting.title || 'Untitled Meeting',
      summary: meeting.summary || '',
      transcript: meeting.transcript,
      actionItems: meeting.actionItems || [],
      keyQuestions: [],
      topics: [],
      owner: null,
      participants: [],
      reportUrl: null,
      receivedAt: new Date().toISOString(),
      // Include company information if authenticated
      companyId: user?.company?.id || null,
      companyName: user?.company?.name || null
    };

    const { transcriptQueue } = await import('../../services/queue/index.js');
    await transcriptQueue.add('process-transcript', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 10,
      removeOnFail: 5,
    });

    console.log(`🔄 Meeting ${meetingId} queued for reprocessing`);

    res.json({
      message: 'Meeting queued for reprocessing',
      meetingId: meeting.id,
      status: 'PROCESSING'
    });
  } catch (error) {
    console.error('Reprocess meeting error:', error);
    res.status(500).json({ error: 'Failed to reprocess meeting' });
  }
});

// Generate LinkedIn post from hook
router.post('/hooks/:hookId/linkedin-post', requireAuth, async (req, res) => {
  try {
    const { hookId } = req.params;
    const clerkId = getUserId(req);

    // Find the hook and verify user owns it
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    // Development mode: Skip company filter if no company found
    let hook;
    if (!user?.company && process.env.NODE_ENV === 'development') {
      console.log('🚧 Dev mode: Generating LinkedIn post (no company filter)');
      hook = await prisma.contentHook.findUnique({
        where: { id: hookId },
        include: {
          meeting: {
            select: {
              title: true,
              summary: true,
              transcript: true
            }
          }
        }
      });
    } else {
      if (!user?.company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      hook = await prisma.contentHook.findFirst({
        where: {
          id: hookId,
          meeting: {
            companyId: user.company.id
          }
        },
        include: {
          meeting: {
            select: {
              title: true,
              summary: true,
              transcript: true
            }
          }
        }
      });
    }

    if (!hook) {
      return res.status(404).json({ error: 'Hook not found' });
    }

    // Generate enhanced LinkedIn post
    const brandVoiceData = user?.company?.brandVoiceData || {};
    const meetingContext = hook.meeting?.transcript || hook.meeting?.summary || '';
    
    const linkedInPost = await generateEnhancedLinkedInPost(
      hook.hook,
      hook.pillar || 'General',
      brandVoiceData,
      meetingContext,
      null,
      user?.company?.id
    );

    // Create a new ContentPost record
    const newPost = await prisma.contentPost.create({
      data: {
        hookId: hook.id,
        content: linkedInPost.post,
        status: 'PENDING',
        imageUrl: null, // Could be generated later
        scheduledFor: null
      }
    });

    console.log(`📱 Generated LinkedIn post for hook ${hookId}`);

    res.json({
      post: newPost,
      metadata: {
        reasoning: linkedInPost.reasoning,
        characterCount: linkedInPost.estimatedCharacterCount
      }
    });

  } catch (error) {
    console.error('LinkedIn post generation error:', error);
    res.status(500).json({ error: 'Failed to generate LinkedIn post' });
  }
});

// Delete a meeting and all related content
router.delete('/meetings/:meetingId', requireAuth, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const clerkId = getUserId(req);

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    // Find the meeting to delete
    let meeting;
    if (process.env.NODE_ENV === 'development') {
      console.log('🚧 Dev mode: Deleting meeting with relaxed filters');
      meeting = await prisma.meeting.findFirst({
        where: {
          id: meetingId,
          OR: [
            { companyId: user?.company?.id },
            { companyId: null }
          ]
        }
      });
    } else {
      if (!user?.company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      meeting = await prisma.meeting.findFirst({
        where: {
          id: meetingId,
          companyId: user.company.id
        }
      });
    }

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    console.log(`🗑️  Deleting meeting ${meetingId} and all related content`);

    // Delete in proper order to respect foreign key constraints
    // 1. Delete ContentPosts first (references ContentHooks)
    const deletedPosts = await prisma.contentPost.deleteMany({
      where: {
        hook: {
          meetingId: meetingId
        }
      }
    });

    // 2. Delete ContentHooks next (references Meeting)
    const deletedHooks = await prisma.contentHook.deleteMany({
      where: { meetingId: meetingId }
    });

    // 3. Delete Meeting last
    await prisma.meeting.delete({
      where: { id: meetingId }
    });

    console.log(`✅ Successfully deleted meeting ${meetingId}: ${deletedPosts.count} posts, ${deletedHooks.count} hooks`);

    res.json({
      message: 'Meeting deleted successfully',
      meetingId,
      deletedPosts: deletedPosts.count,
      deletedHooks: deletedHooks.count
    });

  } catch (error) {
    console.error('Delete meeting error:', error);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

export default router;