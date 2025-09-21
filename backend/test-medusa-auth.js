const API_URL = 'https://backend-production-7441.up.railway.app'
const PUBLISHABLE_KEY = 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81'
const testEmail = `test${Date.now()}@example.com`
const testPassword = 'TestPassword123!'

async function testMedusaAuth() {
  console.log('Testing Medusa built-in auth with:', testEmail)
  console.log('Waiting 30s for deployment...')
  await new Promise(r => setTimeout(r, 30000))
  
  // Try registration with Medusa's built-in endpoint
  console.log('\n1. Testing registration at /auth/customer/emailpass/register')
  const registerRes = await fetch(`${API_URL}/auth/customer/emailpass/register`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-publishable-api-key': PUBLISHABLE_KEY
    },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword
    })
  })
  
  console.log('Registration status:', registerRes.status)
  const registerText = await registerRes.text()
  console.log('Registration response:', registerText)
  
  let token
  try {
    const data = JSON.parse(registerText)
    token = data.token || data.jwt || data.access_token
  } catch (e) {
    console.log('Could not parse response as JSON')
  }
  
  if (!token) {
    console.log('No token in registration response, trying login...')
    
    // Try login
    console.log('\n2. Testing login at /auth/customer/emailpass')
    const loginRes = await fetch(`${API_URL}/auth/customer/emailpass`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-publishable-api-key': PUBLISHABLE_KEY
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    })
    
    console.log('Login status:', loginRes.status)
    const loginText = await loginRes.text()
    console.log('Login response:', loginText)
    
    try {
      const data = JSON.parse(loginText)
      token = data.token || data.jwt || data.access_token
    } catch (e) {
      console.log('Could not parse login response')
    }
  }
  
  if (!token) {
    console.log('❌ Could not get auth token')
    return
  }
  
  console.log('✅ Got token:', token.substring(0, 20) + '...')
  
  // Test /store/customers/me
  console.log('\n3. Testing /store/customers/me with token')
  const meRes = await fetch(`${API_URL}/store/customers/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-publishable-api-key': PUBLISHABLE_KEY
    }
  })
  
  console.log('Customer/me status:', meRes.status)
  
  if (meRes.status === 200) {
    const meData = await meRes.json()
    console.log('✅ SUCCESS! Customer data:', meData.customer)
  } else {
    const error = await meRes.text()
    console.log('❌ FAILED:', error)
  }
}

testMedusaAuth().catch(console.error)