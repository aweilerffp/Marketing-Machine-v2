import prisma from '../../../models/prisma.js';
import {
  getLinkedInConnection,
  hasLinkedInConnection
} from '../../linkedin/connection.js';
import {
  postTextToLinkedIn,
  getLinkedInPersonUrn,
  validateLinkedInConnection
} from '../../linkedin/posting.js';
import {
  updateContentPostLinkedInStatus,
  checkLinkedInRateLimit
} from '../../linkedin/tracking.js';

export const schedulePost = async (job) => {
  const { postId } = job.data;

  try {
    console.log(`📅 Processing scheduled post: ${postId}`);

    // Find the post to publish
    const post = await prisma.contentPost.findUnique({
      where: { id: postId },
      include: {
        hook: {
          include: {
            meeting: {
              include: {
                company: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!post) {
      throw new Error(`Post ${postId} not found`);
    }

    if (post.status !== 'SCHEDULED') {
      console.log(`⚠️  Post ${postId} status is ${post.status}, skipping`);
      return { success: false, reason: 'Post not scheduled' };
    }

    // Get the user associated with this post
    const userId = post.hook?.meeting?.company?.user?.id;
    if (!userId) {
      throw new Error(`No user found for post ${postId}`);
    }

    // Check LinkedIn connection
    const hasConnection = await hasLinkedInConnection(userId);
    if (!hasConnection) {
      console.log(`⚠️  No LinkedIn connection for user ${userId}, skipping post ${postId}`);
      // Update post status to indicate LinkedIn not connected
      await prisma.contentPost.update({
        where: { id: postId },
        data: {
          status: 'REJECTED',
          rejectionReason: 'LinkedIn not connected'
        }
      });
      return { success: false, reason: 'LinkedIn not connected' };
    }

    // Get LinkedIn connection details
    const connection = await getLinkedInConnection(userId);
    if (!connection) {
      throw new Error(`LinkedIn connection not found for user ${userId}`);
    }

    // Validate connection is still active
    const connectionStatus = await validateLinkedInConnection(connection.accessToken);
    if (!connectionStatus.connected) {
      console.log(`⚠️  LinkedIn connection expired for user ${userId}, skipping post ${postId}`);
      await prisma.contentPost.update({
        where: { id: postId },
        data: {
          status: 'REJECTED',
          rejectionReason: 'LinkedIn connection expired'
        }
      });
      return { success: false, reason: 'LinkedIn connection expired' };
    }

    // Check LinkedIn rate limits
    const rateLimit = await checkLinkedInRateLimit(userId);
    if (rateLimit.isAtLimit) {
      console.log(`⚠️  LinkedIn rate limit reached for user ${userId}, rescheduling post ${postId}`);

      // Reschedule for next day when rate limit resets
      const nextReset = new Date(rateLimit.resetTime);
      const delay = nextReset.getTime() - Date.now() + (5 * 60 * 1000); // Add 5 minutes buffer

      await prisma.contentPost.update({
        where: { id: postId },
        data: {
          scheduledFor: nextReset
        }
      });

      // Re-queue the job with delay
      const { schedulerQueue } = await import('../index.js');
      await schedulerQueue.add('schedule-post', { postId }, {
        delay: Math.max(0, delay),
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      });

      return { success: false, reason: 'Rate limit reached, rescheduled for next reset' };
    }

    // Get person URN for posting
    const personUrn = await getLinkedInPersonUrn(connection.accessToken);

    // Post to LinkedIn
    const postResult = await postTextToLinkedIn(
      connection.accessToken,
      personUrn,
      post.content,
      'PUBLIC' // Default to public posting
    );

    if (!postResult.success) {
      console.error(`❌ LinkedIn posting failed for post ${postId}:`, postResult.error);
      await prisma.contentPost.update({
        where: { id: postId },
        data: {
          status: 'REJECTED',
          rejectionReason: `LinkedIn posting failed: ${postResult.error}`
        }
      });
      return { success: false, reason: postResult.error };
    }

    // Update post with LinkedIn data
    await updateContentPostLinkedInStatus(postId, {
      postId: postResult.linkedinPostId,
      publishedAt: postResult.publishedAt,
      visibility: 'PUBLIC'
    });

    console.log(`✅ Post ${postId} published to LinkedIn successfully: ${postResult.linkedinPostId}`);

    return {
      success: true,
      postId,
      linkedinPostId: postResult.linkedinPostId,
      message: 'Post published to LinkedIn successfully'
    };

  } catch (error) {
    console.error(`❌ Error scheduling post ${postId}:`, error);

    // Update post status to rejected on failure
    try {
      await prisma.contentPost.update({
        where: { id: postId },
        data: {
          status: 'REJECTED',
          rejectionReason: error.message
        }
      });
    } catch (updateError) {
      console.error(`❌ Failed to update post status after error:`, updateError);
    }

    throw error; // Let Bull handle the retry
  }
};