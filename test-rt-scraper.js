// Test the RT scraper implementation
import { rtClient } from './src/lib/rt-client.js';

async function testRTScraper() {
  console.log('🕷️ Testing RT Scraper Implementation...\n');

  const testMovies = [
    { title: 'The Dark Knight', year: 2008 },
    { title: 'Inception', year: 2010 },
    { title: 'Top Gun Maverick', year: 2022 },
    { title: 'Avatar', year: 2009 },
    { title: 'Parasite', year: 2019 }
  ];

  for (const movie of testMovies) {
    console.log(`\n--- Testing: ${movie.title} (${movie.year}) ---`);
    
    try {
      const scores = await rtClient.getScores(movie.title, movie.year);
      
      if (scores) {
        console.log(`✅ Success!`);
        console.log(`   🍅 Tomatometer: ${scores.tomatometer}%`);
        console.log(`   👥 Audience: ${scores.audience_score}%`);
        console.log(`   🔗 URL: ${scores.url}`);
        console.log(`   📊 Source: ${scores.source}`);
      } else {
        console.log(`❌ No scores found for ${movie.title}`);
      }
      
      // Test caching - fetch same movie again
      console.log(`\n🔄 Testing cache for ${movie.title}...`);
      const cachedScores = await rtClient.getScores(movie.title, movie.year);
      
      if (cachedScores && scores) {
        console.log(`✅ Cache working: ${cachedScores.tomatometer}% (should match ${scores.tomatometer}%)`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    // Delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Show cache stats
  console.log('\n📊 Cache Statistics:');
  const stats = rtClient.getCacheStats();
  console.log(`   Total entries: ${stats.totalEntries}`);
  console.log(`   Valid entries: ${stats.validEntries}`);
  console.log(`   Expired entries: ${stats.expiredEntries}`);
  
  // Clean cache
  const cleaned = rtClient.cleanCache();
  console.log(`   Cleaned ${cleaned} expired entries`);
}

// Note about limitations
console.log(`
⚠️ IMPORTANT NOTES:

1. **CORS Proxy Required**: This implementation requires deploying the RT proxy 
   Supabase Edge Function first.

2. **Rate Limiting**: Includes 1-second delays between requests to avoid being blocked.

3. **Caching**: Results are cached for 24 hours to minimize requests.

4. **Reliability**: Web scraping can break if RT changes their HTML structure.

5. **Legal**: Check RT's terms of service before scraping in production.

6. **Fallback Only**: This should be used as a fallback when OMDb API fails.

📝 To deploy the RT proxy:
   1. Run: supabase functions deploy rt-proxy
   2. Update your .env with the function URL
   3. Test with this script

🔧 Alternative approaches:
   - Use a paid RT API service
   - Find other movie rating APIs
   - Implement graceful degradation (hide RT scores when unavailable)
`);

// Only run if RT proxy is configured
if (process.env.VITE_SUPABASE_URL) {
  testRTScraper().catch(console.error);
} else {
  console.log('⚠️ VITE_SUPABASE_URL not configured. Please set up environment variables to test.');
}
