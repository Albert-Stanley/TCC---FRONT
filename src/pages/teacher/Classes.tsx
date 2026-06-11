import { useEffect, useState, type FormEvent } from 'react'
import { GraduationCap, Plus, Clock, CalendarDays } from 'lucide-react'
import { api, asList, getErrorMessage } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { InfoNote } from '@/components/ui/InfoNote'
import { FormError } from '@/components/ui/FormError'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, formatTime } from '@/lib/format'

const BELTS = ['Branca', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Marrom', 'Preta']

interface Aula {
  id_aula: string
  conteudo?: string
  data_aula?: string
  faixa?: string
}

/**
 * Manage classes. Each class is created via POST /Gyms/Classes/Creation with a
 * single content text, a date/time and the target belt (faixa). The class list
 * comes from GET /Gyms/Classes (the teacher's academia).
 */
export function Classes() {
  const [aulas, setAulas] = useState<Aula[]>([])
  const [conteudo, setConteudo] = useState('')
  const [dataAula, setDataAula] = useState('')
  const [faixa, setFaixa] = useState('Branca')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
    void load(filterDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDate])

  async function createClass(e: FormEvent) {
    e.preventDefault()
    if (!conteudo.trim() || !dataAula) return
    setCreating(true)
    setError(null)
    try {
      // Backend expects "AAAA-MM-DD HH:MM"; the datetime-local input uses a "T".
      await api.post('/Gyms/Classes/Creation', {
        conteudo: conteudo.trim(),
        data_aula: dataAula.replace('T', ' '),
        faixa,
      })
      setConteudo('')
      setDataAula('')
      await load()
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível criar a aula.'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col">
      <Header title="Aulas" backTo="/home" />

      <div className="flex flex-col gap-6 px-6 py-6">
        <SectionTitle underline>Nova aula</SectionTitle>

        {error && <FormError>{error}</FormError>}

        <form onSubmit={createClass}>
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-white dark:bg-white/10">
                <GraduationCap size={20} />
              </span>
              <h3 className="font-display text-sm font-bold uppercase tracking-tight text-content">
                Criar aula
              </h3>
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
              <Plus size={18} /> Criar aula
            </Button>
          </Card>
        </form>

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
              <Card key={a.id_aula} className="flex items-center gap-3 p-4">
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
                      {formatDate(a.data_aula) || '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} className="text-primary" />
                      {formatTime(a.data_aula) || '—'}
                    </span>
                    {a.faixa && <Badge tone="neutral">{a.faixa}</Badge>}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}

        <InfoNote>
          As aulas aparecem para os alunos da graduação correspondente na aba{' '}
          <strong>Aulas</strong> e habilitam o check-in de presença.
        </InfoNote>
      </div>
    </div>
  )
}
