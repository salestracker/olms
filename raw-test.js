// Simple raw test with axios
const axios = require('axios');

async function rawTest() {
  try {
    // Create a simple raw JSON string with exact structure
    const payload = {
      json: {
        email: "admin@zenith.com", 
        password: "admin123"
      }
    };
    
    console.log('Request payload:', JSON.stringify(payload, null, 2));
    
    // Make a direct axios request
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
    
    // If we got a token, test it with users.me endpoint
    if (response.data.result?.data?.token) {
      console.log('Login successful!');
      console.log('Token:', response.data.result.data.token);
      
      // Test users.me endpoint - using GET for query procedures
      const meResponse = await axios({
        method: 'GET',
        url: 'http://localhost:4000/trpc/users.me',
        headers: {
          'Authorization': `Bearer ${response.data.result.data.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('\nUser data response:', JSON.stringify(meResponse.data, null, 2));
    }
  } catch (error) {
    console.error('Test error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
rawTest();
