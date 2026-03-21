import { supabase, supabaseAdmin } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getInsights = asyncHandler(async (req, res) => {
  const { data } = await supabaseAdmin.from('insights').select('*').eq('user_id', req.userId).order('created_at', { ascending: false }).limit(10);
  res.json({ insights: data || [] });
});

export const generateInsights = asyncHandler(async (req, res) => {
  const { data: moodData } = await supabaseAdmin.from('mood_entries').select('*').eq('user_id', req.userId).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
  if (!moodData || moodData.length < 3) return res.status(400).json({ error: 'Insufficient Data', message: 'Not enough mood entries to generate insights' });

  const avgIntensity = moodData.reduce((s, e) => s + e.intensity, 0) / moodData.length;
  const insight = {
    user_id: req.userId, type: 'mood_pattern', title: 'Mood Progress Report',
    content: `Over the past 30 days, your average mood intensity has been ${avgIntensity.toFixed(1)}/10. ${avgIntensity >= 7 ? 'You\'re doing great!' : avgIntensity >= 5 ? 'Keep taking care of yourself.' : 'Consider reaching out for support.'}`,
    data: { averageIntensity: avgIntensity, entryCount: moodData.length }
  };
  const { data } = await supabaseAdmin.from('insights').insert(insight).select().single();
  res.status(201).json({ insight: data });
});

export default { getInsights, generateInsights };