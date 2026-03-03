import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, Sparkles, Settings, Bell, Moon, Sun, MoreVertical, LogOut } from 'lucide-react';
import { Button } from './Button';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

interface NavbarProps {
  onStartChat: () => void;
  onViewHistory?: () => void;
  onViewInsights?: () => void;
  onViewSettings?: () => void;
  onViewSupport?: () => void;
  onViewNotifications?: () => void;
  onLogout?: () => void;
}

export function Navbar({ onStartChat, onViewHistory, onViewInsights, onViewSettings, onViewSupport, onViewNotifications, onLogout }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { unreadCount } = useNotifications();
  const { isDark, toggleDark } = useTheme();
  const { logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    await logout();
    if (onLogout) onLogout();
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-100 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Sparkles size={18} />
            </div>
            <span className="font-bold text-xl tracking-tight text-stone-800 dark:text-stone-100">Medi-Care</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <button onClick={onStartChat} className="text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white font-medium transition-colors">Chat</button>
            <button onClick={onViewHistory} className="text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white font-medium transition-colors">Journal</button>
            <button onClick={onViewInsights} className="text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white font-medium transition-colors">Insights</button>
            <button onClick={onViewSupport} className="text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white font-medium transition-colors">Support</button>
            <button onClick={onViewSettings} className="text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white font-medium transition-colors" title="Settings">
              <Settings size={20} />
            </button>
            <button onClick={toggleDark} className="text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white font-medium transition-colors" title={isDark ? 'Light mode' : 'Dark mode'}>
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={onViewNotifications}
              className="relative text-stone-600 hover:text-stone-900 transition-colors"
              title="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <Button variant="primary" size="sm" onClick={onStartChat}>Get Started</Button>

            {/* Three-dot user menu */}
            {isAuthenticated && (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setShowUserMenu((prev) => !prev)}
                  className="text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full p-1.5 transition-colors"
                  title="More options"
                  aria-label="More options"
                >
                  <MoreVertical size={20} />
                </button>
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-44 bg-white dark:bg-stone-800 rounded-xl shadow-xl ring-1 ring-stone-200 dark:ring-stone-700 overflow-hidden z-50"
                    >
                      <button
                        onClick={() => { setShowUserMenu(false); handleLogout(); }}
                        className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                      >
                        <LogOut size={16} />
                        Log out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-stone-600 p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-stone-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              <button onClick={() => { onStartChat(); setIsOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50">Chat</button>
              <button onClick={() => { if (onViewHistory) onViewHistory(); setIsOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50">Journal</button>
              <button onClick={() => { if (onViewInsights) onViewInsights(); setIsOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50">Insights</button>
              <button onClick={() => { if (onViewSupport) onViewSupport(); setIsOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50">Support</button>
              <button onClick={() => { if (onViewSettings) onViewSettings(); setIsOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50">Settings</button>
              <button onClick={() => { if (onViewNotifications) onViewNotifications(); setIsOpen(false); }} className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50">
                <span>Notifications</span>
                {unreadCount > 0 && <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
              </button>
              {isAuthenticated && (
                <button
                  onClick={() => { setIsOpen(false); handleLogout(); }}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                >
                  <LogOut size={18} />
                  Log out
                </button>
              )}
              <div className="pt-4">
                <Button className="w-full" onClick={() => { onStartChat(); setIsOpen(false); }}>Get Started</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
