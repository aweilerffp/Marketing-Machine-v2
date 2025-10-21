import express from 'express';
import readaiRouter from './readai.js';

const router = express.Router();

// Mount the readai router directly - it will handle both legacy and token-based routes
router.use('/readai', readaiRouter);

export default router;