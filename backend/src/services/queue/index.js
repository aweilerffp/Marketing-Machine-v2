// Mock queue objects for when Redis is not available
const mockQueue = {
  process: () => {},
  add: () => Promise.resolve({ id: 'mock' }),
  on: () => {},
};

// Disable Redis queues in development when Redis is not running
const shouldUseRedis = process.env.REDIS_ENABLED === 'true';

let transcriptQueue, schedulerQueue;

if (shouldUseRedis) {
  try {
    const Bull = require('bull');
    const { processTranscript } = require('./processors/transcript.js');
    const { schedulePost } = require('./processors/scheduler.js');

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

    // Set up processors
    transcriptQueue.process('process-transcript', processTranscript);
    schedulerQueue.process('schedule-post', schedulePost);

    // Basic error handling
    transcriptQueue.on('error', (error) => {
      console.error('Transcript queue error:', error);
    });

    schedulerQueue.on('error', (error) => {
      console.error('Scheduler queue error:', error);
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

    console.log('🔄 Queue processors initialized with Redis');
  } catch (error) {
    console.log('⚠️  Redis/Bull initialization failed, using mock queues');
    transcriptQueue = mockQueue;
    schedulerQueue = mockQueue;
  }
} else {
  console.log('🔄 Queue processors initialized in mock mode (Redis disabled)');
  transcriptQueue = mockQueue;
  schedulerQueue = mockQueue;
}

export { transcriptQueue, schedulerQueue };