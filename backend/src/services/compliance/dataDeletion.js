import axios from 'axios';
import prisma from '../../models/prisma.js';

/**
 * Process a single deletion request
 * Cascades through all user data and removes everything
 * @param {string} deletionRequestId - ID of the deletion request to process
 * @returns {object} Result with success status and audit log
 */
export async function processUserDeletion(deletionRequestId) {
  const request = await prisma.deletionRequest.findUnique({
    where: { id: deletionRequestId },
    include: { user: true }
  });

  if (!request) {
    return { success: false, reason: 'Deletion request not found' };
  }

  if (request.status !== 'PENDING') {
    return { success: false, reason: `Request already ${request.status.toLowerCase()}` };
  }

  const auditLog = {
    startedAt: new Date().toISOString(),
    deletedItems: [],
    errors: []
  };

  try {
    // Update status to processing
    await prisma.deletionRequest.update({
      where: { id: deletionRequestId },
      data: { status: 'PROCESSING' }
    });

    const userId = request.userId;

    console.log(`🗑️ Starting deletion for user: ${userId}`);

    // 1. Delete all ContentPosts (deepest level)
    const posts = await prisma.contentPost.deleteMany({
      where: {
        hook: {
          meeting: {
            company: { userId }
          }
        }
      }
    });
    auditLog.deletedItems.push({ type: 'ContentPost', count: posts.count });
    console.log(`  Deleted ${posts.count} ContentPosts`);

    // 2. Delete all ContentHooks
    const hooks = await prisma.contentHook.deleteMany({
      where: {
        meeting: {
          company: { userId }
        }
      }
    });
    auditLog.deletedItems.push({ type: 'ContentHook', count: hooks.count });
    console.log(`  Deleted ${hooks.count} ContentHooks`);

    // 3. Delete all Meetings (including transcripts)
    const meetings = await prisma.meeting.deleteMany({
      where: {
        company: { userId }
      }
    });
    auditLog.deletedItems.push({ type: 'Meeting', count: meetings.count });
    console.log(`  Deleted ${meetings.count} Meetings`);

    // 4. Delete Company
    const company = await prisma.company.deleteMany({
      where: { userId }
    });
    auditLog.deletedItems.push({ type: 'Company', count: company.count });
    console.log(`  Deleted ${company.count} Company records`);

    // 5. Delete all PlatformConnections
    const connections = await prisma.platformConnection.deleteMany({
      where: { userId }
    });
    auditLog.deletedItems.push({ type: 'PlatformConnection', count: connections.count });
    console.log(`  Deleted ${connections.count} PlatformConnections`);

    // 6. Delete UserConsent
    try {
      await prisma.userConsent.deleteMany({ where: { userId } });
      auditLog.deletedItems.push({ type: 'UserConsent', count: 1 });
      console.log(`  Deleted UserConsent`);
    } catch (e) {
      // Consent might not exist
      auditLog.deletedItems.push({ type: 'UserConsent', count: 0 });
    }

    // 7. Delete all other DeletionRequests for this user (except current one)
    const otherRequests = await prisma.deletionRequest.deleteMany({
      where: {
        userId,
        id: { not: deletionRequestId }
      }
    });
    auditLog.deletedItems.push({ type: 'OtherDeletionRequests', count: otherRequests.count });

    // 8. Finally delete User
    await prisma.user.delete({ where: { id: userId } });
    auditLog.deletedItems.push({ type: 'User', count: 1 });
    console.log(`  Deleted User record`);

    // 9. Notify Zoom Data Compliance API if this was a Zoom deauthorization
    if (request.zoomUserId) {
      try {
        const complianceResult = await notifyZoomCompliance(request.zoomUserId);
        auditLog.zoomComplianceId = complianceResult.jobId;
        console.log(`  Notified Zoom Compliance API`);
      } catch (error) {
        console.error('Failed to notify Zoom Compliance API:', error);
        auditLog.errors.push({
          type: 'ZoomComplianceNotification',
          message: error.message
        });
        // Don't fail the deletion just because Zoom notification failed
      }
    }

    auditLog.completedAt = new Date().toISOString();

    // Update deletion request as completed
    // Note: The user is deleted, but we keep this record for audit purposes
    // We need to update before the user is deleted, so we do this differently
    await prisma.deletionRequest.update({
      where: { id: deletionRequestId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        auditLog
      }
    });

    console.log(`✅ Deletion completed for request: ${deletionRequestId}`);

    return { success: true, auditLog };

  } catch (error) {
    console.error(`❌ Deletion failed for request ${deletionRequestId}:`, error);

    auditLog.error = error.message;
    auditLog.failedAt = new Date().toISOString();

    try {
      await prisma.deletionRequest.update({
        where: { id: deletionRequestId },
        data: {
          status: 'FAILED',
          auditLog
        }
      });
    } catch (updateError) {
      console.error('Failed to update deletion request status:', updateError);
    }

    throw error;
  }
}

/**
 * Notify Zoom that data deletion is complete
 * Required by Zoom Data Compliance requirements
 * @param {string} zoomUserId - Zoom user ID
 * @returns {object} Compliance job info
 */
async function notifyZoomCompliance(zoomUserId) {
  // Zoom Data Compliance API endpoint
  const response = await axios.post(
    'https://api.zoom.us/oauth/data/compliance',
    {
      client_id: process.env.ZOOM_CLIENT_ID,
      user_id: zoomUserId,
      account_id: process.env.ZOOM_ACCOUNT_ID,
      deauthorization_event_received: {
        user_data_retention: 'false', // We don't retain data after deauthorization
        account_id: process.env.ZOOM_ACCOUNT_ID,
        user_id: zoomUserId
      },
      compliance_completed: true
    },
    {
      headers: {
        'Authorization': `Basic ${Buffer.from(
          `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
        ).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return { jobId: response.data?.job_id || 'notified' };
}

/**
 * Get all pending deletion requests that are due
 * @returns {Array} Array of deletion requests ready to process
 */
export async function getPendingDeletions() {
  return await prisma.deletionRequest.findMany({
    where: {
      status: 'PENDING',
      scheduledFor: { lte: new Date() }
    },
    orderBy: {
      scheduledFor: 'asc'
    }
  });
}

/**
 * Create a deletion request for a user
 * @param {string} userId - User ID to schedule for deletion
 * @param {string} zoomUserId - Optional Zoom user ID (for compliance notification)
 * @param {number} delayDays - Days until deletion (default 10)
 * @returns {object} Created deletion request
 */
export async function scheduleDeletion(userId, zoomUserId = null, delayDays = 10) {
  const scheduledFor = new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000);

  return await prisma.deletionRequest.create({
    data: {
      userId,
      zoomUserId,
      status: 'PENDING',
      scheduledFor
    }
  });
}

/**
 * Cancel a pending deletion request
 * @param {string} deletionRequestId - ID of the deletion request to cancel
 * @returns {object} Cancelled deletion request
 */
export async function cancelDeletion(deletionRequestId) {
  const request = await prisma.deletionRequest.findUnique({
    where: { id: deletionRequestId }
  });

  if (!request) {
    throw new Error('Deletion request not found');
  }

  if (request.status !== 'PENDING') {
    throw new Error(`Cannot cancel deletion with status: ${request.status}`);
  }

  return await prisma.deletionRequest.delete({
    where: { id: deletionRequestId }
  });
}
