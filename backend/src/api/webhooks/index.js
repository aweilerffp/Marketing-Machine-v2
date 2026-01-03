import express from 'express';
import zoomRouter from './zoom.js';
// Legacy Read.ai router - kept for backward compatibility during migration
// import readaiRouter from './readai.js';

const router = express.Router();

// Zoom webhook endpoint
router.use('/zoom', zoomRouter);

// Legacy Read.ai routes - disabled (clean break migration)
// router.use('/readai', readaiRouter);

export default router;