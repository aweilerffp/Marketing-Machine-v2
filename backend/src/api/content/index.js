import express from 'express';
import { requireAuth, getUserId } from '../../middleware/clerk.js';
import prisma from '../../models/prisma.js';

const router = express.Router();

// Get content posts for approval queue
router.get('/queue', requireAuth, async (req, res) => {
  try {
    const clerkId = getUserId(req);
    
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: { company: true }
    });

    if (!user?.company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const posts = await prisma.contentPost.findMany({
      where: {
        hook: {
          meeting: {
            companyId: user.company.id
          }
        },
        status: 'PENDING'
      },
      include: {
        hook: {
          include: {
            meeting: {
              select: {
                title: true,
                createdAt: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(posts);
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

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
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

    const updatedPost = await prisma.contentPost.update({
      where: { id: postId },
      data: {
        status,
        scheduledFor: status === 'APPROVED' ? scheduledFor : null
      }
    });

    res.json(updatedPost);
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: 'Failed to update status' });
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

export default router;