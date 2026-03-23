import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '../Button';
import { supabase } from '../../../lib/supabase';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

export function ForgotPassword({ onBackToLogin }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!supabase) {
        throw new Error('Password reset is not configured. Add Supabase credentials to .env');
      }
      const redirectTo = `${window.location.origin}/`; // Redirect back to app root; hash with recovery tokens will be appended
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

      if (error) throw error;
      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 mb-4 shadow-sm">
              <Sparkles size={20} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 dark:text-stone-100 tracking-tight font-serif mb-2">
              Medi-Care
            </h1>
          </div>

          <div className="bg-white dark:bg-stone-800 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-700 p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50/50 dark:bg-teal-900/20 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />
            <div className="relative z-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto">
                <Mail size={28} />
              </div>
              <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">Check your email</h2>
              <p className="text-stone-600 dark:text-stone-300 text-sm">
                We've sent a password reset link to <strong>{email}</strong>. Click the link to set a new password.
              </p>
              <p className="text-stone-500 dark:text-stone-400 text-xs">
                Don't see it? Check your spam folder.
              </p>
              <p className="text-stone-500 dark:text-stone-400 text-xs">
                The link will expire in 1 hour.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={onBackToLogin}
              className="text-teal-600 font-semibold hover:text-teal-700 transition-colors inline-flex items-center gap-2 text-sm"
            >
              <ArrowLeft size={16} />
              Back to Log in
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 mb-4 shadow-sm">
            <Sparkles size={20} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 dark:text-stone-100 tracking-tight font-serif mb-2">
            Medi-Care
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm sm:text-base">
            Enter your email to reset your password.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-stone-800 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-700 p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50/50 dark:bg-teal-900/20 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider ml-1">Email</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-teal-500 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-stone-50 dark:bg-stone-700 border-transparent rounded-2xl text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:border-teal-500 focus:bg-white dark:focus:bg-stone-600 focus:ring-0 transition-all text-sm sm:text-base"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                type="submit"
                className="w-full py-3.5 justify-center text-base shadow-teal-100/50 shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={onBackToLogin}
            className="text-teal-600 font-semibold hover:text-teal-700 transition-colors inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft size={16} />
            Back to Log in
          </button>
        </div>
      </motion.div>
    </div>
  );
}
