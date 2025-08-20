// Test script to verify OMDB proxy functionality
async function testOMDBIntegration() {
  console.log('🍅 Testing OMDB Integration for Rotten Tomatoes...\n');
  
  // First, test configuration
  console.log('1. Checking environment configuration:');
  console.log(`   VITE_OMDB_PROXY_URL: ${import.meta.env.VITE_OMDB_PROXY_URL || 'NOT SET'}`);
  console.log(`   VITE_SUPABASE_ANON_KEY: ${import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}`);
  
  if (!import.meta.env.VITE_OMDB_PROXY_URL) {
    console.log('❌ OMDB proxy URL not configured');
    return;
  }
  
  // Test with a well-known movie that should have RT scores
  const testMovies = [
    { imdbId: 'tt0468569', title: 'The Dark Knight' },
    { imdbId: 'tt0111161', title: 'The Shawshank Redemption' },
    { imdbId: 'tt0137523', title: 'Fight Club' }
  ];
  
  console.log('\n2. Testing OMDB proxy with known movies:');
  
  for (const movie of testMovies) {
    console.log(`\n   Testing: ${movie.title} (${movie.imdbId})`);
    
    try {
      const url = `${import.meta.env.VITE_OMDB_PROXY_URL.replace(/\/$/, '')}?i=${encodeURIComponent(movie.imdbId)}`;
      const headers = {};
      
      if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
        headers.apikey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        headers.Authorization = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
      }
      
      console.log(`   Request URL: ${url}`);
      
      const response = await fetch(url, { headers });
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Success! Movie: ${data.Title} (${data.Year})`);
        
        if (data.Ratings) {
          console.log(`   📊 Found ${data.Ratings.length} ratings:`);
          data.Ratings.forEach(rating => {
            console.log(`      - ${rating.Source}: ${rating.Value}`);
          });
          
          const rt = data.Ratings.find(r => r.Source === 'Rotten Tomatoes');
          if (rt) {
            const score = parseInt(rt.Value.replace('%', ''), 10);
            console.log(`   🍅 Rotten Tomatoes: ${rt.Value} (parsed as ${score})`);
          } else {
            console.log(`   ⚠️  No Rotten Tomatoes rating found`);
          }
        } else {
          console.log(`   ❌ No ratings array found`);
          console.log(`   Raw response:`, data);
        }
      } else {
        const text = await response.text();
        console.log(`   ❌ Failed: ${text}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Test the actual API function
  console.log('\n3. Testing actual fetchDetails function:');
  
  try {
    // Import the fetchDetails function
    const { fetchDetails } = await import('./src/lib/api.js');
    
    // Test with The Dark Knight (TMDB ID: 155)
    console.log('   Testing fetchDetails with The Dark Knight...');
    const result = await fetchDetails(155);
    
    console.log(`   Movie: ${result.title}`);
    console.log(`   TMDB Rating: ${result.ratings.tmdb}`);
    console.log(`   RT Rating: ${result.ratings.rottenTomatoes || 'NOT FOUND'}`);
    
    if (result.ratings.rottenTomatoes) {
      console.log('   ✅ Rotten Tomatoes integration working!');
    } else {
      console.log('   ❌ Rotten Tomatoes score not retrieved');
    }
    
  } catch (error) {
    console.log(`   ❌ Error testing fetchDetails: ${error.message}`);
  }
}

// Run the test
testOMDBIntegration();
