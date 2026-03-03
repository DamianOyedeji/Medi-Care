import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Lock, Mail, Eye, EyeOff, User, ArrowLeft } from 'lucide-react';
import { Button } from '../Button';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../lib/api';

interface RegisterProps {
  onRegister: () => void;
  onBackToLogin: () => void;
  onBack?: () => void;
}

export function Register({ onRegister, onBackToLogin, onBack }: RegisterProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setUserFromSession } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return;
    setError(null);
    setIsLoading(true);
    try {
      const data = await api.post<{ user: { id: string; email: string; fullName?: string }; session?: { access_token: string } }>(
        '/api/auth/signup',
        { email, password, fullName }
      );
      const res = data as { user: { id: string; email: string; fullName?: string }; session?: { access_token: string } };
      if (res.session?.access_token) {
        setUserFromSession(
          { id: res.user.id, email: res.user.email, fullName: res.user.fullName },
          res.session.access_token
        );
        onRegister();
      } else {
        onBackToLogin();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-50 text-teal-600 mb-4 shadow-sm">
            <Sparkles size={20} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 tracking-tight font-serif mb-2">
            Medi-Care
          </h1>
          <p className="text-stone-500 text-sm sm:text-base">
            Create your account to get started.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 sm:p-8 relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50/50 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 text-rose-700 text-sm">
                {error}
              </div>
            )}
            {/* Full Name Input */}
            <div className="space-y-1.5">
              <label htmlFor="fullName" className="block text-xs font-semibold text-stone-600 uppercase tracking-wider ml-1">Full Name</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-teal-500 transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-stone-50 border-transparent rounded-2xl text-stone-800 placeholder-stone-400 focus:border-teal-500 focus:bg-white focus:ring-0 transition-all text-sm sm:text-base"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-semibold text-stone-600 uppercase tracking-wider ml-1">Email</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-teal-500 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-stone-50 border-transparent rounded-2xl text-stone-800 placeholder-stone-400 focus:border-teal-500 focus:bg-white focus:ring-0 transition-all text-sm sm:text-base"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-stone-600 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-teal-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 bg-stone-50 border-transparent rounded-2xl text-stone-800 placeholder-stone-400 focus:border-teal-500 focus:bg-white focus:ring-0 transition-all text-sm sm:text-base"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-stone-600 uppercase tracking-wider ml-1">Confirm Password</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-teal-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 bg-stone-50 border-transparent rounded-2xl text-stone-800 placeholder-stone-400 focus:border-teal-500 focus:bg-white focus:ring-0 transition-all text-sm sm:text-base"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
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
                disabled={(password !== confirmPassword && confirmPassword.length > 0) || isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </div>

            <div className="relative flex items-center gap-3 py-2">
              <div className="h-px bg-stone-100 flex-1"></div>
              <span className="text-xs text-stone-400 font-medium">or</span>
              <div className="h-px bg-stone-100 flex-1"></div>
            </div>

            <button
              type="button"
              className="w-full bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-800 font-medium py-3 px-4 rounded-2xl transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-4">
          <p className="text-stone-500 text-sm">
            Already have an account?{' '}
            <button onClick={onBackToLogin} className="text-teal-600 font-semibold hover:text-teal-700 transition-colors">
              Log in
            </button>
          </p>
          <div className="flex items-center justify-center gap-1.5 text-stone-400 text-xs">
            <Lock size={12} />
            <span>Your conversations are private and secure.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
