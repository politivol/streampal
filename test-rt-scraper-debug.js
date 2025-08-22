// Test the improved RT search logic with better score parsing

const RT_PROXY_URL = 'https://iuyhvmarjfgxykpeufsm.supabase.co/functions/v1/rt-proxy';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1eWh2bWFyamZneHlrcGV1ZnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyOTg0MzAsImV4cCI6MjA3MDg3NDQzMH0.g_GqtGOW6ZGtnBjn_LuA6nKnSzQLYXxS6QamQBwe7oQ';

async function testDetailedScoring() {
  try {
    console.log('🎯 Testing detailed score extraction...');
    
    // Test with just one movie for detailed analysis
    const movie = { title: 'Inception', year: 2010 };
    
    console.log(`\n🎬 Detailed test: ${movie.title} (${movie.year})`);
    
    const cleanTitle = movie.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .trim();
    
    const directUrl = `https://www.rottentomatoes.com/m/${cleanTitle}`;
    console.log(`Direct URL: ${directUrl}`);
    
    const proxyUrl = `${RT_PROXY_URL}?url=${encodeURIComponent(directUrl)}`;
    
    const response = await fetch(proxyUrl, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      console.log(`HTML length: ${html.length}`);
      
      // Test all possible score patterns
      const patterns = [
        { name: 'JSON tomatometer', regex: /"tomatometer":\s*(\d+)/i },
        { name: 'JSON audienceScore', regex: /"audienceScore":\s*(\d+)/i },
        { name: 'Tomatometer class', regex: /tomatometer[^>]*>[\s\S]*?(\d+)%/i },
        { name: 'Score board', regex: /score-board__tomatometer[^>]*>[\s\S]*?(\d+)%/i },
        { name: 'Critics score', regex: /critics-score[^>]*>[\s\S]*?(\d+)%/i },
        { name: 'Audience score', regex: /audience-score[^>]*>[\s\S]*?(\d+)%/i }
      ];
      
      console.log('\n📊 Score extraction results:');
      for (const pattern of patterns) {
        const match = html.match(pattern.regex);
        if (match) {
          console.log(`✅ ${pattern.name}: ${match[1]}%`);
        } else {
          console.log(`❌ ${pattern.name}: No match`);
        }
      }
      
      // Look for JSON data in the page
      const jsonMatch = html.match(/"@type":\s*"Movie"[\s\S]*?"aggregateRating"[\s\S]*?"ratingValue":\s*(\d+)/i);
      if (jsonMatch) {
        console.log(`✅ JSON-LD aggregate rating: ${jsonMatch[1]}`);
      }
      
      // Look for all numbers followed by % to debug
      const allPercentages = [...html.matchAll(/(\d+)%/g)];
      console.log(`\n🔍 All percentages found (first 20):`, allPercentages.slice(0, 20).map(m => m[1]));
      
      // Look for script tags with data
      const scriptMatches = [...html.matchAll(/<script[^>]*>[\s\S]*?movieInfo[\s\S]*?<\/script>/gi)];
      console.log(`\n📜 Found ${scriptMatches.length} script tags with movie data`);
      
    } else {
      console.log(`❌ Failed to fetch: ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testDetailedScoring();
