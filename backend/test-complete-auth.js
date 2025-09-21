#!/usr/bin/env node

const BACKEND_URL = 'https://backend-production-7441.up.railway.app';
const PUBLISHABLE_KEY = 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81';

async function testCompleteAuth() {
  console.log('🧪 Testing Complete Authentication Flow\n');
  console.log('Backend:', BACKEND_URL);
  console.log('Publishable Key:', PUBLISHABLE_KEY.substring(0, 20) + '...\n');

  const timestamp = Date.now();
  const testEmail = `test${timestamp}@example.com`;
  const testPassword = 'TestPassword123!';

  try {
    // Step 1: Register a new user WITH publishable key
    console.log('1️⃣ Registering new user:', testEmail);
    
    const registerResponse = await fetch(
      `${BACKEND_URL}/auth/customer/emailpass/register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': PUBLISHABLE_KEY
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          first_name: 'Test',
          last_name: 'User'
        })
      }
    );

    const registerData = await registerResponse.json();
    
    if (!registerResponse.ok) {
      console.log('❌ Registration failed:', registerData);
      return;
    }

    console.log('✅ Registration successful');
    console.log('   Token received:', registerData.token ? 'Yes' : 'No');
    
    if (!registerData.token) {
      console.log('❌ No token in registration response');
      console.log('   Response:', JSON.stringify(registerData, null, 2));
      return;
    }

    const token = registerData.token;
    
    // Decode token to see structure
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
      console.log('   Token payload:', JSON.stringify(decoded, null, 2));
    } catch (e) {
      console.log('   Could not decode token');
    }

    // Wait for subscriber to process
    console.log('\n⏳ Waiting 3 seconds for subscriber to link customer...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 2: Test /store/customers/me WITH publishable key
    console.log('\n2️⃣ Testing /store/customers/me endpoint...');
    
    const customerResponse = await fetch(
      `${BACKEND_URL}/store/customers/me`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-publishable-api-key': PUBLISHABLE_KEY
        }
      }
    );

    const customerData = await customerResponse.json();
    
    if (customerResponse.ok && customerData.customer) {
      console.log('✅ Customer endpoint working!');
      console.log('   Customer ID:', customerData.customer.id);
      console.log('   Email:', customerData.customer.email);
      console.log('   Has Account:', customerData.customer.has_account);
    } else {
      console.log('❌ Customer endpoint failed:', customerData);
    }

    // Step 3: Test login
    console.log('\n3️⃣ Testing login with same credentials...');
    
    const loginResponse = await fetch(
      `${BACKEND_URL}/auth/customer/emailpass`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': PUBLISHABLE_KEY
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      }
    );

    const loginData = await loginResponse.json();
    
    if (loginResponse.ok && loginData.token) {
      console.log('✅ Login successful');
      console.log('   Token received:', loginData.token ? 'Yes' : 'No');
      
      // Test customers/me with login token
      const loginCustomerResponse = await fetch(
        `${BACKEND_URL}/store/customers/me`,
        {
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'x-publishable-api-key': PUBLISHABLE_KEY
          }
        }
      );

      const loginCustomerData = await loginCustomerResponse.json();
      
      if (loginCustomerResponse.ok) {
        console.log('✅ Customer endpoint works with login token too!');
      } else {
        console.log('❌ Customer endpoint failed with login token:', loginCustomerData);
      }
    } else {
      console.log('❌ Login failed:', loginData);
    }

    console.log('\n✅ All tests complete!');

  } catch (error) {
    console.error('❌ Error during test:', error.message);
  }
}

// Run the test
testCompleteAuth();