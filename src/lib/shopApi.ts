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
 * The catalog endpoint only stores name, price, size, quantity and image, so
 * cosmetic fields (emoji, category, description, badge, …) have no backend
 * counterpart. On every reload `dtoToProduct` resets them to defaults — that's
 * why an edited emoji snapped back to 🥋. Carry over the locally-known
 * cosmetics for products we already have, matched by id.
 */
function withCosmetics(fresh: Product, prev: Product | undefined): Product {
  if (!prev) return fresh
  return {
    ...fresh,
    emoji: prev.emoji,
    category: prev.category,
    description: prev.description || fresh.description,
    badge: prev.badge ?? fresh.badge,
    freeShipping: prev.freeShipping ?? fresh.freeShipping,
    oldPriceCents: prev.oldPriceCents ?? fresh.oldPriceCents,
    rating: prev.rating || fresh.rating,
    reviews: prev.reviews || fresh.reviews,
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
  // Snapshot the cosmetics we already know (emoji, category, …) before replacing
  // the catalog, so a reload doesn't reset them to defaults.
  const prevById = new Map(
    useProductsStore.getState().products.map((p) => [p.id, p]),
  )
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
    .map((p) => withCosmetics(p, prevById.get(p.id)))
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
    // GET /Gyms/Catalog requires id_academia, so the reload must carry the gym.
    await listProducts(gymId).catch(() => {})
    // Reapply the edited product so its chosen cosmetics (emoji, category, …) —
    // which the backend doesn't persist — survive the reload.
    useProductsStore.getState().upsertProduct(product)
  } else {
    // The backend assigns the id on create, so diff the catalog before/after to
    // find the new product and attach the cosmetics chosen in the form.
    const before = new Set(useProductsStore.getState().products.map((p) => p.id))
    await api.post('/Gyms/Catalog/Creation', body)
    const list = await listProducts(gymId).catch(() => [] as Product[])
    const created = list.find((p) => !before.has(p.id))
    if (created) {
      useProductsStore.getState().upsertProduct({
        ...created,
        emoji: product.emoji,
        category: product.category,
        description: product.description,
        badge: product.badge,
        freeShipping: product.freeShipping,
        oldPriceCents: product.oldPriceCents,
      })
    }
  }
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
