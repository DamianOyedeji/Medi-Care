// backend/src/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.routes.js';
import chatRoutes from './routes/chat.routes.js';
import conversationRoutes from './routes/conversation.routes.js';
import supportRoutes from './routes/support.routes.js';
import moodRoutes from './routes/mood.routes.js';
import insightRoutes from './routes/insight.routes.js';
import { logger } from './config/logger.js';

dotenv.config();

const app = express();

// CORS configuration — allow Render frontend in production
const defaultAllowedOrigins = [
  'https://medi-care-frontend.onrender.com',
  'https://medi-care-frontend-3q4c.onrender.com',
  'https://medi-care-frontend-p4po.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

const normalizeOrigin = (value) => {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/+$/, '').trim();
  }
};

const envOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => normalizeOrigin(origin.trim())).filter(Boolean)
  : [];

const allowedOrigins = Array.from(
  new Set([
    ...defaultAllowedOrigins.map((origin) => normalizeOrigin(origin)).filter(Boolean),
    ...envOrigins,
  ])
);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(normalizeOrigin(origin))) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/insights', insightRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Diagnostic endpoint — remove after debugging
app.get('/api/debug/supabase', async (req, res) => {
  const { supabase, supabaseAdmin } = await import('./config/supabase.js');
  const results = {};

  try {
    const { data: anonTest, error: anonErr } = await supabase.from('users').select('id').limit(1);
    results.anonClient = anonErr ? { error: anonErr.message, code: anonErr.code } : { ok: true, rows: anonTest?.length ?? 0 };
  } catch (e) { results.anonClient = { error: e.message }; }

  try {
    const { data: adminTest, error: adminErr } = await supabaseAdmin.from('users').select('id').limit(1);
    results.adminClient = adminErr ? { error: adminErr.message, code: adminErr.code } : { ok: true, rows: adminTest?.length ?? 0 };
  } catch (e) { results.adminClient = { error: e.message }; }

  try {
    const { data: tablesTest, error: tablesErr } = await supabaseAdmin.from('conversations').select('id').limit(1);
    results.conversationsTable = tablesErr ? { error: tablesErr.message, code: tablesErr.code } : { ok: true, rows: tablesTest?.length ?? 0 };
  } catch (e) { results.conversationsTable = { error: e.message }; }

  results.envCheck = {
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
    anonKeyPrefix: process.env.SUPABASE_ANON_KEY?.substring(0, 15) + '...',
    serviceKeyPrefix: process.env.SUPABASE_SERVICE_KEY?.substring(0, 15) + '...',
  };

  res.json(results);
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces for Render

app.listen(PORT, HOST, () => {
  logger.info(`🚀 Server running on ${HOST}:${PORT}`);
});

export default app;