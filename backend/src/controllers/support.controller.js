import { supabaseAdmin } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { findNearbyResources, geocodeAddress } from '../services/location.service.js';
import { getSupportResources } from '../services/safety.service.js';

export const getDailyQuote = asyncHandler(async (req, res) => {
  const { data } = await supabaseAdmin.from('daily_quotes').select('*').eq('is_active', true).order('created_at', { ascending: false });
  if (!data || data.length === 0) return res.json({ quote: 'You are stronger than you think.', author: 'Unknown' });

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const quote = data[dayOfYear % data.length];
  res.json(quote);
});

export const getNearbyResources = asyncHandler(async (req, res) => {
  const { latitude, longitude, radius = 10 } = req.query;
  if (!latitude || !longitude) return res.status(400).json({ error: 'Validation Error', message: 'Latitude and longitude are required' });

  const resources = await findNearbyResources(parseFloat(latitude), parseFloat(longitude), parseInt(radius));
  res.json({ resources });
});

export const getHelplines = asyncHandler(async (req, res) => {
  const { data } = await supabaseAdmin.from('support_resources').select('*').eq('type', 'helpline').eq('is_24_7', true);
  res.json({ helplines: data || [] });
});

export const searchNearby = asyncHandler(async (req, res) => {
  const { query, radius = 50 } = req.query;
  if (!query) return res.status(400).json({ error: 'Validation Error', message: 'Search query is required' });

  const location = await geocodeAddress(query);
  if (!location) return res.status(404).json({ error: 'Not Found', message: 'Could not find that location. Try a more specific search.' });

  const resources = await findNearbyResources(location.latitude, location.longitude, parseInt(radius));
  res.json({ location: { ...location }, resources });
});

export const getInitiatives = asyncHandler(async (req, res) => {
  const resources = getSupportResources();
  res.json(resources);
});

export default { getDailyQuote, getNearbyResources, getHelplines, searchNearby, getInitiatives };