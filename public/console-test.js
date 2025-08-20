// Quick test script - paste this in browser console
async function quickOMDBTest() {
    console.log('🍅 Quick OMDB Test');
    
    // Import the API function
    const { fetchDetails } = await import('/streampal/src/lib/api.js');
    
    console.log('Testing The Dark Knight (TMDB ID: 155)...');
    const result = await fetchDetails(155);
    
    console.log('Result:', result);
    console.log('RT Score:', result.ratings.rottenTomatoes);
    
    return result;
}

// Run it
quickOMDBTest();
