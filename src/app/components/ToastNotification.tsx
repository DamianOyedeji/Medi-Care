import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, CheckCircle, Info, ShieldAlert } from 'lucide-react';
import { useNotifications, type NotificationType } from '../../contexts/NotificationContext';

const TYPE_STYLES: Record<NotificationType, { bg: string; border: string; icon: React.ReactNode; bar: string }> = {
    crisis: {
        bg: 'bg-rose-900',
        border: 'border-rose-700',
        bar: 'bg-rose-500',
        icon: <ShieldAlert size={16} className="text-rose-300" />,
    },
    warning: {
        bg: 'bg-amber-900',
        border: 'border-amber-700',
        bar: 'bg-amber-400',
        icon: <AlertTriangle size={16} className="text-amber-300" />,
    },
    success: {
        bg: 'bg-teal-900',
        border: 'border-teal-700',
        bar: 'bg-teal-400',
        icon: <CheckCircle size={16} className="text-teal-300" />,
    },
    info: {
        bg: 'bg-stone-900',
        border: 'border-stone-700',
        bar: 'bg-stone-400',
        icon: <Info size={16} className="text-stone-300" />,
    },
};

export function ToastNotificationOverlay() {
    const { activeToasts, dismissToast } = useNotifications();

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: '360px', width: 'calc(100vw - 2rem)' }}>
            <AnimatePresence>
                {activeToasts.map((toast) => {
                    const s = TYPE_STYLES[toast.type];
                    const delay = toast.type === 'crisis' ? 12 : 5;
                    return (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 80, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 80, scale: 0.9 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            className={`pointer-events-auto rounded-2xl border ${s.bg} ${s.border} shadow-2xl overflow-hidden`}
                        >
                            {/* Progress bar */}
                            <motion.div
                                className={`h-0.5 ${s.bar} origin-left`}
                                initial={{ scaleX: 1 }}
                                animate={{ scaleX: 0 }}
                                transition={{ duration: delay, ease: 'linear' }}
                            />
                            <div className="flex items-start gap-3 p-4">
                                <div className="mt-0.5 shrink-0">{s.icon}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-semibold leading-tight">{toast.title}</p>
                                    <p className="text-white/70 text-xs mt-0.5 leading-snug">{toast.body}</p>
                                </div>
                                <button
                                    onClick={() => dismissToast(toast.id)}
                                    className="shrink-0 text-white/40 hover:text-white/80 transition-colors mt-0.5"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
