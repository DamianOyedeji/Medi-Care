import express from 'express';
import { sendMessage, getConversationHistory, getConversationSummary } from '../controllers/chat.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { chatRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();
router.use(authenticate);

router.post('/message', chatRateLimiter, sendMessage);
router.get('/history/:conversationId', getConversationHistory);
router.get('/summary/:conversationId', getConversationSummary);

export default router;
