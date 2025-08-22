import { useMemo, useCallback } from 'react';

/**
 * Custom hook for managing RT client cache efficiently
 * Provides cache utilities and memory management
 */
export function useRTCache() {
  const cacheStats = useMemo(() => ({
    getMemoryUsage() {
      // Estimate memory usage of cache entries
      if (typeof window !== 'undefined' && window.performance?.memory) {
        return {
          used: Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(window.performance.memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(window.performance.memory.jsHeapSizeLimit / 1024 / 1024),
        };
      }
      return null;
    },
    
    shouldCleanCache(cacheSize, memoryPressure = false) {
      // Clean cache if we have too many entries or under memory pressure
      return cacheSize > 100 || memoryPressure;
    }
  }), []);

  const optimizeCache = useCallback((rtClientInstance) => {
    if (!rtClientInstance || typeof rtClientInstance.cleanCache !== 'function') {
      return;
    }

    try {
      const stats = rtClientInstance.getCacheStats?.();
      const memoryInfo = cacheStats.getMemoryUsage();
      
      // Clean expired entries
      const cleanedCount = rtClientInstance.cleanCache();
      
      // If we're using too much memory or have too many entries, clean more aggressively
      const shouldAgressiveClean = cacheStats.shouldCleanCache(
        stats?.totalEntries || 0,
        memoryInfo && memoryInfo.used > memoryInfo.limit * 0.8
      );
      
      if (shouldAgressiveClean) {
        // Force clean older entries by reducing cache expiry temporarily
        const originalExpiry = rtClientInstance.cacheExpiry;
        rtClientInstance.cacheExpiry = 6 * 60 * 60 * 1000; // 6 hours instead of 24
        rtClientInstance.cleanCache();
        rtClientInstance.cacheExpiry = originalExpiry;
      }
      
      return {
        cleaned: cleanedCount,
        memoryInfo,
        aggressive: shouldAgressiveClean
      };
    } catch (error) {
      console.warn('RT cache optimization failed:', error);
      return null;
    }
  }, [cacheStats]);

  return {
    optimizeCache,
    cacheStats
  };
}
