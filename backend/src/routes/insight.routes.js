import express from 'express';
import { getInsights, generateInsights } from '../controllers/insight.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();
router.use(authenticate);

router.get('/', getInsights);
router.post('/generate', generateInsights);

export default router;
