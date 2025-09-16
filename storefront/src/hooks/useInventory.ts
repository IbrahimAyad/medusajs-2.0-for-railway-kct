// TEMPORARILY DISABLED - This file uses Supabase which is being migrated to Medusa
// TODO: Replace with Medusa inventory API calls

import { useEffect, useState } from 'react';

interface InventoryItem {
  id: string;
  product_id: string;
  size: string;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  low_stock_threshold: number;
}

export function useInventory(productId: string) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Disabled - No Supabase connection
  useEffect(() => {
    // Inventory functionality disabled during migration
    setLoading(false);
  }, [productId]);

  const fetchInventory = async () => {
    // Disabled during migration
    setLoading(false);
  };

  const checkAvailability = (size: string, quantity: number): boolean => {
    // Temporarily return true during migration
    return true;
  };

  const getAvailableStock = (size: string): number => {
    // Temporarily return high number during migration
    return 100;
  };

  const isLowStock = (size: string): boolean => {
    // Temporarily return false during migration
    return false;
  };

  return {
    inventory,
    loading,
    error,
    checkAvailability,
    getAvailableStock,
    isLowStock,
    refetch: fetchInventory,
  };
}

export function useCartInventory() {
  const reserveInventory = async (
    cartId: string,
    productId: string,
    size: string,
    quantity: number
  ): Promise<boolean> => {
    // Temporarily return true during migration
    return true;
  };

  const releaseCartReservations = async (cartId: string): Promise<void> => {
    // Disabled during migration
  };

  return {
    reserveInventory,
    releaseCartReservations,
  };
}