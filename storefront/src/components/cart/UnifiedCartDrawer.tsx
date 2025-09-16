'use client';

import { useState, useEffect } from 'react';
import { useMedusaCart } from '@/contexts/MedusaCartContext';
import { useCoreCart } from '@/contexts/CoreCartContext';
import { X, ShoppingCart, Trash2, Plus, Minus, AlertCircle, Package, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useRouter } from 'next/navigation';
import { getCheckoutType } from '@/lib/config/product-routing';
import Image from 'next/image';
import { toast } from 'sonner';

export function UnifiedCartDrawer() {
  const router = useRouter();
  const medusaCart = useMedusaCart();
  const coreCart = useCoreCart();
  const { isCartOpen, setIsCartOpen } = useUIStore();
  const [dragProgress, setDragProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'core' | 'medusa'>('all');

  // Get items from both carts
  const coreItems = coreCart.items || [];
  const medusaItems = medusaCart.cart?.items || [];
  
  // Calculate totals
  const coreTotal = coreCart.getTotalPrice();
  const medusaTotal = medusaCart.getSubtotal();
  const totalPrice = coreTotal + medusaTotal;
  
  // Item counts
  const coreItemCount = coreCart.getTotalItems();
  const medusaItemCount = medusaCart.getItemCount();
  const totalItemCount = coreItemCount + medusaItemCount;

  // Determine checkout type
  const hasCoreItems = coreItemCount > 0;
  const hasMedusaItems = medusaItemCount > 0;
  const hasMixedCart = hasCoreItems && hasMedusaItems;

  // Auto-select tab based on cart contents
  useEffect(() => {
    if (hasCoreItems && !hasMedusaItems) {
      setActiveTab('core');
    } else if (hasMedusaItems && !hasCoreItems) {
      setActiveTab('medusa');
    } else {
      setActiveTab('all');
    }
  }, [hasCoreItems, hasMedusaItems]);

  // Haptic feedback
  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  // Close drawer on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        setIsCartOpen(false);
      }
    };

    if (isCartOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen, setIsCartOpen]);

  const handleDrag = (_: any, info: PanInfo) => {
    const progress = Math.max(0, Math.min(1, info.offset.x / 300));
    setDragProgress(progress);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 150 || info.velocity.x > 500) {
      setIsCartOpen(false);
      triggerHaptic(30);
    }
    setDragProgress(0);
  };

  const handleCoreCheckout = () => {
    setIsCartOpen(false);
    router.push('/checkout/core');
  };

  const handleMedusaCheckout = () => {
    setIsCartOpen(false);
    router.push('/checkout/medusa');
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  // Tab content renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'core':
        return renderCoreItems();
      case 'medusa':
        return renderMedusaItems();
      case 'all':
      default:
        return (
          <>
            {coreItemCount > 0 && renderCoreItems()}
            {medusaItemCount > 0 && renderMedusaItems()}
          </>
        );
    }
  };

  const renderCoreItems = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <ShoppingBag className="h-4 w-4" />
        <span>Premium Collection ({coreItemCount} items)</span>
      </div>
      {coreItems.map((item) => (
        <div key={`${item.id}-${item.size}`} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
          {item.image && (
            <div className="relative w-20 h-20 rounded overflow-hidden">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <h4 className="font-medium text-sm">{item.name}</h4>
            {item.size && (
              <p className="text-xs text-gray-600">Size: {item.size}</p>
            )}
            {item.color && (
              <p className="text-xs text-gray-600">Color: {item.color}</p>
            )}
            <p className="text-sm font-semibold mt-1">{formatPrice(item.price)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                coreCart.updateQuantity(item.id, item.quantity - 1, item.size);
                triggerHaptic();
              }}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <button
              onClick={() => {
                coreCart.updateQuantity(item.id, item.quantity + 1, item.size);
                triggerHaptic();
              }}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => {
                coreCart.removeItem(item.id, item.size);
                triggerHaptic([10, 50, 10]);
                toast.success('Item removed from cart');
              }}
              className="p-1 hover:bg-red-100 rounded ml-2 transition-colors"
              aria-label="Remove item"
            >
              <Trash2 size={16} className="text-red-600" />
            </button>
          </div>
        </div>
      ))}
      {activeTab === 'core' && (
        <div className="pt-4 border-t">
          <div className="flex justify-between font-medium mb-3">
            <span>Subtotal:</span>
            <span>{formatPrice(coreTotal)}</span>
          </div>
          <button
            onClick={handleCoreCheckout}
            className="w-full py-3 bg-burgundy-600 text-white rounded-lg hover:bg-burgundy-700 transition-colors"
          >
            Checkout Premium Collection
          </button>
        </div>
      )}
    </div>
  );

  const renderMedusaItems = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Package className="h-4 w-4" />
        <span>Extended Catalog ({medusaItemCount} items)</span>
      </div>
      {medusaItems.map((item) => (
        <div key={item.id} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
          {item.thumbnail && (
            <div className="relative w-20 h-20 rounded overflow-hidden">
              <Image
                src={item.thumbnail}
                alt={item.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <h4 className="font-medium text-sm">{item.title}</h4>
            <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
            <p className="text-sm font-semibold mt-1">{formatPrice(item.unit_price)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                medusaCart.updateQuantity(item.id, item.quantity - 1);
                triggerHaptic();
              }}
              disabled={medusaCart.isLoading}
              className="p-1 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <button
              onClick={() => {
                medusaCart.updateQuantity(item.id, item.quantity + 1);
                triggerHaptic();
              }}
              disabled={medusaCart.isLoading}
              className="p-1 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => {
                medusaCart.removeItem(item.id);
                triggerHaptic([10, 50, 10]);
                toast.success('Item removed from cart');
              }}
              disabled={medusaCart.isLoading}
              className="p-1 hover:bg-red-100 rounded ml-2 transition-colors disabled:opacity-50"
              aria-label="Remove item"
            >
              <Trash2 size={16} className="text-red-600" />
            </button>
          </div>
        </div>
      ))}
      {activeTab === 'medusa' && (
        <div className="pt-4 border-t">
          <div className="flex justify-between font-medium mb-3">
            <span>Subtotal:</span>
            <span>{formatPrice(medusaTotal)}</span>
          </div>
          <button
            onClick={handleMedusaCheckout}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Checkout Extended Catalog
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile: Floating Cart Icon */}
      {totalItemCount > 0 && (
        <motion.button
          onClick={() => {
            setIsCartOpen(true);
            triggerHaptic();
          }}
          className="fixed top-20 right-4 bg-burgundy-600 text-white p-3 rounded-full shadow-xl z-40 md:hidden hover:bg-burgundy-700 transition-all duration-200"
          aria-label={`Open shopping cart with ${totalItemCount} items`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ShoppingCart size={20} aria-hidden="true" />
          <motion.span 
            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-medium" 
            aria-hidden="true"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            key={totalItemCount}
          >
            {totalItemCount > 99 ? '99+' : totalItemCount}
          </motion.span>
        </motion.button>
      )}

      {/* Enhanced Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setIsCartOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Drawer */}
            <motion.div 
              className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              style={{ opacity: 1 - dragProgress * 0.3 }}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-semibold">Shopping Cart ({totalItemCount})</h2>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Close cart"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Tabs (only show if mixed cart) */}
                {hasMixedCart && (
                  <div className="flex border-b">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={cn(
                        "flex-1 py-2 px-4 text-sm font-medium transition-colors",
                        activeTab === 'all' 
                          ? "border-b-2 border-burgundy-600 text-burgundy-600" 
                          : "text-gray-600 hover:text-gray-900"
                      )}
                    >
                      All Items
                    </button>
                    <button
                      onClick={() => setActiveTab('core')}
                      className={cn(
                        "flex-1 py-2 px-4 text-sm font-medium transition-colors",
                        activeTab === 'core' 
                          ? "border-b-2 border-burgundy-600 text-burgundy-600" 
                          : "text-gray-600 hover:text-gray-900"
                      )}
                    >
                      Premium ({coreItemCount})
                    </button>
                    <button
                      onClick={() => setActiveTab('medusa')}
                      className={cn(
                        "flex-1 py-2 px-4 text-sm font-medium transition-colors",
                        activeTab === 'medusa' 
                          ? "border-b-2 border-blue-600 text-blue-600" 
                          : "text-gray-600 hover:text-gray-900"
                      )}
                    >
                      Catalog ({medusaItemCount})
                    </button>
                  </div>
                )}

                {/* Mixed Cart Warning */}
                {hasMixedCart && activeTab === 'all' && (
                  <div className="bg-amber-50 border-b border-amber-200 p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <p className="font-medium">Multiple Cart Types</p>
                        <p className="mt-1">You have items from both collections. These require separate checkouts.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4">
                  {totalItemCount === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Your cart is empty</p>
                      <button
                        onClick={() => {
                          setIsCartOpen(false);
                          router.push('/shop/catalog');
                        }}
                        className="mt-4 text-burgundy-600 hover:text-burgundy-700 font-medium"
                      >
                        Continue Shopping
                      </button>
                    </div>
                  ) : (
                    renderTabContent()
                  )}
                </div>

                {/* Footer with Checkout */}
                {totalItemCount > 0 && (
                  <div className="border-t p-4 space-y-3">
                    {activeTab === 'all' && (
                      <>
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total</span>
                          <span>{formatPrice(totalPrice)}</span>
                        </div>
                        
                        {hasMixedCart ? (
                          <div className="space-y-2">
                            {hasCoreItems && (
                              <button
                                onClick={handleCoreCheckout}
                                className="w-full py-3 bg-burgundy-600 text-white rounded-lg hover:bg-burgundy-700 transition-colors flex items-center justify-center gap-2"
                              >
                                <ShoppingBag className="h-4 w-4" />
                                Checkout Premium ({formatPrice(coreTotal)})
                              </button>
                            )}
                            {hasMedusaItems && (
                              <button
                                onClick={handleMedusaCheckout}
                                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                              >
                                <Package className="h-4 w-4" />
                                Checkout Catalog ({formatPrice(medusaTotal)})
                              </button>
                            )}
                            <p className="text-xs text-gray-500 text-center">
                              Complete one checkout, then return for the other
                            </p>
                          </div>
                        ) : (
                          <button
                            onClick={hasCoreItems ? handleCoreCheckout : handleMedusaCheckout}
                            className={cn(
                              "w-full py-3 text-white rounded-lg transition-colors",
                              hasCoreItems 
                                ? "bg-burgundy-600 hover:bg-burgundy-700" 
                                : "bg-blue-600 hover:bg-blue-700"
                            )}
                          >
                            Proceed to Checkout
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}