import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, ShoppingCart, Truck, ArrowRight } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProductThumb } from '@/components/shop/ProductThumb'
import { QuantityStepper } from '@/components/shop/QuantityStepper'
import { useCartStore, buildCart } from '@/store/cartStore'
import { useProductsStore } from '@/store/productsStore'
import { formatBRL } from '@/lib/format'
import { FREE_SHIPPING_FROM } from '@/lib/shop'

export function Cart() {
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const setQty = useCartStore((s) => s.setQty)
  const remove = useCartStore((s) => s.remove)

  // Reconcile quantities that exceed current stock (e.g. the catalog was
  // updated after the item was added). setQty itself caps to stock.
  useEffect(() => {
    const products = useProductsStore.getState().products
    for (const i of items) {
      const stock = products.find((p) => p.id === i.id)?.stock
      if (stock != null && i.qty > stock) setQty(i.id, stock)
    }
  }, [items, setQty])

  const { lines, subtotalCents, shippingCents, totalCents, freeShipping } =
    buildCart(items)

  if (lines.length === 0) {
    return (
      <div className="flex flex-col">
        <Header title="Carrinho" backTo="/store" />
        <div className="px-6 py-10">
          <EmptyState
            icon={ShoppingCart}
            message="Seu carrinho está vazio. Que tal equipar-se para o próximo treino?"
            action={{ label: 'Ir à loja', onClick: () => navigate('/store') }}
          />
        </div>
      </div>
    )
  }

  const missingForFree = FREE_SHIPPING_FROM - subtotalCents

  return (
    <div className="flex flex-col">
      <Header title="Carrinho" backTo="/store" />

      <div className="px-6 py-6">
        <div className="mx-auto grid w-full max-w-4xl items-start gap-6 lg:grid-cols-[1fr_20rem] lg:gap-8">
          {/* Items */}
          <div className="flex flex-col gap-3">
            {lines.map(({ product, qty, size, lineCents }) => (
              <Card key={product.id} className="flex gap-3 p-3">
                <ProductThumb
                  product={product}
                  className="h-20 w-20 shrink-0 rounded-2xl"
                  glyph="text-3xl"
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-content">
                        {product.name}
                      </h3>
                      <p className="text-xs text-muted">
                        {product.category}
                        {size ? ` · Tam. ${size}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => remove(product.id)}
                      aria-label={`Remover ${product.name}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:text-primary"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-auto flex items-end justify-between pt-2">
                    <QuantityStepper
                      value={qty}
                      size="sm"
                      max={product.stock}
                      onChange={(v) => setQty(product.id, v)}
                    />
                    <p className="font-display text-base font-extrabold text-content">
                      {formatBRL(lineCents)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Summary */}
          <div className="flex flex-col gap-3 lg:sticky lg:top-28">
            <Card className="flex flex-col gap-4">
              <h2 className="font-display text-sm font-bold uppercase tracking-tight text-content">
                Resumo
              </h2>

              {!freeShipping && missingForFree > 0 && (
                <p className="flex items-start gap-2 rounded-xl bg-primary-soft px-3 py-2.5 text-xs font-medium text-primary">
                  <Truck size={15} className="mt-0.5 shrink-0" />
                  Faltam {formatBRL(missingForFree)} para o frete grátis.
                </p>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-semibold text-content">
                    {formatBRL(subtotalCents)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Frete</span>
                  <span className="font-semibold text-content">
                    {shippingCents === 0 ? 'Grátis' : formatBRL(shippingCents)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-line pt-2">
                  <span className="font-bold text-content">Total</span>
                  <span className="font-display text-xl font-extrabold text-content">
                    {formatBRL(totalCents)}
                  </span>
                </div>
              </div>

              <Button onClick={() => navigate('/checkout')}>
                Finalizar compra
                <ArrowRight size={18} />
              </Button>
            </Card>

            <Button variant="ghost" onClick={() => navigate('/store')}>
              Continuar comprando
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
