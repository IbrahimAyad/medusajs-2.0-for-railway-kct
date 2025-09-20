#!/usr/bin/env node

/**
 * Test script to verify the complete registration and customer creation flow
 */

const API_URL = 'https://backend-production-7441.up.railway.app'
const testEmail = `test${Date.now()}@example.com`
const testPassword = 'TestPassword123!'

console.log('🔥 Testing Registration Flow')
console.log('================================')
console.log(`Email: ${testEmail}`)
console.log(`API URL: ${API_URL}`)
console.log('')

async function testRegistration() {
  try {
    // Step 1: Register new user
    console.log('1️⃣  Registering new user...')
    const registerResponse = await fetch(`${API_URL}/auth/customer/emailpass/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        first_name: 'Test',
        last_name: 'User'
      })
    })

    if (!registerResponse.ok) {
      const error = await registerResponse.text()
      throw new Error(`Registration failed: ${error}`)
    }

    const { token } = await registerResponse.json()
    console.log('✅ Registration successful, token received')

    // Step 2: Sync customer
    console.log('\n2️⃣  Syncing customer record...')
    const syncResponse = await fetch(`${API_URL}/store/customer/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        email: testEmail,
        token: token
      })
    })

    if (!syncResponse.ok) {
      const error = await syncResponse.text()
      console.log('⚠️  Customer sync failed:', error)
    } else {
      const syncData = await syncResponse.json()
      console.log('✅ Customer synced:', syncData)
    }

    // Step 3: Check customer exists via admin API
    console.log('\n3️⃣  Checking customer via admin API...')
    const adminToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXJfMDFLNEdROE5YQzQ0SDRGNEdaMUg2NU5HUzAiLCJpYXQiOjE3MzY1MjE1NjEsImV4cCI6MTczOTExMzU2MX0.Lte8h8nQKHgBN9lj9d3vWOCWJ_1PHcWNyy6SDzHLNDM'

    const customersResponse = await fetch(`${API_URL}/admin/customers?email=${testEmail}`, {
      method: 'GET',
      headers: {
        'Authorization': adminToken
      }
    })

    if (customersResponse.ok) {
      const customersData = await customersResponse.json()
      if (customersData.customers && customersData.customers.length > 0) {
        const customer = customersData.customers[0]
        console.log('✅ Customer found in admin:')
        console.log(`   - ID: ${customer.id}`)
        console.log(`   - Email: ${customer.email}`)
        console.log(`   - Has Account: ${customer.has_account}`)
        console.log(`   - Created: ${customer.created_at}`)

        if (customer.has_account) {
          console.log('\n🎉 SUCCESS! Customer shows as REGISTERED (has_account: true)')
        } else {
          console.log('\n⚠️  WARNING: Customer exists but shows as GUEST (has_account: false)')
        }
      } else {
        console.log('❌ No customer found in admin')
      }
    } else {
      console.log('❌ Could not check admin API')
    }

    // Step 4: Test login
    console.log('\n4️⃣  Testing login with new account...')
    const loginResponse = await fetch(`${API_URL}/auth/customer/emailpass`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    })

    if (loginResponse.ok) {
      const loginData = await loginResponse.json()
      console.log('✅ Login successful')

      // Step 5: Sync customer again after login
      console.log('\n5️⃣  Syncing customer after login...')
      const syncResponse2 = await fetch(`${API_URL}/store/customer/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.token}`
        },
        body: JSON.stringify({
          email: testEmail,
          token: loginData.token
        })
      })

      if (syncResponse2.ok) {
        const syncData2 = await syncResponse2.json()
        console.log('✅ Customer synced after login:', syncData2)
      }
    } else {
      console.log('❌ Login failed')
    }

    console.log('\n================================')
    console.log('📊 Test Summary:')
    console.log('- Registration: ✅')
    console.log('- Customer Sync: ' + (syncResponse.ok ? '✅' : '⚠️'))
    console.log('- Login: ' + (loginResponse.ok ? '✅' : '❌'))
    console.log('================================')

  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

// Run the test
testRegistration()