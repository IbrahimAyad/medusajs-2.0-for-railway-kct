#!/usr/bin/env node

/**
 * Comprehensive test script for authentication and customer creation
 * Tests multiple approaches to ensure customers are properly created
 */

const API_URL = 'https://backend-production-7441.up.railway.app'
const PUBLISHABLE_KEY = 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81'
const testEmail = `test${Date.now()}@example.com`
const testPassword = 'TestPassword123!'

console.log('🔥 COMPREHENSIVE AUTH & CUSTOMER CREATION TEST')
console.log('===============================================')
console.log(`Test Email: ${testEmail}`)
console.log(`API URL: ${API_URL}`)
console.log('')

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testCompleteFlow() {
  try {
    // Step 1: Register new user
    console.log('📝 STEP 1: REGISTERING NEW USER')
    console.log('--------------------------------')
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
    console.log('✅ Registration successful')
    console.log(`   Token: ${token.substring(0, 20)}...`)

    // Wait for async processing
    console.log('⏳ Waiting 3 seconds for async processing...')
    await delay(3000)

    // Step 2: Try customer sync endpoint
    console.log('\n📤 STEP 2: SYNCING CUSTOMER VIA API')
    console.log('------------------------------------')
    const syncResponse = await fetch(`${API_URL}/store/customer/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-publishable-api-key': PUBLISHABLE_KEY
      },
      body: JSON.stringify({
        email: testEmail,
        token: token
      })
    })

    if (syncResponse.ok) {
      const syncData = await syncResponse.json()
      console.log('✅ Customer sync successful:')
      console.log(`   Customer ID: ${syncData.customer?.id}`)
      console.log(`   Has Account: ${syncData.customer?.has_account}`)
    } else {
      const error = await syncResponse.text()
      console.log('⚠️  Customer sync failed:', error)
    }

    // Step 3: Check via admin API
    console.log('\n🔍 STEP 3: VERIFYING IN ADMIN API')
    console.log('----------------------------------')

    // Use a valid admin token if available
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
        console.log(`   ID: ${customer.id}`)
        console.log(`   Email: ${customer.email}`)
        console.log(`   Has Account: ${customer.has_account}`)
        console.log(`   Created: ${customer.created_at}`)

        if (customer.has_account) {
          console.log('\n🎉 SUCCESS! Customer properly shows as REGISTERED')
        } else {
          console.log('\n⚠️  Customer exists but shows as GUEST')
        }
      } else {
        console.log('❌ No customer found in admin API')
      }
    } else {
      console.log('⚠️  Could not verify via admin API (may need new token)')
    }

    // Step 4: Test login
    console.log('\n🔐 STEP 4: TESTING LOGIN')
    console.log('------------------------')
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
      console.log(`   Token: ${loginData.token.substring(0, 20)}...`)

      // Try sync again after login
      console.log('\n📤 STEP 5: SYNC AFTER LOGIN')
      console.log('---------------------------')
      const syncResponse2 = await fetch(`${API_URL}/store/customer/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.token}`,
          'x-publishable-api-key': PUBLISHABLE_KEY
        },
        body: JSON.stringify({
          email: testEmail,
          token: loginData.token
        })
      })

      if (syncResponse2.ok) {
        const syncData2 = await syncResponse2.json()
        console.log('✅ Post-login sync successful:')
        console.log(`   Customer ID: ${syncData2.customer?.id}`)
      } else {
        console.log('⚠️  Post-login sync failed')
      }
    } else {
      console.log('❌ Login failed')
    }

    // Step 6: Test customer/me endpoint
    console.log('\n👤 STEP 6: TESTING CUSTOMER/ME ENDPOINT')
    console.log('----------------------------------------')
    const meResponse = await fetch(`${API_URL}/store/customers/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-publishable-api-key': PUBLISHABLE_KEY
      }
    })

    if (meResponse.ok) {
      const meData = await meResponse.json()
      console.log('✅ Customer/me endpoint works:')
      console.log(`   Customer ID: ${meData.customer?.id}`)
      console.log(`   Email: ${meData.customer?.email}`)
    } else {
      const status = meResponse.status
      console.log(`⚠️  Customer/me returned ${status}`)
      if (status === 401) {
        console.log('   This is the core issue - customer not linked to auth')
      }
    }

    // Final Summary
    console.log('\n===============================================')
    console.log('📊 TEST SUMMARY')
    console.log('===============================================')
    console.log(`✅ Registration: Success`)
    console.log(`${syncResponse.ok ? '✅' : '⚠️ '} Customer Sync: ${syncResponse.ok ? 'Success' : 'Failed'}`)
    console.log(`${loginResponse.ok ? '✅' : '❌'} Login: ${loginResponse.ok ? 'Success' : 'Failed'}`)
    console.log(`${meResponse.ok ? '✅' : '⚠️ '} Customer/Me: ${meResponse.ok ? 'Works' : 'Returns 401'}`)

    if (!meResponse.ok) {
      console.log('\n🔴 CORE ISSUE IDENTIFIED:')
      console.log('   Auth identity exists but not linked to customer')
      console.log('   This causes the 401 on /store/customers/me')
      console.log('   Solution: Workflow or subscriber must create customer on auth')
    } else {
      console.log('\n🟢 ALL SYSTEMS WORKING!')
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error)
    process.exit(1)
  }
}

// Run the test
testCompleteFlow()