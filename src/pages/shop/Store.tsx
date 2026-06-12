import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Search, ShoppingBag, Truck, Settings, Building2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useProductsStore } from '@/store/productsStore'
import { listProducts } from '@/lib/shopApi'
import { Header } from '@/components/layout/Header'
import { Hero } from '@/components/ui/Hero'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { CartButton } from '@/components/shop/CartButton'
import { ProductCard } from '@/components/shop/ProductCard'
import { CATEGORIES } from '@/lib/shop'
import { formatBRL } from '@/lib/format'
import { FREE_SHIPPING_FROM } from '@/lib/shop'

export function Store() {
  const navigate = useNavigate()
  const { gymId } = useParams<{ gymId: string }>()
  const isTeacher = useAuthStore((s) => s.user?.role === 'teacher')
  const academias = useAuthStore((s) => s.user?.academias ?? [])
  const allProducts = useProductsStore((s) => s.products)
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Todos')
  const [query, setQuery] = useState('')

  // The store always carries the chosen gym in the URL (/store/:gymId). When
  // it's missing, redirect to the user's first gym so the URL stays canonical.
  const activeGymId = gymId ?? academias[0]?.id

  useEffect(() => {
    if (!gymId && activeGymId) {
      navigate(`/store/${activeGymId}`, { replace: true })
    }
  }, [gymId, activeGymId, navigate])

  useEffect(() => {
    if (activeGymId) void listProducts(activeGymId)
  }, [activeGymId])

  const products = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allProducts.filter((p) => {
      const matchesCategory = category === 'Todos' || p.category === category
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })
  }, [category, query, allProducts])

  return (
    <div className="flex flex-col">
      <Header
        title="Loja"
        subtitle="Equipamentos e vestuário de Krav Maga."
        back={false}
        right={
          <div className="flex items-center gap-1">
            {isTeacher && (
              <button
                onClick={() => navigate('/store/manage')}
                aria-label="Gerenciar loja"
                className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/10 lg:hover:bg-content/10"
              >
                <Settings size={20} />
              </button>
            )}
            <CartButton className="hover:bg-white/10 lg:hover:bg-content/10" />
          </div>
        }
      />

      <div className="flex flex-col gap-5 px-6 py-6">
        {/* Gym store picker — choose which gym's catalog to browse. */}
        {academias.length > 1 && (
          <label className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-soft">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Building2 size={18} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Loja da academia
              </span>
              <select
                value={activeGymId ?? ''}
                onChange={(e) => navigate(`/store/${e.target.value}`)}
                className="-ml-0.5 w-full truncate bg-transparent text-[15px] font-semibold text-content focus:outline-none"
              >
                {academias.map((a) => (
                  <option key={`${a.id}-${a.vinculo}`} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </select>
            </span>
          </label>
        )}

        {/* Promo banner */}
        <Hero variant="card" className="!py-6">
          <Badge tone="primary">Loja oficial</Badge>
          <h2 className="mt-2 font-display text-xl font-extrabold uppercase leading-tight tracking-tight">
            Equipe-se para o tatame
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/70">
            <Truck size={15} className="text-primary" />
            Frete grátis acima de {formatBRL(FREE_SHIPPING_FROM)}
          </p>
        </Hero>

        {/* Search */}
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute inset-y-0 left-4 my-auto text-muted"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar produtos"
            placeholder="Buscar produtos..."
            className="h-13 w-full rounded-2xl border border-line bg-surface pl-11 pr-4 text-[15px] text-content shadow-soft transition-all placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
          />
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
                category === c
                  ? 'bg-primary text-white shadow-primary'
                  : 'border border-line bg-surface text-muted hover:text-content'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Product grid */}
        {products.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            message="Nenhum produto encontrado para essa busca."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
