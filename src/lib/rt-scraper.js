// Rotten Tomatoes web scraper for JavaScript
// This is a proof-of-concept - actual implementation would need CORS proxy

class RottenTomatoesScraper {
  constructor() {
    this.baseUrl = 'https://www.rottentomatoes.com';
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  // Clean movie title for URL
  cleanTitle(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/^the_/, '') // Remove leading "the_"
      .trim();
  }

  // Check if cached data is still valid
  isCacheValid(cacheEntry) {
    return Date.now() - cacheEntry.timestamp < this.cacheExpiry;
  }

  // Get from cache if available and valid
  getFromCache(title) {
    const cacheKey = this.cleanTitle(title);
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      console.log(`🔄 Using cached data for: ${title}`);
      return cached.data;
    }
    
    return null;
  }

  // Store in cache
  setCache(title, data) {
    const cacheKey = this.cleanTitle(title);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  // Parse RT scores from HTML (this would need actual implementation)
  parseRTScores(html) {
    // This is a simplified example - real implementation would need
    // proper HTML parsing and handling of RT's dynamic content
    
    try {
      // Look for tomatometer score
      const tomatometerMatch = html.match(/tomatometer[^>]*>(\d+)%/i);
      const audienceMatch = html.match(/audience[^>]*>(\d+)%/i);
      
      return {
        tomatometer: tomatometerMatch ? parseInt(tomatometerMatch[1]) : null,
        audience_score: audienceMatch ? parseInt(audienceMatch[1]) : null,
        source: 'scraped',
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error parsing RT scores:', error);
      return null;
    }
  }

  // Search for movie and get RT URL
  async searchMovie(title) {
    try {
      // This would need a CORS proxy in production
      const searchUrl = `${this.baseUrl}/search?search=${encodeURIComponent(title)}`;
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Parse search results to find the first movie match
      const movieLinkMatch = html.match(/href="(\/m\/[^"]+)"/);
      
      if (movieLinkMatch) {
        return `${this.baseUrl}${movieLinkMatch[1]}`;
      }
      
      return null;
    } catch (error) {
      console.error('RT search error:', error);
      return null;
    }
  }

  // Main method to get RT scores
  async getScores(title, year = null) {
    try {
      console.log(`🍅 Fetching RT scores for: ${title}`);
      
      // Check cache first
      const cached = this.getFromCache(title);
      if (cached) {
        return cached;
      }

      // Search for the movie
      const movieUrl = await this.searchMovie(title);
      if (!movieUrl) {
        console.log(`❌ Movie not found on RT: ${title}`);
        return null;
      }

      console.log(`🔍 Found RT URL: ${movieUrl}`);

      // Fetch movie page
      const response = await fetch(movieUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch movie page: ${response.status}`);
      }

      const html = await response.text();
      const scores = this.parseRTScores(html);

      if (scores) {
        console.log(`✅ RT scores found: ${scores.tomatometer}% / ${scores.audience_score}%`);
        this.setCache(title, scores);
      }

      return scores;

    } catch (error) {
      console.error('RT scraper error:', error);
      return null;
    }
  }

  // Get cache stats
  getCacheStats() {
    const validEntries = Array.from(this.cache.values())
      .filter(entry => this.isCacheValid(entry));
    
    return {
      totalEntries: this.cache.size,
      validEntries: validEntries.length,
      expiredEntries: this.cache.size - validEntries.length
    };
  }

  // Clear expired cache entries
  cleanCache() {
    const keysToDelete = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isCacheValid(entry)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    console.log(`🧹 Cleaned ${keysToDelete.length} expired cache entries`);
  }
}

// Example usage and testing
async function testRTScraper() {
  console.log('🕷️ Testing RT Scraper...\n');
  
  const scraper = new RottenTomatoesScraper();
  
  const testMovies = [
    'The Dark Knight',
    'Inception', 
    'Top Gun Maverick',
    'Avatar'
  ];

  for (const movie of testMovies) {
    console.log(`\n--- Testing: ${movie} ---`);
    
    try {
      const scores = await scraper.getScores(movie);
      
      if (scores) {
        console.log(`🍅 Tomatometer: ${scores.tomatometer}%`);
        console.log(`👥 Audience: ${scores.audience_score}%`);
      } else {
        console.log(`❌ No scores found for ${movie}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Show cache stats
  console.log('\n📊 Cache Stats:', scraper.getCacheStats());
}

export { RottenTomatoesScraper };

// Note: This is a proof of concept. In production, you would need:
// 1. A CORS proxy server to bypass CORS restrictions
// 2. More robust HTML parsing (using DOMParser or jsdom)
// 3. Better error handling and retry logic
// 4. Rate limiting to avoid being blocked
// 5. User-Agent rotation
// 6. Handling of RT's anti-bot measures

if (typeof window === 'undefined') {
  // Running in Node.js for testing
  testRTScraper().catch(console.error);
}
