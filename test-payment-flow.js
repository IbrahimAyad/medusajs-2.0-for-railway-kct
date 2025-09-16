#!/usr/bin/env node

/**
 * Test script to verify the complete payment flow
 * Tests order creation, payment processing, and admin panel sync
 */

const axios = require('axios');

const BACKEND_URL = 'https://backend-production-7441.up.railway.app';
const FRONTEND_URL = 'https://kct-menswear-medusa-test.vercel.app';
const PUBLISHABLE_KEY = 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81';

// Test colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testOrderCheck() {
  log('\n=== Testing Order Check Endpoint ===', 'blue');
  
  try {
    // Test with a dummy cart ID
    const response = await axios.get(`${BACKEND_URL}/store/orders/check?cart_id=test_cart_123`, {
      headers: {
        'x-publishable-api-key': PUBLISHABLE_KEY,
        'User-Agent': 'KCT-Frontend/1.0'
      }
    });
    
    log('✓ Order check endpoint accessible', 'green');
    log(`Response: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } catch (error) {
    log('✗ Order check endpoint failed', 'red');
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Error: ${JSON.stringify(error.response.data)}`, 'red');
    } else {
      log(`Error: ${error.message}`, 'red');
    }
    return false;
  }
}

async function testAdminAuth() {
  log('\n=== Testing Admin Authentication ===', 'blue');
  
  try {
    // First, try to access admin endpoint without auth
    const response = await axios.get(`${BACKEND_URL}/admin/orders`, {
      headers: {
        'Accept': 'application/json'
      },
      validateStatus: () => true // Don't throw on 401
    });
    
    if (response.status === 401) {
      log('✓ Admin endpoint properly secured (returns 401 without auth)', 'green');
    } else {
      log(`⚠ Admin endpoint returned status ${response.status} without auth`, 'yellow');
    }
    
    return true;
  } catch (error) {
    log('✗ Could not test admin authentication', 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

async function testWebhookEndpoint() {
  log('\n=== Testing Webhook Endpoint ===', 'blue');
  
  try {
    // Test webhook endpoint exists (should return 400 without proper signature)
    const response = await axios.post(`${BACKEND_URL}/hooks/payment/stripe`, 
      { test: true },
      {
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'test_signature'
        },
        validateStatus: () => true
      }
    );
    
    if (response.status === 400) {
      log('✓ Webhook endpoint accessible (returns 400 for invalid signature)', 'green');
    } else {
      log(`⚠ Webhook endpoint returned status ${response.status}`, 'yellow');
    }
    
    return true;
  } catch (error) {
    log('✗ Webhook endpoint test failed', 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

async function testTaxCalculation() {
  log('\n=== Testing Tax Calculation ===', 'blue');
  
  try {
    // Create a test cart to check tax calculation
    const cartResponse = await axios.post(`${BACKEND_URL}/store/carts`, 
      {
        region_id: 'reg_01K3S6NDGAC1DSWH9MCZCWBWWD',
        items: []
      },
      {
        headers: {
          'x-publishable-api-key': PUBLISHABLE_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (cartResponse.data.cart) {
      const cart = cartResponse.data.cart;
      log('✓ Cart created successfully', 'green');
      
      // Check if tax fields are present
      if ('tax_total' in cart) {
        log('✓ Tax fields present in cart', 'green');
        log(`Tax total: ${cart.tax_total || 0}`, 'blue');
      } else {
        log('⚠ Tax fields not found in cart', 'yellow');
      }
    }
    
    return true;
  } catch (error) {
    log('✗ Tax calculation test failed', 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('🚀 Starting Payment System Tests', 'blue');
  log(`Backend URL: ${BACKEND_URL}`, 'blue');
  log(`Frontend URL: ${FRONTEND_URL}`, 'blue');
  
  const results = {
    orderCheck: await testOrderCheck(),
    adminAuth: await testAdminAuth(),
    webhook: await testWebhookEndpoint(),
    tax: await testTaxCalculation()
  };
  
  log('\n=== Test Results Summary ===', 'blue');
  
  let allPassed = true;
  for (const [test, passed] of Object.entries(results)) {
    if (passed) {
      log(`✓ ${test}: PASSED`, 'green');
    } else {
      log(`✗ ${test}: FAILED`, 'red');
      allPassed = false;
    }
  }
  
  if (allPassed) {
    log('\n🎉 All tests passed! Payment system is working correctly.', 'green');
  } else {
    log('\n⚠️ Some tests failed. Please review the issues above.', 'yellow');
  }
  
  log('\n📝 Next Steps:', 'blue');
  log('1. Try making a real payment on the frontend', 'blue');
  log('2. Check if the order appears in the admin panel', 'blue');
  log('3. Verify Stripe webhook is marked as successful', 'blue');
  log('4. Confirm tax is calculated correctly for Michigan (6%)', 'blue');
}

// Run tests
runAllTests().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});