// Quick test of the RT proxy
import fetch from 'node-fetch';

async function testRTProxy() {
  console.log('🕷️ Testing RT Proxy Direct...\n');
  
  const proxyUrl = 'https://iuyhvmarjfgxykpeufsm.supabase.co/functions/v1/rt-proxy';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1eWh2bWFyamZneHlrcGV1ZnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyOTg0MzAsImV4cCI6MjA3MDg3NDQzMH0.g_GqtGOW6ZGtnBjn_LuA6nKnSzQLYXxS6QamQBwe7oQ';
  
  try {
    const testUrl = 'https://www.rottentomatoes.com/m/the_dark_knight';
    const url = `${proxyUrl}?url=${encodeURIComponent(testUrl)}`;
    
    console.log(`Testing proxy with: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const html = await response.text();
      console.log(`✅ Proxy working! HTML length: ${html.length} chars`);
      
      // Quick check for RT scores in HTML
      if (html.includes('tomatometer') || html.includes('audience')) {
        console.log(`✅ RT score elements found in HTML`);
      } else {
        console.log(`⚠️ RT score elements not found (may need different parsing)`);
      }
    } else {
      const error = await response.text();
      console.log(`❌ Proxy failed: ${error}`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

testRTProxy();
