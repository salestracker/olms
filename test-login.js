// Direct test script for login endpoint
const axios = require('axios');

async function testLogin() {
  try {
    console.log('Attempting direct login test...');
    
    // TRPC expects a different structure than what we've been sending
    const payload = {
      // This is the correct format for tRPC requests
      json: {
        email: 'admin@zenith.com',
        password: 'admin123'
      }
    };
    
    console.log('Request payload:', JSON.stringify(payload, null, 2));
    
    // Make request directly to login endpoint
    console.log('Making request to: http://localhost:4000/trpc/users.login');
    const response = await axios({
      method: 'POST',
      url: 'http://localhost:4000/trpc/users.login',
      headers: { 
        'Content-Type': 'application/json'
      },
      data: payload
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    // Check if we got a token
    if (response.data.result?.data?.token) {
      console.log('Login successful!');
      console.log('Token:', response.data.result.data.token);
      
      // Test the token with another endpoint
      console.log('\nTesting token with users.me endpoint...');
      const meResponse = await axios({
        method: 'POST',
        url: 'http://localhost:4000/trpc/users.me',
        headers: {
          'Authorization': `Bearer ${response.data.result.data.token}`,
          'Content-Type': 'application/json'
        },
        data: { json: {} }
      });
      
      console.log('User data response:', JSON.stringify(meResponse.data, null, 2));
    } else {
      console.log('Login failed:', response.data.error || 'No error information provided');
    }
  } catch (error) {
    console.error('Test error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Execute test
testLogin();
