import { supabase } from '../config/supabase.js';
import { logger } from '../config/logger.js';

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

    // Check if user is active
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_active')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.is_active) {
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