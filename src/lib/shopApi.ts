import { useProductsStore } from '@/store/productsStore'
import type { Product } from '@/lib/shop'

/**
 * Shop data layer — the single seam between the UI and the catalog source.
 *
 * Today every call is served from the local `productsStore` (mock catalog), so
 * the whole shop works without a backend. When the products API is available,
 * swap each function body for the matching `api` call (confirm the real paths
 * with the backend — they are NOT in the authoritative endpoint map yet) and
 * the rest of the app — storefront and the teacher CRUD — keeps working
 * unchanged. A typical real implementation would also keep `productsStore` as a
 * cache, updating it after each successful request.
 */

/** Lists the full catalog. */
export async function listProducts(): Promise<Product[]> {
  // BACKEND: return asList<Product>((await api.get('/Shop/Products')).data)
  return useProductsStore.getState().products
}

/** Creates a product (when new) or updates the existing one with the same id. */
export async function saveProduct(product: Product): Promise<Product> {
  // BACKEND: const { data } = await api.post('/Shop/Products', product)
  //          useProductsStore.getState().upsertProduct(data); return data
  useProductsStore.getState().upsertProduct(product)
  return product
}

/** Deletes a product by id. */
export async function deleteProduct(id: string): Promise<void> {
  // BACKEND: await api.delete(`/Shop/Products/${id}`)
  useProductsStore.getState().removeProduct(id)
}
