// Quick test script to check if backend is deployed
// Run with: node test-backend.js

const BACKEND_URL = 'https://sqczriljcayzpseshzku.supabase.co/functions/v1/make-server-b509981e/health';

async function testBackend() {
  console.log('Testing backend connection...');
  console.log('URL:', BACKEND_URL);
  
  try {
    const response = await fetch(BACKEND_URL);
    const data = await response.json();
    
    if (data.status === 'ok') {
      console.log('✅ Backend is connected and working!');
      return true;
    } else {
      console.log('❌ Backend returned unexpected response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend is NOT connected');
    console.log('Error:', error.message);
    console.log('\n📋 The backend needs to be deployed to Supabase.');
    console.log('📖 See DEPLOY_BACKEND.md for deployment instructions.');
    return false;
  }
}

testBackend();

