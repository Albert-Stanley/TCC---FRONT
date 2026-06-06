import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Order } from '@/lib/shop'

/**
 * Local record of placed orders (most recent first). Persisted so the purchase
 * history survives reloads and can power a future "Meus pedidos" screen. When
 * the orders API lands, keep this as a cache fed by `shopApi.placeOrder`.
 */
interface OrderState {
  orders: Order[]
  addOrder: (order: Order) => void
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      orders: [],
      addOrder: (order) => set((s) => ({ orders: [order, ...s.orders] })),
    }),
    { name: 'kravconnect-orders' },
  ),
)
