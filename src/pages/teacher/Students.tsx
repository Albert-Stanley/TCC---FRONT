import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Trash2,
  Users,
  GraduationCap,
  Search,
  ChevronDown,
  Mail,
  Phone,
  FileText,
  MapPin,
  CalendarCheck,
  CreditCard,
  CalendarDays,
  Navigation,
} from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { loadRoster } from '@/lib/roster'
import { useGymStore } from '@/store/gymStore'
import { useStudentsStore } from '@/store/studentsStore'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Logo } from '@/components/ui/Logo'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { SkeletonList } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormError } from '@/components/ui/FormError'
import { maskCpf, maskCnpj, maskCep, formatDate } from '@/lib/format'
import { DEMO_GYM } from '@/lib/demo'
import { openDirections } from '@/lib/geo'
import type { PaymentStatus, Student } from '@/types'

type PayFilter = 'all' | 'paid' | 'due'

const beltDot = (belt?: string): string => {
  const b = (belt ?? '').toLowerCase()
  if (b.includes('preta')) return 'bg-neutral-800'
  if (b.includes('marrom')) return 'bg-amber-700'
  if (b.includes('azul')) return 'bg-blue-500'
  if (b.includes('verde')) return 'bg-green-500'
  if (b.includes('laranja')) return 'bg-orange-400'
  if (b.includes('amarela')) return 'bg-yellow-400'
  if (b.includes('branca')) return 'bg-neutral-300'
  return 'bg-neutral-400'
}

const PAY_BADGE: Record<PaymentStatus, { label: string; tone: 'success' | 'soft' | 'primary' }> = {
  paid: { label: 'Em dia', tone: 'success' },
  pending: { label: 'Pendente', tone: 'soft' },
  late: { label: 'Atrasado', tone: 'primary' },
}

/** A single labelled detail field shown in the expanded student panel. */
function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value?: string | number
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={15} className="mt-0.5 shrink-0 text-muted" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
          {label}
        </p>
        <p className="truncate text-sm text-content">{value ?? '—'}</p>
      </div>
    </div>
  )
}

