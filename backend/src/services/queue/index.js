import Bull from 'bull';
import { processTranscript } from './processors/transcript.js';
import { schedulePost } from './processors/scheduler.js';

// Initialize Redis connection
const redisConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  }
};

// Create queues
export const transcriptQueue = new Bull('transcript processing', redisConfig);
export const schedulerQueue = new Bull('post scheduler', redisConfig);

// Set up processors
transcriptQueue.process('process-transcript', processTranscript);
schedulerQueue.process('schedule-post', schedulePost);

// Error handling
transcriptQueue.on('error', (error) => {
  console.error('Transcript queue error:', error);
});

transcriptQueue.on('failed', (job, error) => {
  console.error(`Transcript job ${job.id} failed:`, error);
});

transcriptQueue.on('completed', (job, result) => {
  console.log(`✅ Transcript job ${job.id} completed successfully`);
});

schedulerQueue.on('error', (error) => {
  console.error('Scheduler queue error:', error);
});

schedulerQueue.on('failed', (job, error) => {
  console.error(`Scheduler job ${job.id} failed:`, error);
});

schedulerQueue.on('completed', (job, result) => {
  console.log(`✅ Scheduler job ${job.id} completed successfully`);
});

console.log('🔄 Queue processors initialized');