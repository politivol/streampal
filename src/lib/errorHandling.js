/**
 * Enhanced error handling utilities for API calls
 * Provides consistent error handling, retry logic, and user-friendly messages
 */

export class APIError extends Error {
  constructor(message, status, code, details = {}) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT',
  INVALID_RESPONSE: 'INVALID_RESPONSE'
};

export const ERROR_MESSAGES = {
  [ERROR_CODES.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection.',
  [ERROR_CODES.RATE_LIMIT]: 'Too many requests. Please wait a moment and try again.',
  [ERROR_CODES.NOT_FOUND]: 'The requested content was not found.',
  [ERROR_CODES.UNAUTHORIZED]: 'Authentication required. Please sign in.',
  [ERROR_CODES.SERVER_ERROR]: 'Server error. Please try again later.',
  [ERROR_CODES.TIMEOUT]: 'Request timed out. Please try again.',
  [ERROR_CODES.INVALID_RESPONSE]: 'Invalid response from server.'
};

export function createAPIError(error, status = 500, context = {}) {
  let code = ERROR_CODES.SERVER_ERROR;
  let message = error.message || 'An unexpected error occurred';

  // Classify error based on status or error type
  if (status === 404) {
    code = ERROR_CODES.NOT_FOUND;
    message = ERROR_MESSAGES[code];
  } else if (status === 401 || status === 403) {
    code = ERROR_CODES.UNAUTHORIZED;
    message = ERROR_MESSAGES[code];
  } else if (status === 429) {
    code = ERROR_CODES.RATE_LIMIT;
    message = ERROR_MESSAGES[code];
  } else if (status >= 500) {
    code = ERROR_CODES.SERVER_ERROR;
    message = ERROR_MESSAGES[code];
  } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
    code = ERROR_CODES.NETWORK_ERROR;
    message = ERROR_MESSAGES[code];
  } else if (error.name === 'AbortError' || error.message.includes('timeout')) {
    code = ERROR_CODES.TIMEOUT;
    message = ERROR_MESSAGES[code];
  }

  return new APIError(message, status, code, {
    originalError: error.message,
    stack: error.stack,
    ...context
  });
}

export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry certain errors
      if (error instanceof APIError && 
          [ERROR_CODES.NOT_FOUND, ERROR_CODES.UNAUTHORIZED].includes(error.code)) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

export function withTimeout(promise, timeoutMs = 30000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
}

export async function safeAPICall(apiFunction, errorContext = {}) {
  try {
    return await apiFunction();
  } catch (error) {
    const apiError = createAPIError(error, error.status, errorContext);
    console.error('API Error:', apiError.toJSON());
    throw apiError;
  }
}

export function getErrorMessage(error) {
  if (error instanceof APIError) {
    return error.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}
