import { supabase, supabaseAdmin } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const createMoodEntry = asyncHandler(async (req, res) => {
  const { mood, intensity, notes, conversationId } = req.body;
  if (!mood || !intensity) return res.status(400).json({ error: 'Validation Error', message: 'Mood and intensity are required' });
  if (intensity < 1 || intensity > 10) return res.status(400).json({ error: 'Validation Error', message: 'Intensity must be between 1 and 10' });

  const validMoods = ['excellent', 'good', 'neutral', 'low', 'poor'];
  if (!validMoods.includes(mood)) return res.status(400).json({ error: 'Validation Error', message: `Mood must be one of: ${validMoods.join(', ')}` });

  const { data } = await supabaseAdmin.from('mood_entries').insert({ user_id: req.userId, mood, intensity, notes: notes || null, conversation_id: conversationId || null }).select().single();
  logger.info('Mood entry created', { userId: req.userId, mood, intensity });
  res.status(201).json({ moodEntry: data });
});

export const getMoodEntries = asyncHandler(async (req, res) => {
  const { limit = 30, days } = req.query;
  let query = supabase.from('mood_entries').select('*').eq('user_id', req.userId).order('created_at', { ascending: false });
  if (days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    query = query.gte('created_at', startDate.toISOString());
  }
  query = query.limit(parseInt(limit));
  const { data } = await query;
  res.json({ entries: data || [] });
});

export const getMoodStats = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  const { data } = await supabase.from('mood_entries').select('*').eq('user_id', req.userId).gte('created_at', startDate.toISOString()).order('created_at', { ascending: true });

  if (!data || data.length === 0) {
    return res.json({ stats: { averageIntensity: 0, totalEntries: 0, moodDistribution: { excellent: 0, good: 0, neutral: 0, low: 0, poor: 0 }, trend: 'stable' } });
  }

  const averageIntensity = data.reduce((sum, entry) => sum + entry.intensity, 0) / data.length;
  const moodDistribution = data.reduce((acc, entry) => { acc[entry.mood] = (acc[entry.mood] || 0) + 1; return acc; }, { excellent: 0, good: 0, neutral: 0, low: 0, poor: 0 });

  const midpoint = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, midpoint);
  const secondHalf = data.slice(midpoint);
  const firstAvg = firstHalf.reduce((sum, e) => sum + e.intensity, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, e) => sum + e.intensity, 0) / secondHalf.length;

  let trend = 'stable';
  if (secondAvg > firstAvg + 0.5) trend = 'improving';
  else if (secondAvg < firstAvg - 0.5) trend = 'declining';

  res.json({ stats: { averageIntensity: parseFloat(averageIntensity.toFixed(2)), totalEntries: data.length, moodDistribution, trend } });
});

export const getMoodTrend = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  const { data } = await supabase.from('mood_entries').select('*').eq('user_id', req.userId).gte('created_at', startDate.toISOString()).order('created_at', { ascending: true });

  const trendData = (data || []).reduce((acc, entry) => {
    const date = new Date(entry.created_at).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = { date, totalIntensity: 0, count: 0, moods: [] };
    acc[date].totalIntensity += entry.intensity;
    acc[date].count += 1;
    acc[date].moods.push(entry.mood);
    return acc;
  }, {});

  const trend = Object.values(trendData).map(day => ({ date: day.date, averageIntensity: parseFloat((day.totalIntensity / day.count).toFixed(2)), entryCount: day.count, dominantMood: getMostFrequent(day.moods) }));
  res.json({ trend });
});

export const deleteMoodEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await supabase.from('mood_entries').delete().eq('id', id).eq('user_id', req.userId);
  res.json({ message: 'Mood entry deleted successfully' });
});

function getMostFrequent(arr) {
  const frequency = {};
  let maxCount = 0;
  let mostFrequent = arr[0];
  arr.forEach(item => {
    frequency[item] = (frequency[item] || 0) + 1;
    if (frequency[item] > maxCount) {
      maxCount = frequency[item];
      mostFrequent = item;
    }
  });
  return mostFrequent;
}

export default { createMoodEntry, getMoodEntries, getMoodStats, getMoodTrend, deleteMoodEntry };