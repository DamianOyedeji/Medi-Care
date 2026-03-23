import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from './Button';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';

interface InsightsProps {
  onBack: () => void;
  onContinueChat: () => void;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: { label: string } }>; label?: string }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-stone-100 text-sm">
        <p className="font-serif text-stone-800 font-medium mb-1">{dataPoint.label}</p>
        <p className="text-stone-500 text-xs">{label}</p>
      </div>
    );
  }
  return null;
};

export function Insights({ onBack, onContinueChat }: InsightsProps) {
  const [moodData, setMoodData] = useState<Array<{ date: string; score: number; label: string }>>([]);
  const [insights, setInsights] = useState<Array<{ id: string; title: string; content: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moodEntryCount, setMoodEntryCount] = useState(0);
  const REQUIRED_ENTRIES = 3;

  useEffect(() => {
    async function fetchData() {
      try {
        const [trendRes, insightsRes] = await Promise.all([
          api.get<{ trend: Array<{ date: string; averageIntensity: number; dominantMood?: string }> }>('/api/mood/trend?days=7'),
          api.get<{ insights: Array<{ id: string; title: string; content: string }>; moodEntryCount: number }>('/api/insights'),
        ]);
        const trend = (trendRes as { trend: Array<{ date: string; averageIntensity: number; dominantMood?: string }> }).trend || [];
        const ins = (insightsRes as { insights: Array<{ id: string; title: string; content: string }>; moodEntryCount: number }).insights || [];
        const entryCount = (insightsRes as { moodEntryCount: number }).moodEntryCount || 0;
        setMoodEntryCount(entryCount);

        const moodLabels: Record<string, string> = { excellent: 'Great', good: 'Good', neutral: 'Calm', low: 'Low', poor: 'Overwhelmed' };
        setMoodData(
          trend.map((t) => ({
            date: new Date(t.date).toLocaleDateString([], { weekday: 'short' }),
            score: t.averageIntensity,
            label: moodLabels[t.dominantMood || ''] || t.dominantMood || '—',
          }))
        );
        setInsights(ins);

        // Auto-generate insights if enough mood data but no insights yet
        if (ins.length === 0 && entryCount >= REQUIRED_ENTRIES) {
          try {
            setGenerating(true);
            const res = await api.post<{ insight: { id: string; title: string; content: string } }>('/api/insights/generate');
            const newInsight = (res as { insight: { id: string; title: string; content: string } }).insight;
            if (newInsight) setInsights([newInsight]);
          } catch {
            // Silently fail — user can still manually generate
          } finally {
            setGenerating(false);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load insights');
        setMoodData([]);
        setInsights([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleGenerateInsights = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await api.post<{ insight: { id: string; title: string; content: string } }>('/api/insights/generate');
      const newInsight = (res as { insight: { id: string; title: string; content: string } }).insight;
      if (newInsight) setInsights((prev) => [newInsight, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate insights. Need at least 3 mood entries.');
    } finally {
      setGenerating(false);
    }
  };

  const hasData = moodData.length > 0 || insights.length > 0;

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm font-medium mb-4 transition-colors py-1"
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-stone-800 mb-2 font-serif tracking-tight">Your Insights</h1>
            <p className="text-stone-500 font-medium">A gentle view of how you've been feeling over time.</p>
          </div>
        </header>

        {loading ? (
          <div className="text-center py-12 text-stone-400">Loading...</div>
        ) : error && !hasData ? (
          <div className="text-center py-12">
            <p className="text-rose-500 mb-4">{error}</p>
            <p className="text-stone-500 text-sm">Please log in and try again.</p>
          </div>
        ) : !hasData ? (
          <div className="text-center py-12">
            <p className="text-stone-500 mb-4">No insights yet.</p>
            {moodEntryCount < REQUIRED_ENTRIES ? (
              <>
                <p className="text-stone-400 text-sm mb-2">
                  You need at least {REQUIRED_ENTRIES} mood entries to generate insights.
                </p>
                <p className="text-stone-400 text-sm mb-6">
                  You currently have <span className="font-semibold text-stone-600">{moodEntryCount}</span> — just{' '}
                  <span className="font-semibold text-teal-600">{REQUIRED_ENTRIES - moodEntryCount} more</span> to go!
                </p>
                <Button variant="primary" size="lg" onClick={onContinueChat}>
                  Continue Conversation
                </Button>
              </>
            ) : (
              <>
                <p className="text-stone-400 text-sm mb-6">
                  You have {moodEntryCount} mood entries — enough to generate insights!
                </p>
                <Button variant="primary" size="lg" onClick={handleGenerateInsights} disabled={generating}>
                  {generating ? 'Generating...' : 'Generate Insights'}
                </Button>
              </>
            )}
          </div>
        ) : (
          <>
            {moodData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-serif font-semibold text-stone-700">Mood Trends</h2>
                  <span className="px-2 py-1 rounded-full bg-stone-100 text-stone-500 text-xs">Last 7 Days</span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={moodData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#a8a29e', fontSize: 12 }} dy={10} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e7e5e4', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area type="monotone" dataKey="score" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorMood)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex justify-between text-xs text-stone-400 font-medium px-2">
                  <span>Overwhelmed</span>
                  <span>Calm</span>
                  <span>Hopeful</span>
                </div>
              </motion.div>
            )}

            {insights.map((insight, i) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-teal-50/50 p-6 rounded-3xl border border-teal-100/50 flex items-start gap-4"
              >
                <div className="bg-white p-3 rounded-full text-teal-600 shadow-sm shrink-0">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-serif font-semibold text-teal-900 mb-1">{insight.title}</h3>
                  <p className="text-teal-800/80 leading-relaxed">{insight.content}</p>
                </div>
              </motion.div>
            ))}

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleGenerateInsights}
                disabled={generating}
              >
                {generating ? 'Generating...' : 'Generate New Insights'}
              </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="pt-4 text-center">
              <Button variant="primary" size="lg" onClick={onContinueChat} className="w-full sm:w-auto min-w-[200px] shadow-teal-200/50 shadow-lg">
                Continue Conversation
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
