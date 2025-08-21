// Test OMDb API directly to check if the proxy is properly configured
import fetch from 'node-fetch';

async function testOMDbDirect() {
  console.log('🍅 Testing OMDb Proxy directly...\n');
  
  const testImdbId = 'tt0468569'; // The Dark Knight
  const proxyUrl = 'https://iuyhvmarjfgxykpeufsm.supabase.co/functions/v1/omdb-proxy';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1eWh2bWFyamZneHlrcGV1ZnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyOTg0MzAsImV4cCI6MjA3MDg3NDQzMH0.g_GqtGOW6ZGtnBjn_LuA6nKnSzQLYXxS6QamQBwe7oQ';
  
  console.log(`Testing with IMDB ID: ${testImdbId}`);
  console.log(`Proxy URL: ${proxyUrl}`);
  
  try {
    const url = `${proxyUrl}?i=${encodeURIComponent(testImdbId)}&tomatoes=true`;
    console.log(`Request URL: ${url}`);
    
    const headers = {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    };
    
    console.log('Headers:', JSON.stringify(headers, null, 2));
    
    const response = await fetch(url, { headers });
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('\n✅ Success! Movie data:');
        console.log(`Title: ${data.Title}`);
        console.log(`Year: ${data.Year}`);
        
        if (data.Ratings) {
          console.log('\n📊 Ratings:');
          data.Ratings.forEach(rating => {
            console.log(`  ${rating.Source}: ${rating.Value}`);
          });
          
          const rtRating = data.Ratings.find(r => r.Source === 'Rotten Tomatoes');
          if (rtRating) {
            console.log(`\n🍅 Rotten Tomatoes: ${rtRating.Value}`);
          } else {
            console.log('\n❌ No Rotten Tomatoes rating found');
          }
        } else {
          console.log('\n❌ No ratings data');
        }
      } catch (parseError) {
        console.log('❌ Failed to parse JSON response');
      }
    } else {
      console.log(`❌ Request failed: ${responseText}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testOMDbDirect();
