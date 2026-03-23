import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../Button';
import { supabase } from '../../../lib/supabase';

export interface ResetPasswordProps {
  onSuccess: () => void;
}

export function ResetPassword({ onSuccess }: ResetPasswordProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      if (!supabase) {
        throw new Error('Password reset is not configured. Add Supabase credentials to .env');
      }
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      // Clear the hash from URL and navigate to login
      window.history.replaceState(null, '', window.location.pathname);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
            Set your new password.
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

            {/* Password Input */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider ml-1">New Password</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-teal-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 bg-stone-50 dark:bg-stone-700 border-transparent rounded-2xl text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:border-teal-500 focus:bg-white dark:focus:bg-stone-600 focus:ring-0 transition-all text-sm sm:text-base"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider ml-1">Confirm Password</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-teal-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 bg-stone-50 dark:bg-stone-700 border-transparent rounded-2xl text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:border-teal-500 focus:bg-white dark:focus:bg-stone-600 focus:ring-0 transition-all text-sm sm:text-base"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 p-1"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-rose-500 ml-1 mt-1">Passwords do not match</p>
              )}
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                type="submit"
                className="w-full py-3.5 justify-center text-base shadow-teal-100/50 shadow-lg"
                disabled={isLoading || (password !== confirmPassword && confirmPassword.length > 0)}
              >
                {isLoading ? 'Updating...' : 'Reset Password'}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
