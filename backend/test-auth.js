const API_URL = 'https://backend-production-7441.up.railway.app'
const PUBLISHABLE_KEY = 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81'
const testEmail = `test${Date.now()}@example.com`
const testPassword = 'TestPassword123!'

async function testAuth() {
  console.log('Testing auth with:', testEmail)
  
  // Register
  const registerRes = await fetch(`${API_URL}/auth/customer/emailpass/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      first_name: 'Test',
      last_name: 'User'
    })
  })
  
  const registerData = await registerRes.json()
  const token = registerData.token
  console.log('Registration:', registerRes.status === 200 ? '✅' : '❌')
  console.log('Token received:', token ? '✅' : '❌')
  
  if (!token) return
  
  // Test /store/customers/me
  const meRes = await fetch(`${API_URL}/store/customers/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-publishable-api-key': PUBLISHABLE_KEY
    }
  })
  
  console.log('Customer/me status:', meRes.status)
  
  if (meRes.status === 200) {
    const meData = await meRes.json()
    console.log('✅ SUCCESS! Customer ID:', meData.customer?.id)
  } else {
    const error = await meRes.text()
    console.log('❌ FAILED:', error)
  }
}

testAuth().catch(console.error)