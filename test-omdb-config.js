import config from './src/lib/config.js';

async function testOMDBProxyWithConfig() {
  console.log('🍅 Testing OMDB Proxy with proper config...\n');
  
  console.log('Configuration values:');
  console.log(`- OMDB Proxy URL: ${config.omdbProxyUrl}`);
  console.log(`- Supabase Anon Key: ${config.supabaseAnonKey ? 'SET' : 'NOT SET'}`);
  
  if (!config.omdbProxyUrl) {
    console.log('❌ OMDB_PROXY_URL is not configured');
    return;
  }
  
  // Test with a well-known movie - The Dark Knight
  const testImdbId = 'tt0468569';
  
  try {
    const url = `${config.omdbProxyUrl.replace(/\/$/, '')}?i=${encodeURIComponent(testImdbId)}`;
    const headers = {};
    
    if (config.supabaseAnonKey) {
      headers.apikey = config.supabaseAnonKey;
      headers.Authorization = `Bearer ${config.supabaseAnonKey}`;
    }
    
    console.log(`\nTesting URL: ${url}`);
    console.log(`Headers: ${JSON.stringify(headers, null, 2)}`);
    
    const response = await fetch(url, { headers });
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ OMDB proxy is working!');
      console.log(`Movie: ${data.Title}`);
      
      if (data.Ratings) {
        console.log('Ratings found:');
        data.Ratings.forEach(rating => {
          console.log(`  ${rating.Source}: ${rating.Value}`);
        });
        
        const rt = data.Ratings.find(r => r.Source === 'Rotten Tomatoes');
        if (rt) {
          console.log(`🍅 Rotten Tomatoes score: ${rt.Value}`);
        } else {
          console.log('⚠️ No Rotten Tomatoes rating found');
        }
      } else {
        console.log('❌ No ratings found in response');
      }
    } else {
      const text = await response.text();
      console.log(`❌ OMDB proxy failed: ${text}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

testOMDBProxyWithConfig().catch(console.error);
