import { useEffect, useState, type FormEvent } from 'react'
import { GraduationCap, Plus, Clock, CalendarDays, Pencil, X, Check } from 'lucide-react'
import { api, asList, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { InfoNote } from '@/components/ui/InfoNote'
import { FormError } from '@/components/ui/FormError'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatWallDate, formatWallTime, toDateTimeLocal } from '@/lib/format'

const BELTS = ['Branca', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Marrom', 'Preta']

interface Aula {
  id_aula: string
  conteudo?: string
  data_aula?: string
  faixa?: string
}

/**
 * Manage classes. Each class is created via POST /Gyms/Classes/Creation and
 * edited via PUT /Gyms/Classes/Update, both with a single content text, a
 * date/time and the target belt (faixa). The class list comes from
 * GET /Gyms/Classes (the teacher's academia).
 */
export function Classes() {
  // Instructors (instrutor) can create classes but the backend's list endpoint
  // (GET /Gyms/Classes) is professor-only, so for them we skip listing/editing
  // and show just the creation form with a success confirmation.
  const isInstructor = useAuthStore((s) => s.user?.role === 'instructor')

  const [aulas, setAulas] = useState<Aula[]>([])
  const [conteudo, setConteudo] = useState('')
  const [dataAula, setDataAula] = useState('')
  const [faixa, setFaixa] = useState('Branca')
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** Id da aula em edição, ou null quando o formulário está criando uma nova. */
  const [editingId, setEditingId] = useState<string | null>(null)
  /** Optional AAAA-MM-DD filter passed as ?data= to GET /Gyms/Classes. */
  const [filterDate, setFilterDate] = useState('')

  async function load(date = filterDate) {
    try {
      const { data } = await api.get('/Gyms/Classes', {
        params: date ? { data: date } : undefined,
      })
      setAulas(asList<Aula>(data))
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível carregar as aulas.'))
    }
  }

  useEffect(() => {
    if (isInstructor) return // sem listagem para instrutor (endpoint só-professor)
    void load(filterDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDate, isInstructor])

  function resetForm() {
    setConteudo('')
    setDataAula('')
    setFaixa('Branca')
    setEditingId(null)
  }

  /** Carrega uma aula existente no formulário para edição. */
  function startEdit(a: Aula) {
    setEditingId(a.id_aula)
    setConteudo(a.conteudo ?? '')
    setDataAula(toDateTimeLocal(a.data_aula))
    setFaixa(a.faixa ?? 'Branca')
    setError(null)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submitClass(e: FormEvent) {
    e.preventDefault()
    if (!conteudo.trim() || !dataAula) return
    setCreating(true)
    setError(null)
    try {
      // Backend expects "AAAA-MM-DD HH:MM"; the datetime-local input uses a "T".
      const body = {
        conteudo: conteudo.trim(),
        data_aula: dataAula.replace('T', ' '),
        faixa,
      }
      if (editingId) {
        await api.put('/Gyms/Classes/Update', { id_aula: editingId, ...body })
      } else {
        await api.post('/Gyms/Classes/Creation', body)
      }
      resetForm()
      if (isInstructor) {
        setCreated(true)
        setTimeout(() => setCreated(false), 2500)
      } else {
        await load()
      }
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          editingId
            ? 'Não foi possível atualizar a aula.'
            : 'Não foi possível criar a aula.',
        ),
      )
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col">
      <Header title="Aulas" backTo="/home" />

      <div className="flex flex-col gap-6 px-6 py-6">
        <SectionTitle underline>{editingId ? 'Editar aula' : 'Nova aula'}</SectionTitle>

        {error && <FormError>{error}</FormError>}

        <form onSubmit={submitClass}>
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-white dark:bg-white/10">
                <GraduationCap size={20} />
              </span>
              <h3 className="flex-1 font-display text-sm font-bold uppercase tracking-tight text-content">
                {editingId ? 'Editar aula' : 'Criar aula'}
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted transition-colors hover:text-content"
                >
                  <X size={15} /> Cancelar
                </button>
              )}
            </div>
            <Input
              name="conteudo"
              label="Conteúdo da aula"
              placeholder="Ex: Defesa contra estrangulamento frontal"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                name="dataAula"
                type="datetime-local"
                label="Data e hora"
                value={dataAula}
                onChange={(e) => setDataAula(e.target.value)}
              />
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                  Graduação (faixa)
                </label>
                <select
                  value={faixa}
                  onChange={(e) => setFaixa(e.target.value)}
                  className="h-13 w-full rounded-xl border border-line bg-surface px-4 text-[15px] text-content shadow-soft focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                >
                  {BELTS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" loading={creating}>
              {editingId ? (
                <>
                  <Pencil size={18} /> Salvar alterações
                </>
              ) : (
                <>
                  <Plus size={18} /> Criar aula
                </>
              )}
            </Button>
          </Card>
        </form>

        {/* Confirmação de criação para o instrutor (que não lista aulas). */}
        {isInstructor && created && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
            <Check size={16} className="shrink-0" />
            Aula criada! Os alunos da faixa selecionada já podem vê-la.
          </div>
        )}

        {!isInstructor && (
          <>
            <div className="flex items-center justify-between">
              <SectionTitle>Aulas da academia</SectionTitle>
              <Badge tone="soft">{aulas.length}</Badge>
            </div>

            {/* Date filter (server-side via ?data=AAAA-MM-DD) */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  name="filterDate"
                  type="date"
                  label="Filtrar por data"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
              {filterDate && (
                <button
                  type="button"
                  onClick={() => setFilterDate('')}
                  className="h-13 shrink-0 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-muted transition-colors hover:text-content"
                >
                  Limpar
                </button>
              )}
            </div>

            {aulas.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                message="Nenhuma aula criada ainda. Crie a primeira acima."
              />
            ) : (
              <div className="flex flex-col gap-3">
                {aulas.map((a) => (
                  <Card
                    key={a.id_aula}
                    className={`flex items-center gap-3 p-4 ${
                      editingId === a.id_aula ? 'ring-2 ring-primary/40' : ''
                    }`}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                      <GraduationCap size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-display text-[15px] font-bold uppercase tracking-tight text-content">
                        {a.conteudo ?? 'Aula'}
                      </h4>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <CalendarDays size={13} className="text-primary" />
                          {formatWallDate(a.data_aula) || '—'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={13} className="text-primary" />
                          {formatWallTime(a.data_aula) || '—'}
                        </span>
                        {a.faixa && <Badge tone="neutral">{a.faixa}</Badge>}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEdit(a)}
                      aria-label="Editar aula"
                      className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold uppercase tracking-wide text-muted transition-colors hover:text-primary active:bg-canvas"
                    >
                      <Pencil size={16} /> Editar
                    </button>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        <InfoNote>
          As aulas aparecem para os alunos da graduação correspondente na aba{' '}
          <strong>Aulas</strong> e habilitam o check-in de presença.
        </InfoNote>
      </div>
    </div>
  )
}
