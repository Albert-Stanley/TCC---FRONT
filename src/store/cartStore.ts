import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  PRODUCTS,
  FREE_SHIPPING_FROM,
  SHIPPING_FEE,
  type Product,
} from '@/lib/shop'

export interface CartItem {
  id: string
  qty: number
  /** Selected size, when the product has size options. */
  size?: string
}

interface CartState {
  items: CartItem[]
  add: (id: string, qty?: number, size?: string) => void
  setQty: (id: string, qty: number) => void
  remove: (id: string) => void
  clear: () => void
}

/** Persisted shopping cart, mirroring the other Zustand+persist stores. */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (id, qty = 1, size) =>
        set((s) => {
          const existing = s.items.find((i) => i.id === id)
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.id === id ? { ...i, qty: i.qty + qty, size: size ?? i.size } : i,
              ),
            }
          }
          return { items: [...s.items, { id, qty, size }] }
        }),
      setQty: (id, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.id !== id)
              : s.items.map((i) => (i.id === id ? { ...i, qty } : i)),
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'kravconnect-cart' },
  ),
)

/** Total number of units in the cart (for the nav/cart badge). */
export const useCartCount = () =>
  useCartStore((s) => s.items.reduce((n, i) => n + i.qty, 0))

export interface CartLine {
  product: Product
  qty: number
  size?: string
  lineCents: number
}

/** Resolves cart items to their products and computes order totals. */
export function buildCart(items: CartItem[]) {
  const lines: CartLine[] = []
  for (const i of items) {
    const product = PRODUCTS.find((p) => p.id === i.id)
    if (!product) continue
    lines.push({
      product,
      qty: i.qty,
      size: i.size,
      lineCents: product.priceCents * i.qty,
    })
  }

  const subtotalCents = lines.reduce((sum, l) => sum + l.lineCents, 0)
  const freeShipping = subtotalCents === 0 || subtotalCents >= FREE_SHIPPING_FROM
  const shippingCents = freeShipping ? 0 : SHIPPING_FEE
  const totalCents = subtotalCents + shippingCents

  return { lines, subtotalCents, shippingCents, totalCents, freeShipping }
}
