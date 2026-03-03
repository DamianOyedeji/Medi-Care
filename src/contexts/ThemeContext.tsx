import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface ThemeContextType {
    isDark: boolean;
    toggleDark: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ isDark: false, toggleDark: () => { } });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('mh_dark_mode');
            if (saved !== null) return saved === 'true';
            return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
        }
        return false;
    });

    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('mh_dark_mode', String(isDark));
    }, [isDark]);

    const toggleDark = useCallback(() => {
        setIsDark(prev => !prev);
    }, []);

    return (
        <ThemeContext.Provider value={{ isDark, toggleDark }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