function StudentRow({
  student,
  expanded,
  onToggle,
  onRemove,
  removing,
}: {
  student: Student
  expanded: boolean
  onToggle: () => void
  onRemove: () => void
  removing: boolean
}) {
  const pay = student.paymentStatus ? PAY_BADGE[student.paymentStatus] : null
  return (
    <Card className="flex flex-col gap-0 p-0 overflow-hidden">
      <button
        onClick={onToggle}
        className="flex items-center gap-3 p-3 text-left transition-colors hover:bg-canvas"
      >
        <Avatar name={student.name ?? student.email} />
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-[15px] font-bold text-content">
            {student.name ?? 'Aluno'}
          </h4>
          <div className="mt-0.5 flex items-center gap-1.5">
            {student.belt && (
              <>
                <span className={`h-2 w-2 rounded-full ${beltDot(student.belt)}`} />
                <span className="truncate text-xs text-muted">{student.belt}</span>
              </>
            )}
            {!student.belt && (
              <span className="truncate text-xs text-muted">
                {student.email ?? (student.cpf ? maskCpf(student.cpf) : '—')}
              </span>
            )}
          </div>
        </div>
        {pay && <Badge tone={pay.tone}>{pay.label}</Badge>}
        <ChevronDown
          size={18}
          className={`shrink-0 text-neutral-400 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {expanded && (
        <div className="animate-fade-in border-t border-line bg-canvas/40 px-3 pb-3 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <Field icon={Mail} label="E-mail" value={student.email} />
            <Field icon={Phone} label="Telefone" value={student.phone} />
            <Field icon={FileText} label="CPF" value={student.cpf ? maskCpf(student.cpf) : undefined} />
            <Field icon={MapPin} label="CEP" value={student.cep ? maskCep(student.cep) : undefined} />
            <Field icon={CreditCard} label="Plano" value={student.plan} />
            <Field icon={CalendarDays} label="Entrou em" value={formatDate(student.joinedAt)} />
            <Field icon={CalendarCheck} label="Última presença" value={formatDate(student.lastPresence)} />
            <Field icon={Users} label="Presenças no mês" value={student.attendanceMonth} />
          </div>
          <button
            disabled={removing}
            onClick={onRemove}
            className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-line text-sm font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary-soft disabled:opacity-50"
          >
            <Trash2 size={16} /> Remover aluno
          </button>
        </div>
      )}
    </Card>
  )
}

export function Students() {
  const navigate = useNavigate()
  const gym = useGymStore((s) => s.gym)
  const students = useStudentsStore((s) => s.students)
  const removeStudent = useStudentsStore((s) => s.removeStudent)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | number | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<PayFilter>('all')
  const [expandedId, setExpandedId] = useState<string | number | null>(null)

  useEffect(() => {
    let active = true
    loadRoster()
      .catch((err) => {
        if (active)
          setError(getErrorMessage(err, 'Não foi possível carregar os alunos.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const stats = useMemo(() => {
    let paid = 0
    let due = 0
    for (const s of students) {
      if (s.paymentStatus === 'paid') paid++
      else if (s.paymentStatus === 'pending' || s.paymentStatus === 'late') due++
    }
    return { total: students.length, paid, due }
  }, [students])

  const visible = students.filter((s) => {
    const q = query.trim().toLowerCase()
    const matchesQuery =
      !q ||
      [s.name, s.email, s.belt, s.cpf]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    const matchesFilter =
      filter === 'all' ||
      (filter === 'paid' && s.paymentStatus === 'paid') ||
      (filter === 'due' &&
        (s.paymentStatus === 'pending' || s.paymentStatus === 'late'))
    return matchesQuery && matchesFilter
  })

  async function remove(id: string | number) {
    if (!window.confirm('Remover este aluno da academia?')) return
    setBusyId(id)
    setError(null)
    try {
      await api.post('/Gym/Students/Remove', { id_aluno: id })
      removeStudent(id)
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível remover o aluno.'))
    } finally {
      setBusyId(null)
    }
  }

  const gymPoint =
    gym?.lat != null && gym?.lng != null
      ? { lat: gym.lat, lng: gym.lng }
      : { lat: DEMO_GYM.lat, lng: DEMO_GYM.lng }
  const gymAddress = gym?.address ?? DEMO_GYM.address

  const FILTERS: { key: PayFilter; label: string; count: number }[] = [
    { key: 'all', label: 'Todos', count: stats.total },
    { key: 'paid', label: 'Em dia', count: stats.paid },
    { key: 'due', label: 'Pendentes', count: stats.due },
  ]

  return (
    <div className="flex flex-col">
      <Header
        title="Academia"
        subtitle="Acompanhe alunos, faixas e mensalidades."
        back={false}
        right={
          <button
            onClick={() => navigate('/classes')}
            className="hidden items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-primary transition-all hover:bg-primary-dark active:scale-95 lg:flex"
          >
            <GraduationCap size={18} /> Gerenciar aulas
          </button>
        }
      />

      <div className="flex flex-col gap-5 px-6 py-6">
        {/* Gym header */}
        <Card className="relative flex flex-col gap-4 overflow-hidden">
          <span className="absolute right-0 top-0 rounded-bl-2xl bg-emerald-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Ativa
          </span>
          <div className="flex items-center gap-3.5 pr-16">
            <Logo size={56} rounded="rounded-2xl" />
            <div className="min-w-0">
              <h2 className="truncate font-display text-lg font-extrabold uppercase tracking-tight text-content">
                {gym?.name ?? 'Sua academia'}
              </h2>
              <p className="truncate text-sm text-muted">
                {gym?.cnpj ? `CNPJ ${maskCnpj(gym.cnpj)}` : gym?.city ?? DEMO_GYM.city}
              </p>
            </div>
          </div>
          <button
            onClick={() => openDirections(gymPoint)}
            className="flex items-center gap-2 rounded-2xl bg-canvas px-4 py-3 text-left text-sm font-semibold text-content transition-colors hover:bg-primary-soft hover:text-primary"
          >
            <MapPin size={16} className="shrink-0 text-primary" />
            <span className="min-w-0 flex-1 truncate">{gymAddress}</span>
            <Navigation size={16} className="ml-auto shrink-0" />
          </button>
        </Card>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Alunos', value: stats.total, tone: 'text-content' },
            { label: 'Em dia', value: stats.paid, tone: 'text-emerald-600' },
            { label: 'Pendências', value: stats.due, tone: 'text-primary' },
          ].map((s) => (
            <Card key={s.label} className="px-3 py-3 text-center">
              <p className={`font-display text-2xl font-extrabold ${s.tone}`}>
                {s.value}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                {s.label}
              </p>
            </Card>
          ))}
        </div>

        <Button
          variant="secondary"
          onClick={() => navigate('/classes')}
          className="lg:hidden"
        >
          <GraduationCap size={18} />
          Gerenciar aulas
        </Button>

        {/* Search */}
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute inset-y-0 left-4 my-auto text-muted"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar alunos por nome, faixa ou CPF"
            placeholder="Buscar por nome, faixa ou CPF..."
            className="h-13 w-full rounded-2xl border border-line bg-surface pl-11 pr-4 text-[15px] text-content shadow-soft transition-all placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
          />
        </div>

        {/* Payment filter chips */}
        <div className="flex gap-2">
          {FILTERS.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
                filter === key
                  ? 'bg-primary text-white shadow-primary'
                  : 'border border-line bg-surface text-muted hover:text-content'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {error && <FormError>{error}</FormError>}

        {loading ? (
          <SkeletonList rows={4} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Users}
            message={
              students.length === 0
                ? 'Nenhum aluno cadastrado ainda. Aprove solicitações para adicioná-los.'
                : 'Nenhum aluno encontrado para esse filtro.'
            }
          />
        ) : (
          <div className="grid items-start gap-3 lg:grid-cols-2">
            {visible.map((st) => (
              <StudentRow
                key={st.id_aluno}
                student={st}
                expanded={expandedId === st.id_aluno}
                onToggle={() =>
                  setExpandedId((id) => (id === st.id_aluno ? null : st.id_aluno))
                }
                onRemove={() => remove(st.id_aluno)}
                removing={busyId === st.id_aluno}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
