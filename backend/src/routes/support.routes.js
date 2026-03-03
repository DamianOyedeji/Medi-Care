import express from 'express';
import { getDailyQuote, getNearbyResources, getHelplines, searchNearby, getInitiatives } from '../controllers/support.controller.js';
import { optionalAuth } from '../middleware/authenticate.js';
import { locationRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.get('/quote', optionalAuth, getDailyQuote);
router.get('/nearby', optionalAuth, locationRateLimiter, getNearbyResources);
router.get('/helplines', optionalAuth, getHelplines);
router.get('/search', optionalAuth, locationRateLimiter, searchNearby);
router.get('/initiatives', optionalAuth, getInitiatives);

export default router;
