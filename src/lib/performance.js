/**
 * Performance monitoring utilities for StreamPal
 * Tracks API response times, cache hit rates, and component render performance
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.isProduction = import.meta.env.PROD;
  }

  startTimer(name) {
    if (this.isProduction) return { end: () => {} };
    
    const startTime = performance.now();
    return {
      end: () => {
        const duration = performance.now() - startTime;
        this.recordMetric(name, duration);
        return duration;
      }
    };
  }

  recordMetric(name, value, unit = 'ms') {
    if (this.isProduction) return;

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const measurements = this.metrics.get(name);
    measurements.push({ value, timestamp: Date.now(), unit });
    
    // Keep only last 100 measurements to prevent memory leaks
    if (measurements.length > 100) {
      measurements.shift();
    }
  }

  getStats(name) {
    if (this.isProduction) return null;

    const measurements = this.metrics.get(name);
    if (!measurements || measurements.length === 0) return null;

    const values = measurements.map(m => m.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return {
      name,
      count: values.length,
      average: Math.round(avg * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      unit: measurements[0]?.unit || 'ms'
    };
  }

  getAllStats() {
    if (this.isProduction) return {};

    const stats = {};
    for (const name of this.metrics.keys()) {
      stats[name] = this.getStats(name);
    }
    return stats;
  }

  // Log slow operations
  warnIfSlow(name, duration, threshold = 1000) {
    if (this.isProduction) return;

    if (duration > threshold) {
      console.warn(`⚠️ Slow operation detected: ${name} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
    }
  }

  // Monitor API calls
  async measureAPICall(name, apiCall) {
    const timer = this.startTimer(`api_${name}`);
    try {
      const result = await apiCall();
      const duration = timer.end();
      this.warnIfSlow(`api_${name}`, duration, 2000); // 2s threshold for API calls
      return result;
    } catch (error) {
      timer.end();
      this.recordMetric(`api_${name}_error`, 1, 'count');
      throw error;
    }
  }

  // Monitor cache performance
  recordCacheHit(cacheName) {
    this.recordMetric(`cache_${cacheName}_hit`, 1, 'count');
  }

  recordCacheMiss(cacheName) {
    this.recordMetric(`cache_${cacheName}_miss`, 1, 'count');
  }

  getCacheHitRate(cacheName) {
    const hits = this.metrics.get(`cache_${cacheName}_hit`) || [];
    const misses = this.metrics.get(`cache_${cacheName}_miss`) || [];
    
    const totalHits = hits.reduce((sum, h) => sum + h.value, 0);
    const totalMisses = misses.reduce((sum, m) => sum + m.value, 0);
    const total = totalHits + totalMisses;
    
    return total > 0 ? totalHits / total : 0;
  }

  // Export performance data for debugging
  exportData() {
    if (this.isProduction) return null;

    return {
      timestamp: new Date().toISOString(),
      stats: this.getAllStats(),
      cacheHitRates: this.getCacheHitRates(),
      memoryUsage: this.getMemoryUsage()
    };
  }

  getCacheHitRates() {
    const cacheNames = new Set();
    for (const key of this.metrics.keys()) {
      if (key.includes('cache_') && (key.includes('_hit') || key.includes('_miss'))) {
        const cacheName = key.replace(/cache_(.+)_(hit|miss)/, '$1');
        cacheNames.add(cacheName);
      }
    }

    const rates = {};
    for (const cacheName of cacheNames) {
      rates[cacheName] = this.getCacheHitRate(cacheName);
    }
    return rates;
  }

  getMemoryUsage() {
    if (typeof window !== 'undefined' && window.performance?.memory) {
      return {
        used: Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(window.performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(window.performance.memory.jsHeapSizeLimit / 1024 / 1024),
      };
    }
    return null;
  }

  // Clear old metrics to prevent memory leaks
  cleanup() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const [name, measurements] of this.metrics.entries()) {
      const filtered = measurements.filter(m => m.timestamp > oneHourAgo);
      if (filtered.length === 0) {
        this.metrics.delete(name);
      } else {
        this.metrics.set(name, filtered);
      }
    }
  }
}

// Global instance
export const perfMonitor = new PerformanceMonitor();

// Auto-cleanup every 30 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    perfMonitor.cleanup();
  }, 30 * 60 * 1000);
}

// Development helpers
if (!import.meta.env.PROD && typeof window !== 'undefined') {
  window.perfMonitor = perfMonitor;
  window.getPerformanceReport = () => {
    console.log('📊 StreamPal Performance Report');
    console.log('================================');
    const data = perfMonitor.exportData();
    console.table(data.stats);
    console.log('Cache Hit Rates:', data.cacheHitRates);
    console.log('Memory Usage:', data.memoryUsage);
    return data;
  };
}
