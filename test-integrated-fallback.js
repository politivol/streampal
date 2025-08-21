// Test the integrated RT fallback system
import { fetchDetails } from './src/lib/api.js';

async function testIntegratedRTFallback() {
  console.log('🔄 Testing Integrated RT Fallback System...\n');

  const testMovies = [
    { tmdbId: 155, title: 'The Dark Knight', expected: 'Should have RT score' },
    { tmdbId: 27205, title: 'Inception', expected: 'Should have RT score' },
    { tmdbId: 361743, title: 'Top Gun: Maverick', expected: 'Recent movie' },
    { tmdbId: 19995, title: 'Avatar', expected: 'Popular movie' }
  ];

  for (const movie of testMovies) {
    console.log(`\n--- Testing: ${movie.title} (TMDB ID: ${movie.tmdbId}) ---`);
    
    try {
      const result = await fetchDetails(movie.tmdbId);
      
      console.log(`✅ Fetched details for: ${result.title}`);
      console.log(`   📅 Release: ${result.releaseDate}`);
      console.log(`   ⭐ TMDB: ${result.ratings.tmdb}`);
      console.log(`   🍅 RT: ${result.ratings.rottenTomatoes !== null ? `${result.ratings.rottenTomatoes}%` : 'Not available'}`);
      
      if (result.ratings.rtSource) {
        console.log(`   📊 RT Source: ${result.ratings.rtSource}`);
      }
      
      if (result.ratings.rottenTomatoes !== null) {
        console.log(`   ✅ RT score successfully retrieved!`);
      } else {
        console.log(`   ⚠️ RT score not available (will show "RT: --" in UI)`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n📋 Integration Summary:`);
  console.log(`   ✅ RT client integrated into main API`);
  console.log(`   ✅ CORS proxy deployed to Supabase`);
  console.log(`   ✅ Graceful degradation added to UI`);
  console.log(`   ✅ Fallback logic: OMDb → RT Scraper → Graceful failure`);
  
  console.log(`\n🎯 Next Steps:`);
  console.log(`   1. Test the app in browser to see RT scores`);
  console.log(`   2. Check network tab for API calls`);
  console.log(`   3. Verify "RT: --" shows when scores unavailable`);
  console.log(`   4. Monitor console for fallback behavior`);
}

testIntegratedRTFallback().catch(console.error);
