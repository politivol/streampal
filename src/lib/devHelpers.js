/**
 * Development console helpers and initialization
 */

export function initDevHelpers() {
  // Only run in development environment
  if (!import.meta.env.DEV) return;

  try {
    console.log(`
🚀 StreamPal Development Mode Active!

📋 Quick Start Guide:
┌─────────────────────────────────────────────────┐
│ 🔍 Expected Console Warnings in Local Dev:     │
│   • CORS errors for RT/OMDB proxies ✅        │
│   • Google Auth 400 errors ✅                 │
│   • These are normal in localhost! 😊         │
└─────────────────────────────────────────────────┘

🛠️ Available Dev Tools:
• getPerformanceReport() - Performance metrics
• window.perfMonitor - Live performance data  
• window.devConfig - Development configuration

🎭 Mock Data:
• RT scores will use mock data when proxies fail
• Try searching: "Inception", "Avatar", "Matrix"

💡 Tips:
• Check the Dev Status indicator (bottom right)
• CORS errors are expected and handled gracefully
• Mock RT scores are enabled for testing

📚 For production deployment:
• Configure CORS for your domain in Supabase
• Set up Google OAuth redirect URIs
• All proxies will work correctly
    `);

    // Make dev tools globally available
    window.devConfig = import('./devConfig.js').then(m => m.devConfig);
    
    // Add helpful dev commands
    window.clearRTCache = () => {
      localStorage.removeItem('rt_cache');
      sessionStorage.clear();
      console.log('🧹 Cleared RT cache and session storage');
    };

    window.testErrorHandling = () => {
      throw new Error('Test error for development');
    };

    window.toggleMockData = async () => {
      const { devConfig } = await import('./devConfig.js');
      devConfig.mockRTScores = !devConfig.mockRTScores;
      console.log(`🎭 Mock RT scores: ${devConfig.mockRTScores ? 'ON' : 'OFF'}`);
    };
  } catch (error) {
    // Silently fail in production or if there are import errors
    console.warn('DevHelpers initialization failed:', error.message);
  }
}
