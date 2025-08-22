/**
 * Enhanced logging utility for StreamPal
 * Provides structured logging with levels and production safety
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

class Logger {
  constructor(context = 'StreamPal') {
    this.context = context;
    this.level = import.meta.env.PROD ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG;
  }

  formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}] [${this.context}]`;
    
    if (data) {
      return { prefix, message, data };
    }
    return { prefix, message };
  }

  shouldLog(level) {
    return LOG_LEVELS[level] <= this.level;
  }

  error(message, data) {
    if (!this.shouldLog('ERROR')) return;
    
    const formatted = this.formatMessage('ERROR', message, data);
    if (data) {
      console.error(formatted.prefix, formatted.message, formatted.data);
    } else {
      console.error(formatted.prefix, formatted.message);
    }
  }

  warn(message, data) {
    if (!this.shouldLog('WARN')) return;
    
    const formatted = this.formatMessage('WARN', message, data);
    if (data) {
      console.warn(formatted.prefix, formatted.message, formatted.data);
    } else {
      console.warn(formatted.prefix, formatted.message);
    }
  }

  info(message, data) {
    if (!this.shouldLog('INFO')) return;
    
    const formatted = this.formatMessage('INFO', message, data);
    if (data) {
      console.info(formatted.prefix, formatted.message, formatted.data);
    } else {
      console.info(formatted.prefix, formatted.message);
    }
  }

  debug(message, data) {
    if (!this.shouldLog('DEBUG')) return;
    
    const formatted = this.formatMessage('DEBUG', message, data);
    if (data) {
      console.log(formatted.prefix, formatted.message, formatted.data);
    } else {
      console.log(formatted.prefix, formatted.message);
    }
  }

  trace(message, data) {
    if (!this.shouldLog('TRACE')) return;
    
    const formatted = this.formatMessage('TRACE', message, data);
    if (data) {
      console.trace(formatted.prefix, formatted.message, formatted.data);
    } else {
      console.trace(formatted.prefix, formatted.message);
    }
  }

  // Specialized logging methods
  api(method, url, status, duration) {
    const message = `${method} ${url} - ${status} (${duration}ms)`;
    if (status >= 400) {
      this.error(message);
    } else if (duration > 2000) {
      this.warn(message + ' - Slow response');
    } else {
      this.debug(message);
    }
  }

  cache(operation, key, hit = false) {
    const message = `Cache ${operation}: ${key}`;
    this.debug(message, { hit });
  }

  performance(name, duration, threshold = 1000) {
    const message = `Performance: ${name} took ${duration}ms`;
    if (duration > threshold) {
      this.warn(message + ` (exceeded ${threshold}ms threshold)`);
    } else {
      this.debug(message);
    }
  }

  // Create child logger with additional context
  child(additionalContext) {
    return new Logger(`${this.context}:${additionalContext}`);
  }
}

// Create default loggers
export const logger = new Logger();
export const apiLogger = logger.child('API');
export const rtLogger = logger.child('RT');
export const cacheLogger = logger.child('Cache');
export const perfLogger = logger.child('Performance');

// Legacy console replacement for gradual migration
export const console = {
  log: (...args) => logger.debug(...args),
  info: (...args) => logger.info(...args),
  warn: (...args) => logger.warn(...args),
  error: (...args) => logger.error(...args),
  debug: (...args) => logger.debug(...args),
  trace: (...args) => logger.trace(...args)
};
