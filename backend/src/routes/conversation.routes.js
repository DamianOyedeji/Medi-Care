import express from 'express';
import { getConversations, createConversation, updateConversation, deleteConversation } from '../controllers/conversation.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();
router.use(authenticate);

router.get('/', getConversations);
router.post('/', createConversation);
router.patch('/:id', updateConversation);
router.delete('/:id', deleteConversation);

export default router;
