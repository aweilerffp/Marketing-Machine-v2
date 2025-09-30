import prisma from '../../models/prisma.js';

/**
 * Update ContentPost with LinkedIn posting information
 * @param {string} contentPostId - ContentPost ID
 * @param {object} linkedinData - LinkedIn post data
 * @returns {Promise<object>} - Updated ContentPost
 */
export async function updateContentPostLinkedInStatus(contentPostId, linkedinData) {
  try {
    const updatedPost = await prisma.contentPost.update({
      where: { id: contentPostId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        platformContent: {
          linkedin: {
            postId: linkedinData.postId,
            publishedAt: linkedinData.publishedAt,
            visibility: linkedinData.visibility || 'PUBLIC',
            postedAt: new Date().toISOString()
          }
        }
      }
    });

    return updatedPost;
  } catch (error) {
    console.error('Failed to update ContentPost LinkedIn status:', error);
    throw error;
  }
}

/**
 * Get LinkedIn posting history for a user
 * @param {string} userId - User ID
 * @param {number} limit - Number of posts to return
 * @returns {Promise<Array>} - Array of posts with LinkedIn data
 */
export async function getLinkedInPostingHistory(userId, limit = 10) {
  try {
    // Get user's company
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    });

    if (!user?.company) {
      return [];
    }

    // Get posts with LinkedIn platform content
    const posts = await prisma.contentPost.findMany({
      where: {
        hook: {
          meeting: {
            companyId: user.company.id
          }
        },
        platformContent: {
          path: ['linkedin'],
          not: null
        }
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
        publishedAt: 'desc'
      },
      take: limit
    });

    return posts.map(post => ({
      id: post.id,
      content: post.content,
      publishedAt: post.publishedAt,
      meetingTitle: post.hook.meeting.title,
      linkedinData: post.platformContent?.linkedin || null
    }));

  } catch (error) {
    console.error('Failed to get LinkedIn posting history:', error);
    throw error;
  }
}

/**
 * Get LinkedIn posting statistics for a user
 * @param {string} userId - User ID
 * @param {number} days - Number of days to look back (default 30)
 * @returns {Promise<object>} - Posting statistics
 */
export async function getLinkedInPostingStats(userId, days = 30) {
  try {
    // Get user's company
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    });

    if (!user?.company) {
      return {
        totalPosts: 0,
        postsLast30Days: 0,
        postsToday: 0,
        averagePerDay: 0
      };
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get posts in date range
    const [totalPosts, recentPosts, todayPosts] = await Promise.all([
      // Total LinkedIn posts ever
      prisma.contentPost.count({
        where: {
          hook: {
            meeting: {
              companyId: user.company.id
            }
          },
          platformContent: {
            path: ['linkedin'],
            not: null
          }
        }
      }),
      // Posts in last N days
      prisma.contentPost.count({
        where: {
          hook: {
            meeting: {
              companyId: user.company.id
            }
          },
          platformContent: {
            path: ['linkedin'],
            not: null
          },
          publishedAt: {
            gte: startDate
          }
        }
      }),
      // Posts today
      prisma.contentPost.count({
        where: {
          hook: {
            meeting: {
              companyId: user.company.id
            }
          },
          platformContent: {
            path: ['linkedin'],
            not: null
          },
          publishedAt: {
            gte: today,
            lt: tomorrow
          }
        }
      })
    ]);

    return {
      totalPosts,
      postsLast30Days: recentPosts,
      postsToday: todayPosts,
      averagePerDay: days > 0 ? (recentPosts / days).toFixed(1) : 0,
      dailyLimitUsed: todayPosts,
      dailyLimitRemaining: Math.max(0, 150 - todayPosts) // LinkedIn's 150/day limit
    };

  } catch (error) {
    console.error('Failed to get LinkedIn posting stats:', error);
    throw error;
  }
}

/**
 * Check if user has reached LinkedIn daily posting limit
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Rate limit status
 */
export async function checkLinkedInRateLimit(userId) {
  try {
    const stats = await getLinkedInPostingStats(userId, 1);
    const dailyLimit = 150; // LinkedIn's limit
    const used = stats.postsToday;
    const remaining = Math.max(0, dailyLimit - used);

    return {
      dailyLimit,
      used,
      remaining,
      isAtLimit: remaining === 0,
      resetTime: new Date().setHours(24, 0, 0, 0) // Midnight tomorrow
    };
  } catch (error) {
    console.error('Failed to check LinkedIn rate limit:', error);
    throw error;
  }
}