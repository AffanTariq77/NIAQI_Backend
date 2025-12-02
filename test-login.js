const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login...');
    const response = await axios.post('http://localhost:5000/api/auth/signin', {
      email: 'test@example.com',
      password: 'password123',
      rememberMe: false
    });
    
    console.log('✅ Login successful!');
    console.log('Access Token:', response.data.accessToken.substring(0, 20) + '...');
    console.log('User:', response.data.user);
    
    // Test getting cart with token
    const cartResponse = await axios.get('http://localhost:5000/api/cart', {
      headers: {
        'Authorization': `Bearer ${response.data.accessToken}`
      }
    });
    
    console.log('\n✅ Cart retrieved successfully!');
    console.log('Cart:', cartResponse.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testLogin();
