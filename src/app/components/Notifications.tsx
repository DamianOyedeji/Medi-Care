import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Bell, ShieldAlert, CheckCircle, AlertTriangle, Info, Trash2, CheckCheck } from 'lucide-react';
import { useNotifications, type NotificationType, type AppNotification } from '../../contexts/NotificationContext';

interface NotificationsProps {
    onBack: () => void;
}

const TYPE_META: Record<NotificationType, { icon: React.ReactNode; accent: string; dot: string }> = {
    crisis: { icon: <ShieldAlert size={18} />, accent: 'text-rose-600 bg-rose-50', dot: 'bg-rose-500' },
    warning: { icon: <AlertTriangle size={18} />, accent: 'text-amber-600 bg-amber-50', dot: 'bg-amber-400' },
    success: { icon: <CheckCircle size={18} />, accent: 'text-teal-600 bg-teal-50', dot: 'bg-teal-500' },
    info: { icon: <Info size={18} />, accent: 'text-stone-500 bg-stone-100', dot: 'bg-stone-400' },
};

function groupByDay(notifications: AppNotification[]): [string, AppNotification[]][] {
    const map = new Map<string, AppNotification[]>();
    const now = new Date();
    for (const n of notifications) {
        const d = n.timestamp;
        let label: string;
        if (d.toDateString() === now.toDateString()) {
            label = 'Today';
        } else {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            if (d.toDateString() === yesterday.toDateString()) {
                label = 'Yesterday';
            } else {
                label = d.toLocaleDateString('en-NG', { weekday: 'long', month: 'short', day: 'numeric' });
            }
        }
        if (!map.has(label)) map.set(label, []);
        map.get(label)!.push(n);
    }
    return [...map.entries()];
}

export function Notifications({ onBack }: NotificationsProps) {
    const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();
    const groups = groupByDay(notifications);

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-sans">
            {/* Header */}
            <header className="bg-white/80 dark:bg-stone-800/80 backdrop-blur-md border-b border-stone-100 dark:border-stone-700 sticky top-0 z-10 px-4 sm:px-6 h-16 flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors font-medium text-sm"
                >
                    <ArrowLeft size={18} />
                    <span>Back</span>
                </button>
                <div className="flex items-center gap-2">
                    <Bell size={18} className="text-stone-700 dark:text-stone-300" />
                    <span className="font-semibold text-stone-800 dark:text-stone-100">Notifications</span>
                    {unreadCount > 0 && (
                        <span className="bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllRead}
                            className="flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-900 font-medium px-3 py-2 bg-teal-50 hover:bg-teal-100 rounded-xl border border-teal-200 transition-all"
                        >
                            <CheckCheck size={13} />
                            <span className="hidden sm:inline">Mark all read</span>
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button
                            onClick={clearAll}
                            className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-700 font-medium px-3 py-2 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-all"
                        >
                            <Trash2 size={13} />
                            <span className="hidden sm:inline">Clear all</span>
                        </button>
                    )}
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
                {notifications.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-24 text-center"
                    >
                        <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mb-4">
                            <Bell size={28} className="text-stone-300 dark:text-stone-600" />
                        </div>
                        <h2 className="text-stone-600 dark:text-stone-300 font-semibold text-lg">No notifications yet</h2>
                        <p className="text-stone-400 dark:text-stone-500 text-sm mt-1">
                            Notifications will appear here when something important happens.
                        </p>
                    </motion.div>
                ) : (
                    groups.map(([label, items], gi) => (
                        <motion.section
                            key={label}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: gi * 0.05 }}
                        >
                            <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-3 px-1">{label}</p>
                            <div className="space-y-2">
                                {items.map((n, i) => {
                                    const meta = TYPE_META[n.type];
                                    return (
                                        <motion.div
                                            key={n.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${n.read
                                                    ? 'bg-white dark:bg-stone-800 border-stone-100 dark:border-stone-700'
                                                    : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-600 shadow-sm'
                                                }`}
                                        >
                                            {/* Unread dot */}
                                            <div className="mt-1 shrink-0 w-2">
                                                {!n.read && <div className={`w-2 h-2 rounded-full ${meta.dot}`} />}
                                            </div>
                                            {/* Icon */}
                                            <div className={`p-2.5 rounded-xl shrink-0 ${meta.accent}`}>
                                                {meta.icon}
                                            </div>
                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-stone-800 dark:text-stone-100 text-sm leading-tight">{n.title}</p>
                                                <p className="text-stone-500 dark:text-stone-400 text-sm mt-0.5 leading-snug">{n.body}</p>
                                                <p className="text-stone-300 dark:text-stone-600 text-xs mt-1.5">
                                                    {n.timestamp.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.section>
                    ))
                )}
            </div>
        </div>
    );
}
