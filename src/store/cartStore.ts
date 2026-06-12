import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { FREE_SHIPPING_FROM, SHIPPING_FEE, type Product } from '@/lib/shop'
import { useProductsStore } from '@/store/productsStore'

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

/**
 * Available stock for a product id, or `undefined` when unknown (e.g. the demo
 * catalog has no stock) — in which case no cap is applied.
 */
function stockOf(id: string): number | undefined {
  return useProductsStore.getState().products.find((p) => p.id === id)?.stock
}

/** Caps a desired quantity to the product's stock, when known. */
function capToStock(id: string, qty: number): number {
  const stock = stockOf(id)
  return stock != null ? Math.min(qty, Math.max(stock, 0)) : qty
}

/** Persisted shopping cart, mirroring the other Zustand+persist stores. */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (id, qty = 1, size) =>
        set((s) => {
          const existing = s.items.find((i) => i.id === id)
          // Never let the cart hold more than what's in stock.
          const nextQty = capToStock(id, (existing?.qty ?? 0) + qty)
          if (nextQty <= 0) return s // esgotado: nada a adicionar
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.id === id ? { ...i, qty: nextQty, size: size ?? i.size } : i,
              ),
            }
          }
          return { items: [...s.items, { id, qty: nextQty, size }] }
        }),
      setQty: (id, qty) =>
        set((s) => {
          const capped = capToStock(id, qty)
          return {
            items:
              capped <= 0
                ? s.items.filter((i) => i.id !== id)
                : s.items.map((i) => (i.id === id ? { ...i, qty: capped } : i)),
          }
        }),
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
  const products = useProductsStore.getState().products
  const lines: CartLine[] = []
  for (const i of items) {
    const product = products.find((p) => p.id === i.id)
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
