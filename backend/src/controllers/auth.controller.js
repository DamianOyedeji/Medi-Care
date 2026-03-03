import { supabase, supabaseAdmin } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const signup = asyncHandler(async (req, res) => {
  const { email, password, fullName } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Validation Error', message: 'Email, password, and full name are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Validation Error', message: 'Password must be at least 6 characters' });
  }

  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { full_name: fullName }, emailRedirectTo: `${process.env.CLIENT_URL}/auth/callback` }
  });

  if (error) {
    logger.error('Signup error', { error: error.message, email });
    if (error.message.includes('already registered')) {
      return res.status(409).json({ error: 'Conflict', message: 'Email already registered' });
    }
    return res.status(400).json({ error: 'Signup Failed', message: error.message });
  }

  logger.info('User signed up successfully', { userId: data.user?.id, email });
  res.status(201).json({
    message: 'Registration successful. Please check your email to verify your account.',
    user: { id: data.user.id, email: data.user.email, fullName: data.user.user_metadata.full_name },
    session: data.session
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Validation Error', message: 'Email and password are required' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    logger.warn('Login failed', { error: error.message, email });
    return res.status(401).json({ error: 'Authentication Failed', message: 'Invalid email or password' });
  }

  await supabaseAdmin.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', data.user.id);

  logger.info('User logged in successfully', { userId: data.user.id, email });
  res.json({
    message: 'Login successful',
    user: { id: data.user.id, email: data.user.email, fullName: data.user.user_metadata.full_name },
    session: data.session
  });
});

export const logout = asyncHandler(async (req, res) => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  logger.info('User logged out', { userId: req.userId });
  res.json({ message: 'Logout successful' });
});

export const getProfile = asyncHandler(async (req, res) => {
  const { data: user, error } = await supabase.from('users').select('id, email, full_name, created_at, last_login_at, is_active').eq('id', req.userId).single();
  if (error) throw error;

  const { data: settings } = await supabase.from('user_settings').select('*').eq('user_id', req.userId).single();
  res.json({ user: { ...user, settings: settings || {} } });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { fullName } = req.body;
  const { data, error } = await supabase.from('users').update({ full_name: fullName, updated_at: new Date().toISOString() }).eq('id', req.userId).select().single();
  if (error) throw error;

  await supabase.auth.updateUser({ data: { full_name: fullName } });
  logger.info('Profile updated', { userId: req.userId });
  res.json({ message: 'Profile updated successfully', user: data });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Validation Error', message: 'New password must be at least 6 characters' });
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  logger.info('Password changed', { userId: req.userId });
  res.json({ message: 'Password changed successfully' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Validation Error', message: 'Email is required' });

  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${process.env.CLIENT_URL}/reset-password` });
  logger.info('Password reset email sent', { email });
  res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token, type } = req.body;
  if (!token || !type) return res.status(400).json({ error: 'Validation Error', message: 'Token and type are required' });

  const { data, error } = await supabase.auth.verifyOtp({ token_hash: token, type: type });
  if (error) return res.status(400).json({ error: 'Verification Failed', message: error.message });

  logger.info('Email verified', { userId: data.user?.id });
  res.json({ message: 'Email verified successfully', user: data.user, session: data.session });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Validation Error', message: 'Password confirmation is required' });

  const { data: user } = await supabase.auth.getUser();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.user.email, password: password });
  if (signInError) return res.status(401).json({ error: 'Authentication Failed', message: 'Incorrect password' });

  const { error } = await supabase.from('users').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', req.userId);
  if (error) throw error;

  await supabase.auth.signOut();
  logger.info('Account deleted (soft)', { userId: req.userId });
  res.json({ message: 'Account deleted successfully' });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Validation Error', message: 'Refresh token is required' });

  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
  if (error) return res.status(401).json({ error: 'Invalid Token', message: error.message });

  logger.info('Token refreshed', { userId: data.user?.id });
  res.json({ message: 'Token refreshed successfully', session: data.session });
});