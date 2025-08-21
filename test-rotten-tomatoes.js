// Test the Rotten Tomatoes API as a potential fallback
import fetch from 'node-fetch';

async function testRottenTomatoesAPI() {
  console.log('🍅 Testing Rotten Tomatoes API as fallback...\n');
  
  const baseUrl = 'https://rotten-tomatoes-api.ue.r.appspot.com';
  
  const testMovies = [
    { name: 'The Dark Knight', expected: 'should have high scores' },
    { name: 'Inception', expected: 'popular Christopher Nolan film' },
    { name: 'Top Gun Maverick', expected: 'recent blockbuster' },
    { name: 'Bad Boys', expected: 'action comedy' }
  ];
  
  for (const movie of testMovies) {
    console.log(`\nTesting: ${movie.name}`);
    
    try {
      // Test single movie endpoint
      const movieUrl = `${baseUrl}/movie/${encodeURIComponent(movie.name.toLowerCase().replace(/\s+/g, '_'))}`;
      console.log(`   URL: ${movieUrl}`);
      
      const response = await fetch(movieUrl);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Success!`);
        console.log(`   Title: ${data.name}`);
        console.log(`   Year: ${data.year}`);
        console.log(`   🍅 Tomatometer: ${data.tomatometer}%`);
        console.log(`   👥 Audience Score: ${data.audience_score}%`);
        console.log(`   ⚖️  Weighted Score: ${data.weighted_score}%`);
        console.log(`   🎭 Genres: ${data.genres?.join(', ')}`);
        console.log(`   📝 Rating: ${data.rating}`);
        console.log(`   ⏱️  Duration: ${data.duration}`);
        
        if (data.actors?.length) {
          console.log(`   🎬 Top actors: ${data.actors.slice(0, 3).join(', ')}`);
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Failed: ${errorText}`);
        
        // Try search endpoint instead
        console.log(`   🔍 Trying search endpoint...`);
        const searchUrl = `${baseUrl}/search/${encodeURIComponent(movie.name.toLowerCase().replace(/\s+/g, '_'))}`;
        const searchResponse = await fetch(searchUrl);
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.movies?.length > 0) {
            const firstMovie = searchData.movies[0];
            console.log(`   ✅ Found via search: ${firstMovie.name} (${firstMovie.year})`);
            console.log(`   🍅 Tomatometer: ${firstMovie.tomatometer}%`);
            console.log(`   👥 Audience Score: ${firstMovie.audience_score}%`);
          } else {
            console.log(`   ❌ No movies found in search results`);
          }
        }
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n📊 Summary:');
  console.log('   - This API scrapes Rotten Tomatoes website directly');
  console.log('   - No API key required');
  console.log('   - Returns both tomatometer and audience scores');
  console.log('   - Includes additional metadata (year, genres, actors, etc.)');
  console.log('   - Could be used as fallback when OMDb API hits limits');
}

testRottenTomatoesAPI();
