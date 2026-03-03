import express from 'express';
import { createMoodEntry, getMoodEntries, getMoodStats, getMoodTrend, deleteMoodEntry } from '../controllers/mood.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();
router.use(authenticate);

router.post('/entry', createMoodEntry);
router.get('/entries', getMoodEntries);
router.get('/stats', getMoodStats);
router.get('/trend', getMoodTrend);
router.delete('/entry/:id', deleteMoodEntry);

export default router;
