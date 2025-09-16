'use client';

import { useRouter } from 'next/navigation';
import { useMedusaCart } from '@/contexts/MedusaCartContext';

export function MedusaCheckoutButton() {
  const router = useRouter();
  const { cart, isLoading } = useMedusaCart();
  
  const handleCheckout = () => {
    // Redirect to the Stripe checkout page
    router.push('/checkout-stripe');
  };

  const total = cart?.total ? cart.total / 100 : 0; // Medusa 2.0 returns amount in cents, convert to dollars
  const itemCount = cart?.items?.length || 0;

  return (
    <div className="space-y-2">
      <button
        onClick={handleCheckout}
        disabled={isLoading || itemCount === 0}
        className="w-full bg-black text-white py-4 px-6 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        Checkout - ${total.toFixed(2)}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Secure checkout powered by Stripe
      </p>
    </div>
  );
}