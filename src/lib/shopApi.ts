import { api, asList } from '@/lib/api'
import { useProductsStore } from '@/store/productsStore'
import { useOrderStore } from '@/store/orderStore'
import { sendOrderConfirmation } from '@/lib/mailer'
import type { Order, Product, ShopCategory } from '@/lib/shop'

/**
 * Shop data layer — the single seam between the UI and the backend catalog.
 *
 * The backend catalog is minimal: { id_produto, nome, preco, tamanho,
 * quantidade }. The rich storefront fields (category, emoji, rating, reviews,
 * description) have no backend counterpart and are filled with sensible
 * defaults here, so the UI keeps working. The backend has no order/checkout
 * endpoint, so "placing an order" signals interest per item instead.
 */

interface ProdutoDTO {
  id_produto: string
  nome: string
  preco: number
  tamanho?: string
  quantidade?: number
  imagem_url?: string
}

const DEFAULT_CATEGORY: ShopCategory = 'Equipamentos'

/** Backend ProdutoDTO → front Product (cosmetic fields get defaults). */
function dtoToProduct(d: ProdutoDTO): Product {
  return {
    id: d.id_produto,
    name: d.nome,
    category: DEFAULT_CATEGORY,
    priceCents: Math.round((d.preco ?? 0) * 100),
    emoji: '🥋',
    rating: 0,
    reviews: 0,
    description: '',
    sizes: d.tamanho ? d.tamanho.split('/').filter(Boolean) : undefined,
    stock: d.quantidade,
    image: d.imagem_url || undefined,
  }
}

/**
 * Lists a gym's catalog (GET /Gyms/Catalog) and caches it. When `gymId` is
 * given it is sent as `?id_academia=` so the user can browse the store of a
 * specific gym they belong to; without it the backend falls back to the user's
 * first gym.
 */
export async function listProducts(gymId?: string): Promise<Product[]> {
  const { data } = await api.get('/Gyms/Catalog', {
    params: gymId ? { id_academia: gymId } : undefined,
  })
  // Deduplica por id: o catálogo pode vir com produtos repetidos e eles
  // apareciam duplicados na vitrine e no gerenciador.
  const seen = new Set<string>()
  const products = asList<ProdutoDTO>(data)
    .map(dtoToProduct)
    .filter((p) => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })
  useProductsStore.getState().setProducts(products)
  return products
}

/**
 * Creates (no id) or updates (has id) a product. The backend requires a single
 * `tamanho` and a `quantidade` (1–20), so the sizes array is joined and the
 * stock is clamped. Reloads the catalog so created products get their real id.
 */
export async function saveProduct(product: Product, gymId?: string): Promise<Product> {
  const body = {
    nome: product.name,
    preco: product.priceCents / 100,
    tamanho: (product.sizes ?? []).join('/').slice(0, 20) || 'Único',
    quantidade: Math.min(Math.max(product.stock ?? 1, 1), 20),
    imagem_url: product.image ?? '',
  }
  if (product.id) {
    await api.put('/Gyms/Catalog/Update', { id_produto: product.id, ...body })
  } else {
    await api.post('/Gyms/Catalog/Creation', body)
  }
  // GET /Gyms/Catalog requires id_academia, so the reload must carry the gym.
  await listProducts(gymId).catch(() => {})
  return product
}

/** Deletes a product (DELETE /Gyms/Catalog/{id}). */
export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/Gyms/Catalog/${encodeURIComponent(id)}`)
  useProductsStore.getState().removeProduct(id)
}

/**
 * No order/checkout endpoint exists on the backend, so each cart item is sent
 * as an interest signal (POST /Student/Interest). The order is still recorded
 * locally and the confirmation e-mail is sent best-effort.
 */
export async function placeOrder(order: Order): Promise<Order> {
  for (const item of order.items) {
    await api
      .post('/Student/Interest', {
        id_produto: item.productId,
        quantidade: item.qty,
      })
      .catch(() => {})
  }
  useOrderStore.getState().addOrder(order)
  await sendOrderConfirmation(order).catch(() => {})
  return order
}
