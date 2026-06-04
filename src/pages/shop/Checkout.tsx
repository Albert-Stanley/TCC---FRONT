import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, QrCode, CreditCard, MapPin, ShoppingCart } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProductThumb } from '@/components/shop/ProductThumb'
import { useAuthStore } from '@/store/authStore'
import { useCartStore, buildCart } from '@/store/cartStore'
import { formatBRL, maskCep } from '@/lib/format'

type Method = 'pix' | 'card'

export function Checkout() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const items = useCartStore((s) => s.items)
  const clear = useCartStore((s) => s.clear)

  const { lines, subtotalCents, shippingCents, totalCents } = buildCart(items)

  const [name, setName] = useState(user?.name ?? '')
  const [cep, setCep] = useState(maskCep(user?.cep ?? ''))
  const [address, setAddress] = useState('')
  const [method, setMethod] = useState<Method>('pix')
  const [processing, setProcessing] = useState(false)
  const [order, setOrder] = useState<{ id: string; total: number } | null>(null)

  // Confirmation screen.
  if (order) {
    return (
      <div className="flex flex-col">
        <Header title="Pedido" back={false} />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-6 py-12 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={38} />
          </span>
          <h1 className="mt-5 font-display text-2xl font-extrabold uppercase tracking-tight text-content">
            Pedido confirmado!
          </h1>
          <p className="mt-2 text-sm text-muted">
            Pedido <span className="font-semibold text-content">{order.id}</span> no
            valor de {formatBRL(order.total)}. Você receberá os detalhes de
            entrega por e-mail.
          </p>
          <div className="mt-8 flex w-full flex-col gap-3">
            <Button onClick={() => navigate('/store')}>Voltar à loja</Button>
            <Button variant="secondary" onClick={() => navigate('/home')}>
              Ir ao início
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col">
        <Header title="Checkout" backTo="/store" />
        <div className="px-6 py-10">
          <EmptyState
            icon={ShoppingCart}
            message="Não há itens para finalizar."
            action={{ label: 'Ir à loja', onClick: () => navigate('/store') }}
          />
        </div>
      </div>
    )
  }

  async function handlePay(e: FormEvent) {
    e.preventDefault()
    setProcessing(true)
    // Simulate the Abacate Pay round-trip (no products endpoint in the API map).
    await new Promise((r) => setTimeout(r, 1100))
    clear()
    setOrder({
      id: `#KC${Math.floor(1000 + Math.random() * 9000)}`,
      total: totalCents,
    })
  }

  const methods: { key: Method; label: string; desc: string; icon: typeof QrCode }[] = [
    { key: 'pix', label: 'Pix', desc: 'Aprovação imediata', icon: QrCode },
    { key: 'card', label: 'Cartão', desc: 'Até 12x', icon: CreditCard },
  ]

  return (
    <div className="flex flex-col">
      <Header title="Checkout" backTo="/cart" />

      <form onSubmit={handlePay} className="px-6 py-6">
        <div className="mx-auto grid w-full max-w-4xl items-start gap-6 lg:grid-cols-[1fr_20rem] lg:gap-8">
          {/* Delivery + payment */}
          <div className="flex flex-col gap-5">
            <Card className="flex flex-col gap-4">
              <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-tight text-content">
                <MapPin size={16} className="text-primary" /> Entrega
              </h2>
              <Input
                name="name"
                label="Nome completo"
                placeholder="Seu nome"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                name="cep"
                label="CEP"
                placeholder="00000-000"
                inputMode="numeric"
                required
                value={cep}
                onChange={(e) => setCep(maskCep(e.target.value))}
              />
              <Input
                name="address"
                label="Endereço e número"
                placeholder="Rua, nº, complemento"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </Card>

            <Card className="flex flex-col gap-4">
              <h2 className="font-display text-sm font-bold uppercase tracking-tight text-content">
                Pagamento
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {methods.map(({ key, label, desc, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMethod(key)}
                    className={`flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-all ${
                      method === key
                        ? 'border-primary bg-primary-soft'
                        : 'border-line bg-surface hover:border-content/30'
                    }`}
                  >
                    <Icon
                      size={20}
                      className={method === key ? 'text-primary' : 'text-muted'}
                    />
                    <span className="text-sm font-bold text-content">{label}</span>
                    <span className="text-xs text-muted">{desc}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Order summary */}
          <div className="flex flex-col gap-3 lg:sticky lg:top-28">
            <Card className="flex flex-col gap-4">
              <h2 className="font-display text-sm font-bold uppercase tracking-tight text-content">
                Seu pedido
              </h2>

              <div className="flex flex-col gap-3">
                {lines.map(({ product, qty, size, lineCents }) => (
                  <div key={product.id} className="flex items-center gap-3">
                    <ProductThumb
                      product={product}
                      className="h-11 w-11 shrink-0 rounded-xl"
                      glyph="text-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-content">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted">
                        {qty}× {size ? `· ${size}` : ''}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-content">
                      {formatBRL(lineCents)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-line pt-3 text-sm">
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

              <Badge tone="soft" className="self-start">
                Pagamento seguro · Abacate Pay
              </Badge>

              <Button type="submit" loading={processing}>
                Pagar {formatBRL(totalCents)}
              </Button>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
