// Mock queue objects for when Redis is not available
const mockQueue = {
  process: () => {},
  add: () => Promise.resolve({ id: 'mock' }),
  on: () => {},
};

// Initialize queues
let transcriptQueue = mockQueue;
let schedulerQueue = mockQueue;
let deletionQueue = mockQueue;

// Daily deletion check interval (24 hours)
const DELETION_CHECK_INTERVAL = 24 * 60 * 60 * 1000;

const initializeQueues = async () => {
  const shouldUseRedis = process.env.REDIS_ENABLED === 'true';

  if (shouldUseRedis) {
    try {
      const Bull = (await import('bull')).default;
      const { processTranscript } = await import('./processors/transcript.js');
      const { schedulePost } = await import('./processors/scheduler.js');
      const { processDeletionJob, schedulePendingDeletions } = await import('./processors/deletion.js');

      // Initialize Redis connection
      const redisConfig = {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD,
        }
      };

      // Create queues
      transcriptQueue = new Bull('transcript processing', redisConfig);
      schedulerQueue = new Bull('post scheduler', redisConfig);
      deletionQueue = new Bull('data deletion', redisConfig);

      // Set up processors
      transcriptQueue.process('process-transcript', processTranscript);
      schedulerQueue.process('schedule-post', schedulePost);
      deletionQueue.process('process-deletion', processDeletionJob);

      // Basic error handling
      transcriptQueue.on('error', (error) => {
        console.error('Transcript queue error:', error);
      });

      schedulerQueue.on('error', (error) => {
        console.error('Scheduler queue error:', error);
      });

      deletionQueue.on('error', (error) => {
        console.error('Deletion queue error:', error);
      });

      transcriptQueue.on('failed', (job, error) => {
        console.error(`Transcript job ${job.id} failed:`, error);
      });

      transcriptQueue.on('completed', (job, result) => {
        console.log(`✅ Transcript job ${job.id} completed successfully`);
      });

      schedulerQueue.on('failed', (job, error) => {
        console.error(`Scheduler job ${job.id} failed:`, error);
      });

      schedulerQueue.on('completed', (job, result) => {
        console.log(`✅ Scheduler job ${job.id} completed successfully`);
      });

      deletionQueue.on('failed', (job, error) => {
        console.error(`Deletion job ${job.id} failed:`, error);
      });

      deletionQueue.on('completed', (job, result) => {
        console.log(`✅ Deletion job ${job.id} completed successfully`);
      });

      // Schedule daily check for pending deletions
      setInterval(async () => {
        try {
          console.log('🔄 Running daily deletion check...');
          await schedulePendingDeletions(deletionQueue);
        } catch (error) {
          console.error('Daily deletion check failed:', error);
        }
      }, DELETION_CHECK_INTERVAL);

      // Also run deletion check on startup (after 5 seconds)
      setTimeout(async () => {
        try {
          console.log('🔄 Running startup deletion check...');
          await schedulePendingDeletions(deletionQueue);
        } catch (error) {
          console.error('Startup deletion check failed:', error);
        }
      }, 5000);

      console.log('🔄 Queue processors initialized with Redis');
    } catch (error) {
      console.log('⚠️  Redis/Bull initialization failed, using mock queues:', error.message);
      transcriptQueue = mockQueue;
      schedulerQueue = mockQueue;
      deletionQueue = mockQueue;
    }
  } else {
    console.log('🔄 Queue processors initialized in mock mode (Redis disabled)');
    transcriptQueue = mockQueue;
    schedulerQueue = mockQueue;
    deletionQueue = mockQueue;
  }
};

// Initialize queues immediately
initializeQueues().catch(error => {
  console.error('Queue initialization failed:', error);
  transcriptQueue = mockQueue;
  schedulerQueue = mockQueue;
  deletionQueue = mockQueue;
});

export { transcriptQueue, schedulerQueue, deletionQueue, initializeQueues };