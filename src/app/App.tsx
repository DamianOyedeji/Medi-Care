import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Footer } from './components/Footer';
import { ChatInterface } from './components/ChatInterface';
import { ConversationHistory } from './components/ConversationHistory';
import { Insights } from './components/Insights';
import { Settings } from './components/Settings';
import { Support } from './components/Support';
import { Login } from './components/Login';
import { Register } from './components/ui/Register';
import { ForgotPassword } from './components/ui/ForgotPassword';
import { ResetPassword } from './components/ui/ResetPassword';
import { Notifications } from './components/Notifications';
import { PublicLandingPage } from './components/PublicLandingPage';
import { NotificationProvider } from '../contexts/NotificationContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ToastNotificationOverlay } from './components/ToastNotification';
import { motion, AnimatePresence } from 'motion/react';

type View = 'public' | 'landing' | 'chat' | 'history' | 'insights' | 'settings' | 'support' | 'login' | 'register' | 'forgot-password' | 'reset-password' | 'notifications';

function App() {
  const [currentView, setCurrentView] = useState<View>('public');
  const [previousView, setPreviousView] = useState<View>('public');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const { isAuthenticated, loading } = useAuth();

  // Handle authenticated state: redirect unauthenticated users to public page
  useEffect(() => {
    if (!loading && !isAuthenticated && currentView !== 'public' && currentView !== 'login' && currentView !== 'register' && currentView !== 'forgot-password' && currentView !== 'reset-password') {
      setCurrentView('public');
    }
  }, [isAuthenticated, loading, currentView]);

  // Detect password recovery from Supabase email link (hash contains type=recovery)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setCurrentView('reset-password');
    }
  }, []);

  const navigate = (view: View) => {
    setPreviousView(currentView);
    setCurrentView(view);
  };

  const renderView = () => {
    switch (currentView) {
      case 'public':
        return (
          <motion.div key="public" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <PublicLandingPage
              onLogin={() => navigate('login')}
              onSignUp={() => navigate('register')}
            />
          </motion.div>
        );
      case 'login':
        return (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <Login
              onLogin={() => navigate('landing')}
              onSignUp={() => navigate('register')}
              onForgotPassword={() => navigate('forgot-password')}
              onBack={() => navigate('public')}
            />
          </motion.div>
        );
      case 'register':
        return (
          <motion.div key="register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <Register onRegister={() => navigate('landing')} onBackToLogin={() => navigate('login')} onBack={() => navigate('public')} />
          </motion.div>
        );
      case 'forgot-password':
        return (
          <motion.div key="forgot-password" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <ForgotPassword onBackToLogin={() => navigate('login')} />
          </motion.div>
        );
      case 'reset-password':
        return (
          <motion.div key="reset-password" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <ResetPassword onSuccess={() => navigate('login')} />
          </motion.div>
        );
      case 'chat':
        return (
          <motion.div key="chat" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.3 }} className="h-screen overflow-hidden bg-stone-50">
            <ChatInterface
              conversationId={selectedConversationId}
              onBack={() => { setSelectedConversationId(null); navigate('landing'); }}
              onViewSupport={() => navigate('support')}
              onViewNotifications={() => navigate('notifications')}
            />
          </motion.div>
        );
      case 'history':
        return (
          <motion.div key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            <ConversationHistory
              onBack={() => navigate('landing')}
              onSelectSession={(id) => { setSelectedConversationId(id); navigate('chat'); }}
            />
          </motion.div>
        );
      case 'insights':
        return (
          <motion.div key="insights" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.3 }}>
            <Insights
              onBack={() => navigate('landing')}
              onContinueChat={() => { setSelectedConversationId(null); navigate('chat'); }}
            />
          </motion.div>
        );
      case 'settings':
        return (
          <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <Settings onBack={() => navigate('landing')} onViewSupport={() => navigate('support')} />
          </motion.div>
        );
      case 'support':
        return (
          <motion.div key="support" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <Support
              onBack={() => navigate('landing')}
              onReturnToChat={() => { setSelectedConversationId(null); navigate('chat'); }}
              onViewNotifications={() => navigate('notifications')}
            />
          </motion.div>
        );
      case 'notifications':
        return (
          <motion.div key="notifications" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <Notifications onBack={() => navigate(previousView === 'notifications' ? 'landing' : previousView)} />
          </motion.div>
        );
      case 'landing':
      default:
        return (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <Navbar
              onStartChat={() => { setSelectedConversationId(null); navigate('chat'); }}
              onViewHistory={() => navigate('history')}
              onViewInsights={() => navigate('insights')}
              onViewSettings={() => navigate('settings')}
              onViewSupport={() => navigate('support')}
              onViewNotifications={() => navigate('notifications')}
              onLogout={() => navigate('login')}
            />
            <main>
              <Hero onStartChat={() => { setSelectedConversationId(null); navigate('chat'); }} onSupportClick={() => navigate('support')} />
              <Features />
            </main>
            <Footer />
          </motion.div>
        );
    }
  };

  return (
    <ThemeProvider>
      <NotificationProvider>
        <div className="min-h-screen bg-white dark:bg-stone-900 font-sans text-stone-900 dark:text-stone-100 selection:bg-teal-100 selection:text-teal-900 transition-colors">
          <ToastNotificationOverlay />
          <AnimatePresence mode="wait">
            {renderView()}
          </AnimatePresence>
        </div>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
