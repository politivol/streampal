// Complete RT scraper implementation for production use
import config from './config.js';
import { perfMonitor } from './performance.js';
import { devConfig, getMockRTScore, handleDevError } from './devConfig.js';

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
      perfMonitor.recordCacheHit('rt_scraper');
      return cached.data;
    }
    
    perfMonitor.recordCacheMiss('rt_scraper');
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
      console.error('❌ RT proxy not configured - RT_PROXY_URL is missing');
      throw new Error('RT proxy not configured');
    }

    console.log(`🔗 RT Proxy URL: ${RT_PROXY_URL}`);
    const proxyUrl = `${RT_PROXY_URL}?url=${encodeURIComponent(url)}`;
    const headers = {};
    
    if (SB_ANON) {
      headers.apikey = SB_ANON;
      headers.Authorization = `Bearer ${SB_ANON}`;
      console.log(`🔑 Using Supabase auth headers`);
    } else {
      console.warn('⚠️ No Supabase auth key available');
    }

    console.log(`📡 Fetching: ${proxyUrl}`);
    const response = await fetch(proxyUrl, { headers });
    
    if (!response.ok) {
      console.error(`❌ RT Proxy failed: ${response.status} ${response.statusText}`);
      console.error(`📍 URL attempted: ${proxyUrl}`);
      console.error(`🔑 Headers used:`, headers);
      
      // Try to get response body for more details
      try {
        const errorBody = await response.text();
        console.error(`📝 Error response body:`, errorBody);
      } catch (e) {
        console.error(`❌ Could not read error response body`);
      }
      
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

      console.log(`🔍 Parsing RT scores for: ${title}`);

      // Priority 1: score-board element attributes (most reliable method)
      const scoreBoardRegex = /<score-board[^>]*>/i;
      const scoreBoardMatch = html.match(scoreBoardRegex);
      
      if (scoreBoardMatch) {
        console.log(`✅ Found score-board element for "${title}"`);
        
        // Extract tomatometer score from attributes
        const tomatometerAttr = scoreBoardMatch[0].match(/tomatometerscore="(\d+)"/i);
        if (tomatometerAttr) {
          const score = parseInt(tomatometerAttr[1]);
          if (score >= 0 && score <= 100) {
            scores.tomatometer = score;
            scores.found = true;
            console.log(`🍅 Tomatometer from score-board: ${score}%`);
          }
        }
        
        // Extract audience score from attributes
        const audienceAttr = scoreBoardMatch[0].match(/audiencescore="(\d+)"/i);
        if (audienceAttr) {
          const score = parseInt(audienceAttr[1]);
          if (score >= 0 && score <= 100) {
            scores.audience_score = score;
            scores.found = true;
            console.log(`👥 Audience from score-board: ${score}%`);
          }
        }

        // If score-board method worked, return early (most reliable)
        if (scores.found && (scores.tomatometer !== null || scores.audience_score !== null)) {
          console.log(`✅ Using score-board attributes for "${title}" - reliable method`);
          return scores;
        }
      }

      console.log(`⚠️ No score-board element found for "${title}", falling back to JSON/HTML parsing`);

      // Priority 2: JSON patterns (more reliable than HTML snippets)
      const jsonTomatometer = html.match(/"tomatometer":\s*(\d+)/i);
      if (jsonTomatometer) {
        const score = parseInt(jsonTomatometer[1]);
        if (score >= 0 && score <= 100 && score !== 99) {
          scores.tomatometer = score;
          scores.found = true;
          console.log(`📊 Tomatometer from JSON: ${score}%`);
        } else if (score === 99) {
          console.log(`⚠️ Skipping suspicious 99% JSON tomatometer for "${title}"`);
        }
      }

      const jsonAudience = html.match(/"audienceScore":\s*(\d+)/i);
      if (jsonAudience) {
        const score = parseInt(jsonAudience[1]);
        if (score >= 0 && score <= 100 && score !== 99) {
          scores.audience_score = score;
          scores.found = true;
          console.log(`📊 Audience from JSON: ${score}%`);
        } else if (score === 99) {
          console.log(`⚠️ Skipping suspicious 99% JSON audience for "${title}"`);
        }
      }

      // Priority 3: HTML class patterns (fallback, more prone to promotional content)
      if (scores.tomatometer === null || scores.audience_score === null) {
        const tomatometerHtmlPatterns = [
          /tomatometer[^>]*>[\s\S]*?(\d+)%/i,
          /score-board__tomatometer[^>]*>[\s\S]*?(\d+)%/i,
          /critics-score[^>]*>[\s\S]*?(\d+)%/i
        ];

        const audienceHtmlPatterns = [
          /audience-score[^>]*>[\s\S]*?(\d+)%/i,
          /score-board__audience[^>]*>[\s\S]*?(\d+)%/i,
          /popcorn[^>]*>[\s\S]*?(\d+)%/i
        ];

        // Try HTML patterns with more filtering to avoid promotional content
        for (const pattern of tomatometerHtmlPatterns) {
          if (scores.tomatometer !== null) break;
          const matches = [...html.matchAll(new RegExp(pattern.source, 'gi'))];

          if (matches.length >= 2) {
            // Use the second match - first is often promotional
            const score = parseInt(matches[1][1]);
            if (score >= 0 && score <= 100 && score !== 99) {
              scores.tomatometer = score;
              scores.found = true;
              console.log(`🍅 Tomatometer from HTML (2nd match): ${score}%`);
              break;
            } else if (score === 99) {
              console.log(`⚠️ Skipping suspicious 99% tomatometer score for "${title}"`);
            }
          } else if (matches.length === 1) {
            const score = parseInt(matches[0][1]);
            // Be more restrictive with single matches to avoid promotional content
            if (score >= 0 && score <= 100 && score !== 99 && score !== 100) {
              scores.tomatometer = score;
              scores.found = true;
              console.log(`🍅 Tomatometer from HTML (single): ${score}%`);
              break;
            } else {
              console.log(`⚠️ Skipping ${score}% tomatometer score for "${title}" (likely promotional)`);
            }
          }
        }

        for (const pattern of audienceHtmlPatterns) {
          if (scores.audience_score !== null) break;
          const match = html.match(pattern);
          if (match) {
            const score = parseInt(match[1]);
            // Be more restrictive to avoid promotional content
            if (score >= 0 && score <= 100 && score !== 99) {
              scores.audience_score = score;
              scores.found = true;
              console.log(`👥 Audience from HTML: ${score}%`);
              break;
            } else if (score === 99) {
              console.log(`⚠️ Skipping suspicious 99% audience score for "${title}"`);
            }
          }
        }
      }

      if (scores.found) {
        console.log(`✅ Final RT scores for "${title}": Critics ${scores.tomatometer}%, Audience ${scores.audience_score}%`);
      } else {
        console.log(`❌ No valid RT scores found for "${title}"`);
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
      // Use fresh RegExp objects/matchAll to avoid leaking lastIndex state
      const movieLinkPatterns = [
        /href="(\/m\/[^"]+)"/gi,
        /href="(\/tv\/[^"]+)"/gi
      ];

      const links = [];
      for (const pattern of movieLinkPatterns) {
        const matches = [...html.matchAll(pattern)];
        for (const match of matches) {
          links.push(match[1]);
        }
      }

      // Try to find the best match based on title
      const cleanedTitle = this.cleanTitle(title);
      let bestMatch = null;
      
      for (const link of links) {
        // Extract the movie name from the link (e.g., /m/inception -> inception)
        const movieName = link.replace(/^\/[^\/]+\//, '').replace(/_/g, ' ');
        
        // Check if this movie name matches our search
        if (movieName.includes(cleanedTitle) || cleanedTitle.includes(movieName)) {
          bestMatch = link;
          break;
        }
      }

      // If no exact match, try a fallback approach: construct the URL directly
      if (!bestMatch && links.length === 0) {
        // Try constructing a direct URL based on the movie title
        const slugTitle = this.cleanTitle(title).replace(/\s+/g, '_').toLowerCase();
        const directUrl = `https://www.rottentomatoes.com/m/${slugTitle}`;
        console.log(`🎯 Trying direct URL approach: ${directUrl}`);
        
        // Test if this URL exists by fetching it
        try {
          await this.waitForRateLimit();
          const testHtml = await this.fetchWithProxy(directUrl);
          
          // Check if this is a valid movie page (contains score elements)
          if (testHtml.includes('tomatometer') || testHtml.includes('critics-score')) {
            console.log(`✅ Direct URL works: ${directUrl}`);
            return directUrl;
          }
        } catch (error) {
          console.log(`❌ Direct URL failed: ${error.message}`);
        }
      }

      if (bestMatch) {
        const fullUrl = `https://www.rottentomatoes.com${bestMatch}`;
        console.log(`✅ Found RT movie page: ${fullUrl}`);
        return fullUrl;
      } else if (links.length > 0) {
        // Fallback to first result if no good match
        const fullUrl = `https://www.rottentomatoes.com${links[0]}`;
        console.log(`⚠️ Using first search result: ${fullUrl}`);
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
    return perfMonitor.measureAPICall('rt_scraper', async () => {
      try {
        console.log(`🍅 Getting RT scores for: ${title}${year ? ` (${year})` : ''}`);

        // Check cache first
        const cached = this.getFromCache(title, year);
        if (cached) {
          console.log(`🔄 Using cached RT data for: ${title}`);
          return cached;
        }

        // In development without RT proxy, use mock data
        if (devConfig.mockRTScores && !RT_PROXY_URL) {
          const mockScore = getMockRTScore(title);
          if (mockScore) {
            console.log(`🎭 Using mock RT data for development: ${title}`);
            this.setCache(title, year, {
              ...mockScore,
              url: `https://www.rottentomatoes.com/m/${title.toLowerCase().replace(/\s+/g, '_')}`,
              source: 'mock',
              timestamp: Date.now()
            });
            return mockScore;
          }
        }

        // Skip RT scraping if proxy is not available (development)
        if (!RT_PROXY_URL) {
          console.warn(`⚠️ RT proxy not configured - skipping RT scraping for: ${title}`);
          return null;
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
        handleDevError(error, 'RT Scraper');
        return null;
      }
    });
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
