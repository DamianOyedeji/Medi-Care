import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

export type NotificationType = 'info' | 'success' | 'warning' | 'crisis';

export interface AppNotification {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    timestamp: Date;
    read: boolean;
}

interface NotificationContextValue {
    notifications: AppNotification[];
    unreadCount: number;
    addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
    markAllRead: () => void;
    clearAll: () => void;
    activeToasts: AppNotification[];
    dismissToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const STORAGE_KEY = 'mh_notifications';

function loadFromStorage(): AppNotification[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return (JSON.parse(raw) as AppNotification[]).map(n => ({
            ...n,
            timestamp: new Date(n.timestamp),
        }));
    } catch {
        return [];
    }
}

function saveToStorage(notifications: AppNotification[]) {
    try {
        // Keep only the last 100 to avoid localStorage bloat
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 100)));
    } catch { /* ignore */ }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<AppNotification[]>(loadFromStorage);
    const [activeToasts, setActiveToasts] = useState<AppNotification[]>([]);
    const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const unreadCount = notifications.filter(n => !n.read).length;

    // Persist whenever notifications change
    useEffect(() => {
        saveToStorage(notifications);
    }, [notifications]);

    const dismissToast = useCallback((id: string) => {
        setActiveToasts(prev => prev.filter(t => t.id !== id));
        if (timers.current.has(id)) {
            clearTimeout(timers.current.get(id)!);
            timers.current.delete(id);
        }
    }, []);

    const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
        const notification: AppNotification = {
            ...n,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            timestamp: new Date(),
            read: false,
        };

        setNotifications(prev => [notification, ...prev]);
        setActiveToasts(prev => [notification, ...prev].slice(0, 5)); // max 5 toasts at once

        // Auto-dismiss non-crisis toasts after 5s
        const delay = n.type === 'crisis' ? 12000 : 5000;
        const t = setTimeout(() => dismissToast(notification.id), delay);
        timers.current.set(notification.id, t);
    }, [dismissToast]);

    const markAllRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
        setActiveToasts([]);
        timers.current.forEach(t => clearTimeout(t));
        timers.current.clear();
    }, []);

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead, clearAll, activeToasts, dismissToast }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
    return ctx;
}
