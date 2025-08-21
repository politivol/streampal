// Complete RT scraper implementation for production use
import config from './config.js';

const RT_PROXY_URL = config.rtProxyUrl;
const SB_ANON = config.supabaseAnonKey;

class RottenTomatoesClient {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    this.requestDelay = 1000; // 1 second between requests
    this.lastRequestTime = 0;
  }

  // Rate limiting
  async waitForRateLimit() {
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.requestDelay) {
      await new Promise(resolve => setTimeout(resolve, this.requestDelay - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

  // Clean movie title for search
  cleanTitle(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Cache management
  getCacheKey(title, year) {
    return `${this.cleanTitle(title)}_${year || 'no_year'}`;
  }

  getFromCache(title, year) {
    const cacheKey = this.getCacheKey(title, year);
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < this.cacheExpiry)) {
      return cached.data;
    }
    
    return null;
  }

  setCache(title, year, data) {
    const cacheKey = this.getCacheKey(title, year);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  // Fetch with proxy
  async fetchWithProxy(url) {
    if (!RT_PROXY_URL) {
      throw new Error('RT proxy not configured');
    }

    const proxyUrl = `${RT_PROXY_URL}?url=${encodeURIComponent(url)}`;
    const headers = {};
    
    if (SB_ANON) {
      headers.apikey = SB_ANON;
      headers.Authorization = `Bearer ${SB_ANON}`;
    }

    const response = await fetch(proxyUrl, { headers });
    
    if (!response.ok) {
      throw new Error(`Proxy request failed: ${response.status} ${response.statusText}`);
    }
    
    return response.text();
  }

  // Parse RT scores from HTML
  parseScores(html, title) {
    try {
      const scores = {
        tomatometer: null,
        audience_score: null,
        found: false
      };

      // Multiple patterns to catch different RT page layouts
      const tomatometerPatterns = [
        /score-board__tomatometer[^>]*>[\s\S]*?(\d+)%/i,
        /tomatometer[^>]*>[\s\S]*?(\d+)%/i,
        /"tomatometer":\s*(\d+)/i,
        /critics-score[^>]*>[\s\S]*?(\d+)%/i
      ];

      const audiencePatterns = [
        /score-board__audience[^>]*>[\s\S]*?(\d+)%/i,
        /audience[^>]*>[\s\S]*?(\d+)%/i,
        /"audienceScore":\s*(\d+)/i,
        /popcorn[^>]*>[\s\S]*?(\d+)%/i
      ];

      // Try to find tomatometer score
      for (const pattern of tomatometerPatterns) {
        const match = html.match(pattern);
        if (match) {
          scores.tomatometer = parseInt(match[1]);
          scores.found = true;
          break;
        }
      }

      // Try to find audience score
      for (const pattern of audiencePatterns) {
        const match = html.match(pattern);
        if (match) {
          scores.audience_score = parseInt(match[1]);
          scores.found = true;
          break;
        }
      }

      if (scores.found) {
        console.log(`✅ Parsed RT scores for "${title}": Critics ${scores.tomatometer}%, Audience ${scores.audience_score}%`);
      } else {
        console.log(`⚠️ No RT scores found in HTML for "${title}"`);
      }

      return scores;

    } catch (error) {
      console.error('Error parsing RT scores:', error);
      return { tomatometer: null, audience_score: null, found: false };
    }
  }

  // Search for movie on RT
  async searchMovie(title, year = null) {
    try {
      await this.waitForRateLimit();

      let searchQuery = this.cleanTitle(title);
      if (year) {
        searchQuery += ` ${year}`;
      }

      const searchUrl = `https://www.rottentomatoes.com/search?search=${encodeURIComponent(searchQuery)}`;
      console.log(`🔍 Searching RT: ${searchUrl}`);

      const html = await this.fetchWithProxy(searchUrl);

      // Look for movie links in search results
      const movieLinkPatterns = [
        /href="(\/m\/[^"]+)"/g,
        /href="(\/tv\/[^"]+)"/g
      ];

      const links = [];
      for (const pattern of movieLinkPatterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          links.push(match[1]);
        }
      }

      if (links.length > 0) {
        // Return the first valid movie link
        const moviePath = links[0];
        const fullUrl = `https://www.rottentomatoes.com${moviePath}`;
        console.log(`✅ Found RT movie page: ${fullUrl}`);
        return fullUrl;
      }

      console.log(`❌ No movie found on RT for: ${title}`);
      return null;

    } catch (error) {
      console.error('RT search error:', error);
      return null;
    }
  }

  // Get RT scores for a movie
  async getScores(title, year = null) {
    try {
      console.log(`🍅 Getting RT scores for: ${title}${year ? ` (${year})` : ''}`);

      // Check cache first
      const cached = this.getFromCache(title, year);
      if (cached) {
        console.log(`🔄 Using cached RT data for: ${title}`);
        return cached;
      }

      // Search for the movie
      const movieUrl = await this.searchMovie(title, year);
      if (!movieUrl) {
        return null;
      }

      // Fetch movie page
      await this.waitForRateLimit();
      const html = await this.fetchWithProxy(movieUrl);

      // Parse scores
      const scores = this.parseScores(html, title);

      if (scores.found) {
        // Cache the result
        this.setCache(title, year, {
          tomatometer: scores.tomatometer,
          audience_score: scores.audience_score,
          url: movieUrl,
          source: 'scraped',
          timestamp: Date.now()
        });

        return {
          tomatometer: scores.tomatometer,
          audience_score: scores.audience_score,
          url: movieUrl,
          source: 'scraped'
        };
      }

      return null;

    } catch (error) {
      console.error('RT scraper error:', error);
      return null;
    }
  }

  // Clean expired cache entries
  cleanCache() {
    const now = Date.now();
    const keysToDelete = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if ((now - entry.timestamp) >= this.cacheExpiry) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`🧹 Cleaned ${keysToDelete.length} expired RT cache entries`);
    }
    
    return keysToDelete.length;
  }

  // Get cache statistics
  getCacheStats() {
    const now = Date.now();
    const validEntries = Array.from(this.cache.values())
      .filter(entry => (now - entry.timestamp) < this.cacheExpiry);
    
    return {
      totalEntries: this.cache.size,
      validEntries: validEntries.length,
      expiredEntries: this.cache.size - validEntries.length,
      hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0
    };
  }
}

// Export singleton instance
export const rtClient = new RottenTomatoesClient();

// Export the class for testing
export { RottenTomatoesClient };
