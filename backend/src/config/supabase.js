import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { logger } from './logger.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

// Client for frontend interactions (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for backend operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

logger.info('✅ Supabase client initialized');

export default supabase;