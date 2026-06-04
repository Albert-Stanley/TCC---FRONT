import { useState, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Check } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { Badge } from '@/components/ui/Badge'
import { ProductThumb } from './ProductThumb'
import { Stars } from './Stars'
import { formatBRL } from '@/lib/format'
import type { Product } from '@/lib/shop'

/** Grid card: thumbnail, name, rating, price and a quick add-to-cart button. */
export function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate()
  const add = useCartStore((s) => s.add)
  const [added, setAdded] = useState(false)

  function handleAdd(e: MouseEvent) {
    e.stopPropagation()
    add(product.id, 1, product.sizes?.[0])
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/store/${product.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/store/${product.id}`)}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="relative">
        <ProductThumb product={product} className="aspect-square w-full" glyph="text-6xl" />
        {product.badge && (
          <Badge tone="primary" className="absolute left-3 top-3">
            {product.badge}
          </Badge>
        )}
        {product.freeShipping && !product.badge && (
          <span className="absolute right-3 top-3 rounded-full bg-surface/90 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-600 shadow-soft backdrop-blur">
            Frete grátis
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          {product.category}
        </p>
        <h3 className="line-clamp-2 text-sm font-bold leading-tight text-content">
          {product.name}
        </h3>
        <Stars rating={product.rating} reviews={product.reviews} className="mt-0.5" />

        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            {product.oldPriceCents && (
              <p className="text-xs text-muted line-through">
                {formatBRL(product.oldPriceCents)}
              </p>
            )}
            <p className="font-display text-lg font-extrabold text-content">
              {formatBRL(product.priceCents)}
            </p>
          </div>
          <button
            onClick={handleAdd}
            aria-label={`Adicionar ${product.name} ao carrinho`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-primary transition-all hover:bg-primary-dark active:scale-90"
          >
            {added ? <Check size={18} /> : <Plus size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
}
