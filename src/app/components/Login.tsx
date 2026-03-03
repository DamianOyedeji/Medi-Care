import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Lock, Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../../contexts/AuthContext';

interface LoginProps {
  onLogin: () => void;
  onSignUp: () => void;
  onForgotPassword?: () => void;
  onBack?: () => void;
}

export function Login({ onLogin, onSignUp, onForgotPassword, onBack }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
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
            A quiet space to talk and reflect.
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
                    <div className="flex items-center justify-between">
                        <label htmlFor="password" className="block text-xs font-semibold text-stone-600 uppercase tracking-wider ml-1">Password</label>
                        <button
                            type="button"
                            onClick={() => onForgotPassword?.()}
                            className="text-xs text-teal-600 font-medium hover:text-teal-700 transition-colors"
                        >
                            Forgot password?
                        </button>
                    </div>
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

                <div className="pt-2">
                    <Button variant="primary" type="submit" className="w-full py-3.5 justify-center text-base shadow-teal-100/50 shadow-lg" disabled={isLoading}>
                        {isLoading ? 'Logging in...' : 'Log In'}
                    </Button>
                </div>


            </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-4">
            <p className="text-stone-500 text-sm">
                Don't have an account?{' '}
                <button onClick={onSignUp} className="text-teal-600 font-semibold hover:text-teal-700 transition-colors">
                    Create one
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
