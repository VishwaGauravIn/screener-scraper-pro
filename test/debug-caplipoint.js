import ScreenerScraperPro from '../dist/index.js';

async function test() {
  const company = 'CAPLIPOINT';
  const screenerUrl = `https://www.screener.in/company/${company}/`;
  console.log('Fetching from:', screenerUrl);
  
  try {
    const result = await ScreenerScraperPro(screenerUrl);
    const transcriptUrl = result?.documents?.concalls?.[0]?.transcript;
    
    console.log('Full result:', JSON.stringify(result, null, 2));
    console.log('\nTranscript URL:', transcriptUrl);
    
    if (transcriptUrl) {
      console.log('\nAttempting to fetch transcript...');
      const response = await fetch(transcriptUrl);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers));
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();
