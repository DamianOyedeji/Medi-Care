import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, ChevronRight, Lock, Calendar, ArrowLeft, BookHeart } from 'lucide-react';
import { api } from '../../lib/api';

interface Session {
  id: string;
  date: string;
  preview: string;
  mood?: string;
}

interface ConversationHistoryProps {
  onBack: () => void;
  onSelectSession: (sessionId: string) => void;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today) return `Today, ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function ConversationHistory({ onBack, onSelectSession }: ConversationHistoryProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConversations() {
      try {
        const data = await api.get<{ conversations: Array<{ id: string; title: string; last_message_at: string }> }>('/api/conversations');
        const convs = (data as { conversations: Array<{ id: string; title: string; last_message_at: string }> }).conversations || [];
        setSessions(
          convs.map((c) => ({
            id: c.id,
            date: formatDate(c.last_message_at),
            preview: c.title,
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
        setSessions([]);
      } finally {
        setLoading(false);
      }
    }
    fetchConversations();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/conversations/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // Ignore
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-sm font-medium mb-4 transition-colors py-1"
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 mb-4">
              <BookHeart size={24} />
            </div>
            <h1 className="text-3xl font-bold text-stone-800 dark:text-stone-100 mb-2 font-serif tracking-tight">Your Conversations</h1>
            <div className="flex items-center justify-center gap-2 text-stone-500 dark:text-stone-400 text-sm bg-white/50 dark:bg-stone-800/50 inline-block px-4 py-1.5 rounded-full backdrop-blur-sm border border-stone-100 dark:border-stone-700">
              <Lock size={12} />
              <span>Private journal • Only you can see this</span>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="text-center py-12 text-stone-400 dark:text-stone-500">Loading...</div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-rose-500 dark:text-rose-400 mb-4">{error}</p>
            <p className="text-stone-500 dark:text-stone-400 text-sm">Please log in and try again.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => onSelectSession(session.id)}
                  className="group relative bg-white dark:bg-stone-800 hover:bg-stone-50/50 dark:hover:bg-stone-700/50 p-6 rounded-2xl shadow-sm hover:shadow-md border border-stone-100 dark:border-stone-700 transition-all cursor-pointer overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500/0 group-hover:bg-teal-500/30 transition-colors duration-300"></div>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                          <Calendar size={12} />
                          {session.date}
                        </div>
                        {session.mood && (
                          <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400 text-[10px] font-medium">
                            {session.mood}
                          </span>
                        )}
                      </div>
                      <p className="text-stone-700 dark:text-stone-200 font-medium leading-relaxed font-serif text-lg">
                        &quot;{session.preview}&quot;
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <button
                        onClick={(e) => handleDelete(e, session.id)}
                        className="p-2 text-stone-300 dark:text-stone-500 hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="p-2 text-stone-300 group-hover:text-teal-600 transition-colors mt-auto">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {sessions.length === 0 && (
              <div className="text-center py-12 text-stone-400 dark:text-stone-500">
                <p>No conversations yet.</p>
                <p className="text-sm mt-1">Start a chat to begin your journal.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
