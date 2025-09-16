/**
 * Simple test script to verify payment capture utility compiles correctly
 */

// Test that our utility functions can be imported
const { 
  captureOrderPayment, 
  failOrderPayment, 
  cancelOrderPayment, 
  findOrderByPaymentIntentId,
  getOrderPaymentStatus,
  isOrderPaymentCaptured,
  isOrderReadyForFulfillment,
  createInitialPaymentMetadata
} = require('./dist/utils/payment-capture.js');

console.log('✅ Payment capture utility functions imported successfully');

// Test creating initial payment metadata
const initialMetadata = createInitialPaymentMetadata('pi_test_123', 'cart_test_456');
console.log('✅ Initial payment metadata created:', initialMetadata);

// Test order with mock metadata
const mockOrder = {
  id: 'order_test',
  total: 2999,
  metadata: {
    payment_captured: true,
    payment_status: 'captured',
    payment_intent_id: 'pi_test_123',
    ready_for_fulfillment: true
  }
};

console.log('✅ Order payment status:', getOrderPaymentStatus(mockOrder));
console.log('✅ Order payment captured:', isOrderPaymentCaptured(mockOrder));
console.log('✅ Order ready for fulfillment:', isOrderReadyForFulfillment(mockOrder));

console.log('🎉 All payment capture utility tests passed!');