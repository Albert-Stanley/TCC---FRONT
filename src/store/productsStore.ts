import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/lib/shop'

/**
 * Editable shop catalog — the live source of truth for both the storefront and
 * the teacher CRUD. Seeded from the bundled demo catalog (`PRODUCTS`) on first
 * run and persisted, so changes made in "Gerenciar loja" survive reloads and
 * show up immediately on the customer-facing store.
 *
 * When the products API lands, keep this store but populate/sync it through
 * `src/lib/shopApi.ts` instead of the static seed.
 */
interface ProductsState {
  products: Product[]
  setProducts: (products: Product[]) => void
  /** Inserts a new product or replaces the existing one with the same id. */
  upsertProduct: (product: Product) => void
  removeProduct: (id: string) => void
  /** Re-seeds the catalog from the bundled defaults. */
  resetCatalog: () => void
}

export const useProductsStore = create<ProductsState>()(
  persist(
    (set) => ({
      products: [],
      setProducts: (products) => set({ products }),
      upsertProduct: (product) =>
        set((s) => {
          const exists = s.products.some((p) => p.id === product.id)
          return {
            products: exists
              ? s.products.map((p) => (p.id === product.id ? product : p))
              : [product, ...s.products],
          }
        }),
      removeProduct: (id) =>
        set((s) => ({ products: s.products.filter((p) => p.id !== id) })),
      resetCatalog: () => set({ products: [] }),
    }),
    { name: 'kravconnect-products' },
  ),
)
