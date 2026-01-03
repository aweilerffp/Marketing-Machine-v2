import { processUserDeletion, getPendingDeletions } from '../../compliance/dataDeletion.js';

/**
 * Bull queue processor for deletion jobs
 * @param {object} job - Bull job object
 * @returns {object} Result of the deletion
 */
export const processDeletionJob = async (job) => {
  const { deletionRequestId } = job.data;

  console.log(`🗑️ Processing deletion job: ${job.id} (request: ${deletionRequestId})`);

  try {
    const result = await processUserDeletion(deletionRequestId);
    console.log(`✅ Deletion job ${job.id} completed`);
    return result;
  } catch (error) {
    console.error(`❌ Deletion job ${job.id} failed:`, error);
    throw error;
  }
};

/**
 * Schedule all pending deletions that are due
 * Should be called periodically (e.g., daily cron)
 * @param {object} deletionQueue - Bull queue instance
 * @returns {number} Number of deletions scheduled
 */
export async function schedulePendingDeletions(deletionQueue) {
  try {
    const pendingDeletions = await getPendingDeletions();

    console.log(`📋 Found ${pendingDeletions.length} pending deletions to process`);

    for (const request of pendingDeletions) {
      await deletionQueue.add('process-deletion', {
        deletionRequestId: request.id
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: true,
        removeOnFail: false // Keep failed jobs for debugging
      });

      console.log(`  Queued deletion for request: ${request.id}`);
    }

    return pendingDeletions.length;
  } catch (error) {
    console.error('Error scheduling pending deletions:', error);
    throw error;
  }
}
