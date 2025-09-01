import express from 'express';
import readaiWebhook from './readai.js';

const router = express.Router();

// Read.ai webhook endpoint
router.use('/readai', readaiWebhook);

export default router;