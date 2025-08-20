import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://iuyhvmarjfgxykpeufsm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1eWh2bWFyamZneHlrcGV1ZnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyOTg0MzAsImV4cCI6MjA3MDg3NDQzMH0.g_GqtGOW6ZGtnBjn_LuA6nKnSzQLYXxS6QamQBwe7oQ'
);

async function testOMDBProxy() {
  console.log('🍅 Testing OMDB Proxy for Rotten Tomatoes scores...\n');
  
  // Test with a well-known movie - The Dark Knight
  const testImdbId = 'tt0468569'; // The Dark Knight
  const proxyUrl = 'https://iuyhvmarjfgxykpeufsm.supabase.co/functions/v1/omdb-proxy';
  
  console.log(`1. Testing OMDB proxy with IMDB ID: ${testImdbId}`);
  console.log(`   Proxy URL: ${proxyUrl}`);
  
  try {
    const url = `${proxyUrl}?i=${encodeURIComponent(testImdbId)}`;
    const headers = {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1eWh2bWFyamZneHlrcGV1ZnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyOTg0MzAsImV4cCI6MjA3MDg3NDQzMH0.g_GqtGOW6ZGtnBjn_LuA6nKnSzQLYXxS6QamQBwe7oQ',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1eWh2bWFyamZneHlrcGV1ZnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyOTg0MzAsImV4cCI6MjA3MDg3NDQzMH0.g_GqtGOW6ZGtnBjn_LuA6nKnSzQLYXxS6QamQBwe7oQ'
    };
    
    console.log(`   Making request to: ${url}`);
    
    const response = await fetch(url, { headers });
    console.log(`   Response status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ OMDB proxy is working!');
      console.log(`   📽️  Movie: ${data.Title}`);
      console.log(`   📅 Year: ${data.Year}`);
      
      if (data.Ratings) {
        console.log('   📊 Ratings found:');
        data.Ratings.forEach(rating => {
          console.log(`      ${rating.Source}: ${rating.Value}`);
        });
        
        const rt = data.Ratings.find(r => r.Source === 'Rotten Tomatoes');
        if (rt) {
          console.log(`   🍅 Rotten Tomatoes score: ${rt.Value}`);
          const score = parseInt(rt.Value.replace('%', ''), 10);
          console.log(`   📈 Parsed score: ${score}`);
        } else {
          console.log('   ⚠️  No Rotten Tomatoes rating found');
        }
      } else {
        console.log('   ❌ No ratings found in response');
      }
    } else {
      const text = await response.text();
      console.log(`   ❌ OMDB proxy failed: ${text}`);
    }
  } catch (error) {
    console.log(`   ❌ Error testing OMDB proxy: ${error.message}`);
  }
  
  // Test the config values
  console.log('\n2. Checking configuration...');
  console.log('   Environment variables:');
  console.log(`   - VITE_OMDB_PROXY_URL: ${process.env.VITE_OMDB_PROXY_URL || 'NOT SET'}`);
  console.log(`   - VITE_SUPABASE_ANON_KEY: ${process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}`);
}

testOMDBProxy().catch(console.error);
