const axios = require('axios');

const BACKEND_URL = 'https://backend-production-7441.up.railway.app';
const PUBLISHABLE_KEY = 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81';

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow\n');

  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  try {
    // Step 1: Register a new user
    console.log('1️⃣ Registering new user:', testEmail);
    const registerResponse = await axios.post(
      `${BACKEND_URL}/auth/customer/emailpass/register`,
      {
        email: testEmail,
        password: testPassword
      },
      {
        headers: {
          'x-publishable-api-key': PUBLISHABLE_KEY
        }
      }
    );

    console.log('✅ Registration successful');
    console.log('   Token received:', registerResponse.data.token ? 'Yes' : 'No');

    // Wait a moment for subscribers to process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Check if customer was created
    console.log('\n2️⃣ Checking if customer record was created...');
    const token = registerResponse.data.token;

    const customerResponse = await axios.get(
      `${BACKEND_URL}/store/customers/me`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-publishable-api-key': PUBLISHABLE_KEY
        }
      }
    );

    if (customerResponse.data.customer) {
      console.log('✅ Customer record found!');
      console.log('   Customer ID:', customerResponse.data.customer.id);
      console.log('   Email:', customerResponse.data.customer.email);
      console.log('\n🎉 SUBSCRIBERS ARE WORKING! The auth-identity-created subscriber successfully created a customer record.');
    } else {
      console.log('❌ No customer record found');
      console.log('   The subscriber may not be working properly');
    }

  } catch (error) {
    console.error('❌ Error during test:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('   This might mean the customer record wasn\'t created by the subscriber');
    }
  }
}

testAuthFlow();