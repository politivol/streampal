/**
 * Development configuration for local testing
 * Handles CORS issues and provides fallbacks for unavailable services
 */

const isDevelopment = import.meta.env.DEV;
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const devConfig = {
  // Disable RT proxy in local development to prevent CORS errors
  useRTProxy: !isDevelopment || !isLocalhost,
  
  // Mock RT scores for development when proxy is unavailable
  mockRTScores: isDevelopment && isLocalhost,
  
  // Enhanced logging in development
  verboseLogging: isDevelopment,
  
  // Graceful degradation for missing services
  gracefulDegradation: true,
  
  // Development API timeouts (shorter for faster feedback)
  apiTimeout: isDevelopment ? 5000 : 30000,
  
  // Mock data for testing when APIs are unavailable
  useMockData: false // Set to true if you want to test with mock data
};

// Mock RT scores for development testing
export const mockRTData = {
  'inception': { tomatometer: 87, audience_score: 91 },
  'avatar': { tomatometer: 82, audience_score: 83 },
  'the matrix': { tomatometer: 88, audience_score: 85 },
  'interstellar': { tomatometer: 72, audience_score: 86 },
  'avengers': { tomatometer: 91, audience_score: 91 },
  'default': { tomatometer: 75, audience_score: 80 }
};

export function getMockRTScore(title) {
  if (!devConfig.mockRTScores) return null;
  
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const found = Object.keys(mockRTData).find(key => 
    cleanTitle.includes(key) || key.includes(cleanTitle)
  );
  
  return found ? mockRTData[found] : mockRTData.default;
}

// Development error handler that doesn't spam console
export function handleDevError(error, context = '') {
  if (!isDevelopment) return;
  
  // Filter out expected CORS errors in development
  if (error.message?.includes('CORS') || 
      error.message?.includes('blocked') ||
      error.message?.includes('invalid_request')) {
    console.warn(`🔧 Dev Warning [${context}]:`, error.message.split('\n')[0]);
    return;
  }
  
  console.error(`🚨 Dev Error [${context}]:`, error);
}

// Development performance tracker
export function logDevPerformance(operation, duration) {
  if (!isDevelopment || !devConfig.verboseLogging) return;
  
  const emoji = duration > 2000 ? '🐌' : duration > 1000 ? '⚠️' : '✅';
  console.log(`${emoji} Dev Perf: ${operation} took ${duration}ms`);
}
