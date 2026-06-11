import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, ShoppingBag, X } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormError } from '@/components/ui/FormError'
import { useProductsStore } from '@/store/productsStore'
import { getErrorMessage } from '@/lib/api'
import { listProducts, saveProduct, deleteProduct } from '@/lib/shopApi'
import {
  CATEGORIES,
  CATEGORY_STYLE,
  type Product,
  type ShopCategory,
} from '@/lib/shop'
import { formatBRL } from '@/lib/format'

const EDITABLE_CATEGORIES = CATEGORIES.filter(
  (c): c is ShopCategory => c !== 'Todos',
)

interface FormState {
  name: string
  category: ShopCategory
  price: string
  stock: string
  image: string
  emoji: string
  description: string
  sizes: string
  badge: string
  freeShipping: boolean
}

const EMPTY_FORM: FormState = {
  name: '',
  category: 'Equipamentos',
  price: '',
  stock: '1',
  image: '',
  emoji: '🥋',
  description: '',
  sizes: '',
  badge: '',
  freeShipping: false,
}

/** Parses a BRL string ("249,90" / "249.90") into integer cents. */
function reaisToCents(v: string): number {
  const n = Number(
    v.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, ''),
  )
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}
function centsToReais(c: number): string {
  return (c / 100).toFixed(2).replace('.', ',')
}

function productToForm(p: Product): FormState {
  return {
    name: p.name,
    category: p.category,
    price: centsToReais(p.priceCents),
    stock: String(p.stock ?? 1),
    image: p.image ?? '',
    emoji: p.emoji,
    description: p.description,
    sizes: (p.sizes ?? []).join(', '),
    badge: p.badge ?? '',
    freeShipping: !!p.freeShipping,
  }
}

const fieldClass =
  'w-full rounded-2xl border border-line bg-surface px-4 text-[15px] text-content shadow-soft transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10'

