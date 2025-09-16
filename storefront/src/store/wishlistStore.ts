import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { MedusaProduct } from '@/services/medusaBackendService'

interface WishlistItem {
  id: string
  product: MedusaProduct
  addedAt: Date
}

interface WishlistStore {
  items: WishlistItem[]
  isLoading: boolean
  
  // Actions
  addItem: (product: MedusaProduct) => void
  removeItem: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  toggleItem: (product: MedusaProduct) => void
  clearWishlist: () => void
  getItemCount: () => number
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      
      addItem: (product) => {
        set((state) => {
          // Check if already in wishlist
          if (state.items.some(item => item.id === product.id)) {
            return state
          }
          
          return {
            items: [
              ...state.items,
              {
                id: product.id,
                product,
                addedAt: new Date()
              }
            ]
          }
        })
      },
      
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== productId)
        }))
      },
      
      isInWishlist: (productId) => {
        return get().items.some(item => item.id === productId)
      },
      
      toggleItem: (product) => {
        const isInList = get().isInWishlist(product.id)
        if (isInList) {
          get().removeItem(product.id)
        } else {
          get().addItem(product)
        }
      },
      
      clearWishlist: () => {
        set({ items: [] })
      },
      
      getItemCount: () => {
        return get().items.length
      }
    }),
    {
      name: 'kct-wishlist',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }), // Only persist items
    }
  )
)