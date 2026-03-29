import { supabase, supabaseAdmin } from '../config/supabase.js';
import { logger } from '../config/logger.js';

// ── In-memory cache for user active-status (avoids 2nd DB call on every request) ──
const activeCache = new Map();          // userId → { active, expiry }
const ACTIVE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedActive(userId) {
  const entry = activeCache.get(userId);
  if (entry && Date.now() < entry.expiry) return entry.active;
  activeCache.delete(userId);
  return undefined; // cache miss
}

function setCachedActive(userId, active) {
  activeCache.set(userId, { active, expiry: Date.now() + ACTIVE_CACHE_TTL });
  // Evict oldest entries when the cache grows too large
  if (activeCache.size > 500) {
    const oldest = activeCache.keys().next().value;
    activeCache.delete(oldest);
  }
}

/**
 * Middleware to verify JWT token and authenticate user
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn('Invalid token attempt', { 
        error: error?.message,
        ip: req.ip 
      });
      
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }

    // Check cache first to avoid a DB round-trip on every request
    const cachedActive = getCachedActive(user.id);
    if (cachedActive === true) {
      req.user = user;
      req.userId = user.id;
      return next();
    }
    if (cachedActive === false) {
      return res.status(403).json({ error: 'Forbidden', message: 'Account is inactive' });
    }

    // Cache miss — check if user is active (auto-create row if missing)
    let { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('is_active')
      .eq('id', user.id)
      .single();

    if (userError && userError.code === 'PGRST116') {
      // Row doesn't exist yet — create it so user isn't locked out
      supabaseAdmin.from('users').upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || null,
        is_active: true,
      }, { onConflict: 'id' }).catch(() => {}); // fire-and-forget
      userData = { is_active: true };
      userError = null;
    }

    const isActive = !userError && userData?.is_active;
    setCachedActive(user.id, isActive);

    if (!isActive) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Account is inactive'
      });
    }

    // Attach user to request object
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    logger.error('Authentication error', { error: error.message });
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for endpoints that can be accessed by both auth and non-auth users
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (!error && user) {
      req.user = user;
      req.userId = user.id;
    }

    next();
  } catch (error) {
    // Silent fail for optional auth
    next();
  }
};

export default authenticate;