// Simple test without importing config to avoid import.meta issues
import fetch from 'node-fetch';

async function testOMDbLimits() {
  console.log('🔍 Testing OMDb API Rate Limits...\n');
  
  const proxyUrl = 'https://iuyhvmarjfgxykpeufsm.supabase.co/functions/v1/omdb-proxy';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1eWh2bWFyamZneHlrcGV1ZnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyOTg0MzAsImV4cCI6MjA3MDg3NDQzMH0.g_GqtGOW6ZGtnBjn_LuA6nKnSzQLYXxS6QamQBwe7oQ';
  
  const tests = [
    { name: 'Basic request (no tomatoes)', params: 'i=tt0468569' },
    { name: 'With tomatoes parameter', params: 'i=tt0468569&tomatoes=true' },
    { name: 'Different movie (Inception)', params: 'i=tt1375666' },
    { name: 'Title search instead of IMDb ID', params: 't=Inception' },
    { name: 'Very old movie (Casablanca)', params: 'i=tt0034583' }
  ];
  
  for (const test of tests) {
    console.log(`\n${test.name}:`);
    try {
      const url = `${proxyUrl}?${test.params}`;
      const response = await fetch(url, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`
        }
      });
      
      const data = await response.text();
      console.log(`   Status: ${response.status}`);
      
      try {
        const parsed = JSON.parse(data);
        if (parsed.Response === 'False') {
          console.log(`   ❌ Error: ${parsed.Error}`);
        } else {
          console.log(`   ✅ Success: ${parsed.Title} (${parsed.Year})`);
          if (parsed.Ratings) {
            const rtRating = parsed.Ratings.find(r => r.Source === 'Rotten Tomatoes');
            if (rtRating) {
              console.log(`   🍅 RT: ${rtRating.Value}`);
            } else {
              console.log(`   📊 No RT rating found`);
            }
          }
        }
      } catch (parseError) {
        console.log(`   ❌ Parse error: ${data}`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }
  }
}

testOMDbLimits();
