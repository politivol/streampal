// Test the CORS fix for RT proxy

const RT_PROXY_URL = 'https://iuyhvmarjfgxykpeufsm.supabase.co/functions/v1/rt-proxy';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1eWh2bWFyamZneHlrcGV1ZnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyOTg0MzAsImV4cCI6MjA3MDg3NDQzMH0.g_GqtGOW6ZGtnBjn_LuA6nKnSzQLYXxS6QamQBwe7oQ';

async function testCORSFix() {
  try {
    console.log('🔍 Testing CORS fix for RT proxy...');
    
    // This should now work with the apikey header
    const testUrl = 'https://www.rottentomatoes.com/m/inception';
    const proxyUrl = `${RT_PROXY_URL}?url=${encodeURIComponent(testUrl)}`;
    
    console.log('Testing with apikey header (should work now):');
    
    const response = await fetch(proxyUrl, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const html = await response.text();
      console.log(`✅ SUCCESS! Response length: ${html.length}`);
      
      // Check for RT scores
      const tomatometerMatch = html.match(/"tomatometer":\s*(\d+)/i);
      if (tomatometerMatch) {
        console.log(`🍅 Found Tomatometer: ${tomatometerMatch[1]}%`);
      }
      
      const audienceMatch = html.match(/"audienceScore":\s*(\d+)/i);
      if (audienceMatch) {
        console.log(`🍿 Found Audience Score: ${audienceMatch[1]}%`);
      }
      
    } else {
      const errorText = await response.text();
      console.log(`❌ Still failed: ${response.status} - ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testCORSFix();
