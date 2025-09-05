import express from 'express';
import readaiWebhook from './readai.js';

const router = express.Router();

// Read.ai webhook endpoint - legacy (for backward compatibility)
router.use('/readai', readaiWebhook);

// Read.ai webhook endpoint - new token-based authentication
router.use('/readai/:companyId/:token', readaiWebhook);

export default router;