export function ManageProducts() {
  const navigate = useNavigate()
  const products = useProductsStore((s) => s.products)

  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({})
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    void listProducts()
  }, [])

  const sorted = useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [products],
  )

  function openNew() {
    setForm(EMPTY_FORM)
    setEditingId('new')
    setError(null)
    setFieldErrors({})
  }
  function openEdit(p: Product) {
    setForm(productToForm(p))
    setEditingId(p.id)
    setError(null)
    setFieldErrors({})
  }
  function close() {
    setEditingId(null)
    setError(null)
    setFieldErrors({})
  }
  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setFieldErrors((e) => (e[key] ? { ...e, [key]: undefined } : e))
  }

  /** Mirrors the backend rules (CriarProdutoDTO): nome ≤100, preço ≤5000,
   *  quantidade 1–20, tamanho (joined) ≤20, imagem_url opcional/válida ≤500. */
  function validate(): Partial<Record<keyof FormState, string>> {
    const errors: Partial<Record<keyof FormState, string>> = {}

    const name = form.name.trim()
    if (!name) errors.name = 'Informe o nome do equipamento.'
    else if (name.length > 100)
      errors.name = 'O nome pode ter no máximo 100 caracteres.'

    const priceCents = reaisToCents(form.price)
    if (!form.price.trim() || priceCents <= 0)
      errors.price = 'Informe um preço maior que zero.'
    else if (priceCents > 5000 * 100)
      errors.price = 'O preço máximo é R$ 5.000,00.'

    const stock = Number(form.stock)
    if (!form.stock.trim() || !Number.isInteger(stock) || stock < 1 || stock > 20)
      errors.stock = 'Informe uma quantidade inteira entre 1 e 20.'

    const image = form.image.trim()
    if (image) {
      let valid = false
      try {
        const url = new URL(image)
        valid = url.protocol === 'http:' || url.protocol === 'https:'
      } catch {
        valid = false
      }
      if (!valid)
        errors.image = 'Informe uma URL válida começando com http:// ou https://.'
      else if (image.length > 500)
        errors.image = 'A URL da imagem pode ter no máximo 500 caracteres.'
    }

    const joinedSizes = form.sizes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .join('/')
    if (joinedSizes.length > 20)
      errors.sizes =
        'Os tamanhos somados podem ter no máximo 20 caracteres (ex.: P, M, G, GG).'

    return errors
  }

  async function submit() {
    setError(null)
    const errors = validate()
    setFieldErrors(errors)
    if (Object.values(errors).some(Boolean)) {
      setError('Corrija os campos destacados antes de salvar.')
      return
    }
    const priceCents = reaisToCents(form.price)

    const sizes = form.sizes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const existing =
      editingId !== 'new' ? products.find((p) => p.id === editingId) : undefined

    const product: Product = {
      id: existing?.id ?? '',
      name: form.name.trim(),
      category: form.category,
      priceCents,
      stock: Number(form.stock),
      image: form.image.trim() || undefined,
      emoji: form.emoji.trim() || '🥋',
      description: form.description.trim(),
      rating: existing?.rating ?? 0,
      reviews: existing?.reviews ?? 0,
      sizes: sizes.length ? sizes : undefined,
      badge: form.badge.trim() || undefined,
      freeShipping: form.freeShipping || undefined,
    }

    setSaving(true)
    try {
      await saveProduct(product)
      close()
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível salvar. Tente novamente.'))
    } finally {
      setSaving(false)
    }
  }

  async function remove(p: Product) {
    if (!window.confirm(`Excluir "${p.name}" da loja?`)) return
    setBusyId(p.id)
    try {
      await deleteProduct(p.id)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col">
      <Header
        title="Gerenciar loja"
        subtitle="Cadastre e edite os equipamentos à venda."
      />

      <div className="flex flex-col gap-4 px-6 py-6">
        {editingId !== null ? (
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold uppercase tracking-tight text-content">
                {editingId === 'new' ? 'Novo equipamento' : 'Editar equipamento'}
              </h2>
              <button
                onClick={close}
                aria-label="Fechar"
                className="text-muted transition-colors hover:text-content"
              >
                <X size={20} />
              </button>
            </div>

            <Input
              label="Nome"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Ex.: Luva de Boxe 14oz"
              maxLength={100}
              error={fieldErrors.name}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                  Categoria
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    update('category', e.target.value as ShopCategory)
                  }
                  className={`h-13 ${fieldClass}`}
                >
                  {EDITABLE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Preço"
                value={form.price}
                onChange={(e) => update('price', e.target.value)}
                inputMode="decimal"
                placeholder="0,00"
                leftSlot={<span className="text-sm font-semibold">R$</span>}
                error={fieldErrors.price}
              />
            </div>

            <Input
              label="Quantidade em estoque (1 a 20)"
              value={form.stock}
              onChange={(e) => update('stock', e.target.value)}
              inputMode="numeric"
              placeholder="1"
              error={fieldErrors.stock}
            />

            <div>
              <Input
                label="Imagem (URL)"
                value={form.image}
                onChange={(e) => update('image', e.target.value)}
                placeholder="https://.../foto.jpg"
                maxLength={500}
                error={fieldErrors.image}
              />
              {form.image.trim() && (
                <img
                  src={form.image.trim()}
                  alt="Prévia"
                  className="mt-2 h-28 w-28 rounded-xl border border-line object-cover"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Ícone (emoji)"
                value={form.emoji}
                onChange={(e) => update('emoji', e.target.value)}
                maxLength={4}
                placeholder="🥋"
              />
              <Input
                label="Selo (opcional)"
                value={form.badge}
                onChange={(e) => update('badge', e.target.value)}
                placeholder="Ex.: Mais vendido"
              />
            </div>

            <Input
              label="Tamanhos (separados por vírgula)"
              value={form.sizes}
              onChange={(e) => update('sizes', e.target.value)}
              placeholder="Ex.: P, M, G, GG"
              error={fieldErrors.sizes}
            />

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                Descrição
              </label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={3}
                placeholder="Detalhes do equipamento..."
                className={`py-3 ${fieldClass}`}
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={form.freeShipping}
                onChange={(e) => update('freeShipping', e.target.checked)}
                className="h-5 w-5 accent-primary"
              />
              <span className="text-sm text-content">Frete grátis</span>
            </label>

            {error && <FormError>{error}</FormError>}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={submit} loading={saving}>
                Salvar
              </Button>
              <Button variant="secondary" onClick={close}>
                Cancelar
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <Button onClick={openNew}>
              <Plus size={18} /> Novo equipamento
            </Button>

            {sorted.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                message="Nenhum equipamento cadastrado. Adicione o primeiro produto da loja."
              />
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {sorted.length} equipamento{sorted.length > 1 ? 's' : ''}
                </p>
                <div className="grid items-start gap-3 lg:grid-cols-2">
                  {sorted.map((p) => (
                    <Card key={p.id} className="flex items-center gap-3">
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-2xl ${CATEGORY_STYLE[p.category]}`}
                      >
                        {p.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-content">
                          {p.name}
                        </h3>
                        <p className="truncate text-xs text-muted">
                          {p.category} · {formatBRL(p.priceCents)}
                        </p>
                      </div>
                      <button
                        onClick={() => openEdit(p)}
                        aria-label={`Editar ${p.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:text-content active:bg-canvas"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => remove(p)}
                        disabled={busyId === p.id}
                        aria-label={`Excluir ${p.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:text-primary active:bg-canvas disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </Card>
                  ))}
                </div>
              </>
            )}

            <Button variant="ghost" onClick={() => navigate('/store')}>
              Ver a loja
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
