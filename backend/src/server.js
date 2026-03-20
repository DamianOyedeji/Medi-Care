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