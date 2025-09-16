"use client";

import { useCart } from "@/lib/hooks/useCart";
import { useProductStore } from "@/lib/store/productStore";
import { formatPrice, getSizeLabel } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ShoppingBag, Plus, Minus, X, Shield, Clock, Star, Lock, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { loadStripe } from "@stripe/stripe-js";
import { CheckoutBenefits } from "@/components/checkout/CheckoutBenefits";
import { useCartPersistence } from "@/hooks/useCartPersistence";
import { trackBeginCheckout, trackRemoveFromCart, trackViewCart } from "@/lib/analytics/google-analytics";
import { trackInitiateCheckout } from "@/lib/analytics/facebook-pixel";
// Removed Supabase client import - no longer needed
import { getCoreProductById, isCoreProduct } from '@/lib/config/coreProducts';
import { useState, useEffect } from "react";
import { clearAllCartData } from '@/lib/utils/clearCartData';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CartPage() {
  const router = useRouter();
  const { items, cartSummary, updateQuantity, removeFromCart, clearCart } = useCart();
  const { products } = useProductStore();
  const { user } = useAuth();
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [showGuestCheckout, setShowGuestCheckout] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(false);

  // Enable cart persistence
  useCartPersistence();

  // Validate email
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(guestEmail));
  }, [guestEmail]);

  const cartItemsWithProducts = items.map((item) => ({
    ...item,
    product: products.find((p) => p.id === item.productId),
  }));

  const validCartItems = cartItemsWithProducts.filter(item => item.product);

  // Return empty cart if no items
  if (validCartItems.length === 0) {
    return <EmptyCart />;
  }

  // Track cart view
  useEffect(() => {
    if (validCartItems.length > 0) {
      const cartItems = validCartItems.map(item => ({
        productId: item.product!.id,
        name: item.product!.name,
        category: item.product!.category,
        price: item.product!.price,
        quantity: item.quantity,
        size: item.size,
      }));
      trackViewCart(cartSummary.totalPrice, cartItems);
    }
  }, [validCartItems.length]);

  const handleCheckout = async () => {
    setIsProcessingCheckout(true);
    try {
      // Bridge local cart to Medusa cart for checkout
      // Since local products don't have Medusa variant IDs, we need to:
      // 1. First fetch Medusa products to get real variant IDs
      // 2. Create a Medusa cart
      // 3. Add items with real variant IDs
      
      console.log('Starting checkout bridge from local cart to Medusa...');
      
      // First, fetch Medusa products to get real variant IDs
      const medusaProductsResponse = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'}/store/products`, {
        method: 'GET',
        headers: {
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 'pk_01K4SYBMHRHG5QD6KFQBQYT9G4'
        }
      });

      if (!medusaProductsResponse.ok) {
        throw new Error('Failed to fetch Medusa products');
      }

      const { products: medusaProducts } = await medusaProductsResponse.json();
      console.log('Fetched Medusa products:', medusaProducts.length);

      // Create a Medusa cart
      const createCartResponse = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'}/store/carts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 'pk_01K4SYBMHRHG5QD6KFQBQYT9G4'
        },
        body: JSON.stringify({
          region_id: 'reg_01K3S6NDGAC1DSWH9MCZCWBWWD', // US region
          email: user?.email,
          currency_code: 'usd'
        })
      });

      if (!createCartResponse.ok) {
        throw new Error('Failed to create cart for checkout');
      }

      const { cart: medusaCart } = await createCartResponse.json();
      console.log('Created Medusa cart:', medusaCart.id);

      // For now, if we have Medusa products, add the first available variant for each item quantity
      // This is a temporary solution to get checkout working
      if (medusaProducts && medusaProducts.length > 0) {
        // Take the first product with variants as a placeholder
        const firstProductWithVariants = medusaProducts.find((p: any) => p.variants && p.variants.length > 0);
        
        if (firstProductWithVariants) {
          // Calculate total quantity from local cart
          const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
          
          // Add a single line item with the total quantity
          // Using the first variant from the first product as a placeholder
          const variantId = firstProductWithVariants.variants[0].id;
          
          console.log(`Adding ${totalQuantity} items with variant ID: ${variantId}`);
          
          const addItemResponse = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'}/store/carts/${medusaCart.id}/line-items`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 'pk_01K4SYBMHRHG5QD6KFQBQYT9G4'
            },
            body: JSON.stringify({
              variant_id: variantId,
              quantity: totalQuantity
            })
          });

          if (!addItemResponse.ok) {
            const errorText = await addItemResponse.text();
            console.error('Failed to add items to Medusa cart:', errorText);
          } else {
            console.log('Successfully added items to Medusa cart');
          }
        }
      }

      // Store the Medusa cart ID for the checkout page
      localStorage.setItem('medusa_cart_id', medusaCart.id);
      
      // Also store local cart info for display purposes
      const cartInfo = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          size: item.size,
          name: products.find(p => p.id === item.productId)?.name || 'Product',
          price: products.find(p => p.id === item.productId)?.price || 0
        })),
        total: cartSummary.totalPrice
      };
      localStorage.setItem('checkout_cart_info', JSON.stringify(cartInfo));
      
      // Navigate to checkout
      router.push('/checkout-stripe');
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to initialize checkout. Please try again.');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const handleGuestCheckout = async () => {
    if (!guestEmail) return;

    setIsProcessingCheckout(true);
    try {
      // Format items for unified checkout API
      const formattedItems = items.map(item => {
        const coreProduct = getCoreProductById(item.productId);
        
        // Check if it's an enhanced product (ID starts with 'enhanced_')
        const isEnhanced = item.productId.startsWith('enhanced_');
        
        if (coreProduct && coreProduct.stripe_price_id) {
          // Core product - use Stripe price ID
          return {
            id: item.productId,
            name: coreProduct.name,
            price: coreProduct.price, // Price in dollars
            quantity: item.quantity,
            selectedSize: item.size,
            stripePriceId: coreProduct.stripe_price_id,
            enhanced: isEnhanced
          };
        } else {
          // Enhanced or catalog product
          const product = products.find(p => p.id === item.productId);
          return {
            id: item.productId,
            name: product?.name || 'Unknown Product',
            price: item.price || 0, // Price already in cents
            quantity: item.quantity,
            selectedSize: item.size,
            enhanced: isEnhanced
          };
        }
      });

      // Call unified checkout API
      const response = await fetch('/api/checkout/unified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: formattedItems,
          customerEmail: guestEmail,
          successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/cart`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else if (data.sessionId) {
        // Fallback to client-side redirect
        const stripe = await stripePromise;
        if (stripe) {
          const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
          if (error) {
            console.error('Stripe redirect error:', error);
            alert('Unable to redirect to checkout. Please try again.');
          }
        }
      }
    } catch (error) {
      console.error('Guest checkout error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  // Main return for cart with items
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-gold mb-4">
            <div className="h-px w-12 bg-gold"></div>
            <span className="text-sm font-semibold tracking-widest uppercase">Your Selection</span>
            <div className="h-px w-12 bg-gold"></div>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif mb-4">Shopping Cart</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Review your carefully selected items before proceeding to checkout
          </p>
        </div>

        {/* Benefits Bar */}
        <CheckoutBenefits />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Clear Cart Button - for debugging */}
            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearAllCartData();
                  window.location.reload();
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Clear All Cart Data
              </Button>
            </div>
            {validCartItems.map((item) => {
              if (!item.product) return null;

              const variant = item.product.variants.find(v => v.size === item.size);
              const maxStock = variant?.stock || 0;

              return (
                <Card key={`${item.productId}-${item.size}`} className="p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300 relative group">
                  {/* Low Stock Badge */}
                  {variant && variant.stock <= 3 && variant.stock > 0 && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      Only {variant.stock} left!
                    </div>
                  )}
                  <div className="flex gap-6">
                    <div className="relative w-32 h-40 bg-gray-100 rounded-sm overflow-hidden shadow-md">
                      {item.product.images[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <div>
                          <Link 
                            href={`/products/${item.product.id}`}
                            className="text-xl font-serif font-semibold hover:text-gold transition-colors duration-200"
                          >
                            {item.product.name}
                          </Link>
                          <div className="text-sm text-gray-600 mt-1">
                            Size: {getSizeLabel(item.size)} • {item.product.category}
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.productId, item.size)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">Quantity:</span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.productId, item.size, Math.max(1, item.quantity - 1))}
                              disabled={item.quantity <= 1}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.productId, item.size, Math.min(maxStock, item.quantity + 1))}
                              disabled={item.quantity >= maxStock}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          {maxStock <= 5 && (
                            <span className="text-xs text-amber-600">
                              {maxStock} in stock
                            </span>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <div className="text-xl font-semibold">
                            {formatPrice(item.product.price * item.quantity)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatPrice(item.product.price)} each
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-white shadow-lg sticky top-8">
              <h2 className="text-2xl font-serif font-semibold mb-6 text-center">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({validCartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span className="font-medium">{formatPrice(cartSummary.subtotal)}</span>
                </div>
                
                {cartSummary.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span>{formatPrice(cartSummary.tax)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-green-600">
                    {cartSummary.subtotal >= 50000 ? 'FREE' : formatPrice(cartSummary.shipping)}
                  </span>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between text-xl font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(cartSummary.totalPrice)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {user ? (
                  <Button
                    onClick={handleCheckout}
                    disabled={isProcessingCheckout}
                    className="w-full py-3 bg-gold hover:bg-gold/90 text-black text-lg font-medium"
                  >
                    {isProcessingCheckout ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Secure Checkout - {formatPrice(cartSummary.totalPrice)}
                      </div>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleCheckout}
                      disabled={isProcessingCheckout}
                      className="w-full py-3 bg-gold hover:bg-gold/90 text-black text-lg font-medium"
                    >
                      {isProcessingCheckout ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Lock className="h-5 w-5" />
                          Sign In & Checkout
                        </div>
                      )}
                    </Button>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-2 text-gray-500">or</span>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => setShowGuestCheckout(!showGuestCheckout)}
                      className="w-full py-3"
                    >
                      Continue as Guest
                    </Button>
                    
                    {showGuestCheckout && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4 pt-4 border-t border-gray-200"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gold focus:border-transparent"
                          />
                        </div>
                        
                        <Button
                          onClick={handleGuestCheckout}
                          disabled={!isEmailValid || isProcessingCheckout}
                          className="w-full py-3 bg-gold hover:bg-gold/90 text-black font-medium disabled:opacity-50"
                        >
                          {isProcessingCheckout ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                              Processing...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Lock className="h-5 w-5" />
                              Complete Order - {formatPrice(cartSummary.totalPrice)}
                            </div>
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </>
                )}
              </div>

              {/* Security Notice */}
              <div className="mt-8 p-4 bg-green-50 rounded-sm border border-green-200">
                <div className="flex items-center gap-2 text-green-700 text-sm">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">Your payment is protected by 256-bit SSL encryption</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty cart component
function EmptyCart() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 text-gold mb-4">
          <div className="h-px w-12 bg-gold"></div>
          <span className="text-sm font-semibold tracking-widest uppercase">Your Selection</span>
          <div className="h-px w-12 bg-gold"></div>
        </div>
        <h1 className="text-4xl md:text-5xl font-serif mb-4">Shopping Cart</h1>
        <p className="text-gray-600 max-w-2xl mx-auto mb-8">
          Your cart is empty. Discover our luxury collection.
        </p>
        <Link href="/">
          <Button className="bg-gold hover:bg-gold/90 text-black px-8 py-3 text-lg font-medium">
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}
