import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ShoppingBag,
  Check,
  Truck,
  ShieldCheck,
  RefreshCw,
  PackageX,
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProductThumb } from '@/components/shop/ProductThumb'
import { Stars } from '@/components/shop/Stars'
import { QuantityStepper } from '@/components/shop/QuantityStepper'
import { CartButton } from '@/components/shop/CartButton'
import { useCartStore } from '@/store/cartStore'
import { useProductsStore } from '@/store/productsStore'
import { formatBRL } from '@/lib/format'

const PERKS = [
  { icon: Truck, text: 'Envio para todo o Brasil' },
  { icon: ShieldCheck, text: 'Pagamento seguro via Stripe' },
  { icon: RefreshCw, text: 'Troca grátis em até 7 dias' },
]

export function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const add = useCartStore((s) => s.add)
  const product = useProductsStore((s) =>
    id ? s.products.find((p) => p.id === id) : undefined,
  )

  const [size, setSize] = useState<string | undefined>(product?.sizes?.[0])
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  if (!product) {
    return (
      <div className="flex flex-col">
        <Header title="Produto" />
        <div className="px-6 py-10">
          <EmptyState
            icon={PackageX}
            message="Produto não encontrado."
            action={{ label: 'Voltar à loja', onClick: () => navigate('/store') }}
          />
        </div>
      </div>
    )
  }

  function addToCart() {
    add(product!.id, qty, size)
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  function buyNow() {
    add(product!.id, qty, size)
    navigate('/cart')
  }

  return (
    <div className="flex flex-col">
      <Header title="Produto" right={<CartButton className="hover:bg-white/10 lg:hover:bg-content/10" />} />

      <div className="px-6 py-6">
        <div className="mx-auto grid w-full max-w-4xl items-start gap-6 lg:grid-cols-2 lg:gap-10">
          {/* Gallery */}
          <div className="relative">
            <ProductThumb
              product={product}
              className="aspect-square w-full rounded-3xl border border-line shadow-soft"
              glyph="text-[7rem]"
            />
            {product.badge && (
              <Badge tone="primary" className="absolute left-4 top-4">
                {product.badge}
              </Badge>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                {product.category}
              </p>
              <h1 className="mt-1 font-display text-2xl font-extrabold uppercase leading-tight tracking-tight text-content">
                {product.name}
              </h1>
              <Stars rating={product.rating} reviews={product.reviews} className="mt-2" />
            </div>

            <div className="flex items-end gap-3">
              <p className="font-display text-3xl font-extrabold text-content">
                {formatBRL(product.priceCents)}
              </p>
              {product.oldPriceCents && (
                <p className="pb-1 text-sm text-muted line-through">
                  {formatBRL(product.oldPriceCents)}
                </p>
              )}
            </div>

            {product.freeShipping && (
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                <Truck size={16} /> Frete grátis para este produto
              </p>
            )}

            {/* Sizes */}
            {product.sizes && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Tamanho
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`min-w-12 rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                        size === s
                          ? 'border-primary bg-primary-soft text-primary'
                          : 'border-line bg-surface text-content hover:border-content/30'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + actions */}
            <div className="flex items-center gap-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Qtd.
              </p>
              <QuantityStepper value={qty} onChange={setQty} />
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={buyNow}>Comprar agora</Button>
              <Button variant="secondary" onClick={addToCart}>
                {added ? <Check size={18} /> : <ShoppingBag size={18} />}
                {added ? 'Adicionado!' : 'Adicionar ao carrinho'}
              </Button>
            </div>

            {/* Description */}
            <Card className="flex flex-col gap-3">
              <h2 className="font-display text-sm font-bold uppercase tracking-tight text-content">
                Descrição
              </h2>
              <p className="text-sm leading-relaxed text-muted">
                {product.description}
              </p>
            </Card>

            {/* Perks */}
            <div className="flex flex-col gap-2.5">
              {PERKS.map(({ icon: Icon, text }, i) => (
                <p key={i} className="flex items-center gap-3 text-sm text-content">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Icon size={17} />
                  </span>
                  {text}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
