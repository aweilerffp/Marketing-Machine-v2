// Simple test script to verify API connectivity
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

async function testAPI() {
  try {
    console.log('Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);

    console.log('\nTesting LinkedIn status endpoint...');
    const linkedinResponse = await axios.get(`${API_BASE_URL}/api/linkedin/status`);
    console.log('✅ LinkedIn status:', linkedinResponse.data);

    console.log('\nTesting LinkedIn auth endpoint...');
    const authResponse = await axios.get(`${API_BASE_URL}/api/linkedin/auth`);
    console.log('✅ LinkedIn auth:', authResponse.data);

  } catch (error) {
    console.error('❌ API Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAPI();