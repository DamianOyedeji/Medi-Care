import winston from 'winston';
import { existsSync, mkdirSync } from 'fs';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const isProduction = process.env.NODE_ENV === 'production';

// Create logs directory BEFORE logger tries to write (only in dev)
if (!isProduction && !existsSync('logs')) {
  mkdirSync('logs');
}

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  // Add metadata if present
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  // Add stack trace for errors
  if (stack) {
    msg += `\n${stack}`;
  }
  
  return msg;
});

// Build transports — console always, file transports only in dev
const transports = [
  new winston.transports.Console({
    format: combine(
      colorize(),
      logFormat
    )
  }),
];

if (!isProduction) {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports
});