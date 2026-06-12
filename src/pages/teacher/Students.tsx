import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Trash2,
  Users,
  GraduationCap,
  Search,
  ChevronDown,
  FileText,
  MapPin,
  CalendarCheck,
  Navigation,
  Award,
  Clock,
  LocateFixed,
  Pencil,
} from 'lucide-react'
import { api, asList, getErrorMessage } from '@/lib/api'
import { loadRoster } from '@/lib/roster'
import { useGymStore } from '@/store/gymStore'
import { useStudentsStore } from '@/store/studentsStore'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { MapView } from '@/components/ui/MapView'
import { Logo } from '@/components/ui/Logo'
import { Avatar } from '@/components/ui/Avatar'
import { SkeletonList } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormError } from '@/components/ui/FormError'
import { maskCpf, maskCnpj, maskCep, onlyDigits, formatDate } from '@/lib/format'
import { DEMO_GYM } from '@/lib/demo'
import {
  openDirections,
  useGymLocation,
  getCurrentPosition,
  geocodeAddress,
  reverseGeocode,
  lookupCep,
  type LatLng,
} from '@/lib/geo'
import type { Student } from '@/types'

const BELTS = ['Branca', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Marrom', 'Preta']

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

/** Response of GET /Student/Presence/Count?id_aluno= (ContagemPresencaDTO). */
interface PresenceCount {
  contagem: number
  presencas?: { nome_aula?: string; data?: string }[]
}

/** A single labelled detail field shown in the expanded student panel. */
function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText
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
  onPromote,
  onBelt,
  busy,
}: {
  student: Student
  expanded: boolean
  onToggle: () => void
  onRemove: () => void
  onPromote: () => void
  onBelt: (faixa: string) => void
  busy: boolean
}) {
  const [presence, setPresence] = useState<PresenceCount | null>(null)
  const [presenceError, setPresenceError] = useState(false)

  // Fetch the student's attendance when the panel opens.
  useEffect(() => {
    if (!expanded || presence) return
    api
      .get('/Student/Presence/Count', {
        params: { id_aluno: String(student.id_aluno) },
      })
      .then(({ data }) => {
        const d = data as PresenceCount | null
        setPresence({
          contagem: d?.contagem ?? 0,
          presencas: asList<{ nome_aula?: string; data?: string }>(d?.presencas),
        })
      })
      .catch(() => setPresenceError(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded])

  const recent = (presence?.presencas ?? []).slice(-3).reverse()

  return (
    <Card
      className={`flex flex-col gap-0 overflow-hidden p-0 ${
        expanded ? 'lg:col-span-2' : ''
      }`}
    >
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
            {student.belt ? (
              <>
                <span className={`h-2 w-2 rounded-full ${beltDot(student.belt)}`} />
                <span className="truncate text-xs text-muted">
                  Faixa {student.belt}
                </span>
              </>
            ) : (
              <span className="truncate text-xs text-muted">
                {student.cpf ? maskCpf(student.cpf) : '—'}
              </span>
            )}
          </div>
        </div>
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
            <Field
              icon={FileText}
              label="CPF"
              value={student.cpf ? maskCpf(student.cpf) : undefined}
            />
            <Field
              icon={CalendarCheck}
              label="Presenças"
              value={
                presence ? presence.contagem : presenceError ? '—' : '…'
              }
            />
          </div>

          {/* Belt — saved straight to PUT /Gyms/Students/{id}/Belt */}
          <label className="mt-3 block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
              <Award size={13} /> Graduação (faixa)
            </span>
            <select
              value={student.belt ?? ''}
              disabled={busy}
              onChange={(e) => onBelt(e.target.value)}
              className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-content focus:border-primary focus:outline-none disabled:opacity-50"
            >
              <option value="" disabled>
                Selecionar faixa…
              </option>
              {BELTS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>

          {/* Last check-ins */}
          {recent.length > 0 && (
            <div className="mt-3 flex flex-col gap-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Últimas presenças
              </p>
              {recent.map((p, i) => (
                <p
                  key={i}
                  className="flex items-center gap-2 truncate text-xs text-content"
                >
                  <Clock size={12} className="shrink-0 text-primary" />
                  <span className="truncate">{p.nome_aula ?? 'Aula'}</span>
                  <span className="ml-auto shrink-0 text-muted">
                    {formatDate(p.data) || '—'}
                  </span>
                </p>
              ))}
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              disabled={busy}
              onClick={onPromote}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-line text-xs font-semibold uppercase tracking-wide text-content transition-colors hover:bg-primary-soft hover:text-primary disabled:opacity-50"
            >
              <GraduationCap size={15} /> Tornar instrutor
            </button>
            <button
              disabled={busy}
              onClick={onRemove}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-line text-xs font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary-soft disabled:opacity-50"
            >
              <Trash2 size={15} /> Remover
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}

export function Students() {
  const navigate = useNavigate()
  const gym = useGymStore((s) => s.gym)
  const setGym = useGymStore((s) => s.setGym)
  const students = useStudentsStore((s) => s.students)
  const removeStudent = useStudentsStore((s) => s.removeStudent)
  const upsertStudent = useStudentsStore((s) => s.upsertStudent)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | number | null>(null)
  const [query, setQuery] = useState('')
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

  const visible = students.filter((s) => {
    const q = query.trim().toLowerCase()
    return (
      !q ||
      [s.name, s.belt, s.cpf]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    )
  })

  /** Runs a mutation flagging the row busy + surfacing errors uniformly. */
  async function mutate(
    id: string | number,
    fn: () => Promise<void>,
    fallback: string,
  ) {
    setBusyId(id)
    setError(null)
    setSuccess(null)
    try {
      await fn()
    } catch (err) {
      setError(getErrorMessage(err, fallback))
    } finally {
      setBusyId(null)
    }
  }

  async function remove(id: string | number) {
    if (!window.confirm('Remover este aluno da academia?')) return
    await mutate(
      id,
      async () => {
        await api.delete(`/Gyms/Students/${encodeURIComponent(String(id))}`)
        removeStudent(id)
      },
      'Não foi possível remover o aluno.',
    )
  }

  async function promote(student: Student) {
    if (
      !window.confirm(
        `Tornar ${student.name ?? 'este aluno'} instrutor da academia?`,
      )
    )
      return
    await mutate(
      student.id_aluno,
      async () => {
        await api.post('/Gyms/Instructors/Creation', {
          id_aluno: String(student.id_aluno),
        })
        setSuccess(`${student.name ?? 'Aluno'} agora é instrutor da academia.`)
      },
      'Não foi possível promover o aluno.',
    )
  }

  async function changeBelt(student: Student, faixa: string) {
    await mutate(
      student.id_aluno,
      async () => {
        await api.put(
          `/Gyms/Students/${encodeURIComponent(String(student.id_aluno))}/Belt`,
          { faixa },
        )
        upsertStudent({ ...student, belt: faixa })
        setSuccess(`Faixa de ${student.name ?? 'aluno'} atualizada para ${faixa}.`)
      },
      'Não foi possível atualizar a faixa.',
    )
  }

  // Authoritative location from GET /Gyms/Geolocation (registered via
  // PUT /Gyms/Location); falls back to the locally cached gym, then demo.
  // `savedPoint` reflects an update made in this session via the panel below.
  const registeredPoint = useGymLocation()
  const [savedPoint, setSavedPoint] = useState<LatLng | null>(null)
  const gymPoint =
    savedPoint ??
    registeredPoint ??
    (gym?.lat != null && gym?.lng != null
      ? { lat: gym.lat, lng: gym.lng }
      : { lat: DEMO_GYM.lat, lng: DEMO_GYM.lng })
  const gymAddress = gym?.address ?? DEMO_GYM.address

  async function handleLocationSaved(point: LatLng) {
    setSavedPoint(point)
    const base = useGymStore.getState().gym ?? { id: 'minha-academia' }
    setGym({ ...base, lat: point.lat, lng: point.lng })
    // Keep the address text in sync with the new pin.
    const place = await reverseGeocode(point)
    if (!place) return
    const current = useGymStore.getState().gym ?? base
    setGym({
      ...current,
      lat: point.lat,
      lng: point.lng,
      address: place.address ?? current.address,
      city: place.city ?? current.city,
    })
  }

  return (
    <div className="flex flex-col">
      <Header
        title="Academia"
        subtitle="Acompanhe alunos, faixas e presenças."
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

        {/* Quick actions grouped under the gym identity. */}
        <div className="flex flex-col gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/classes')}
            className="lg:hidden"
          >
            <GraduationCap size={18} />
            Gerenciar aulas
          </Button>

          <UpdateLocationPanel
            gymName={gym?.name ?? 'Sua academia'}
            onSaved={handleLocationSaved}
          />
        </div>

        {/* Students */}
        <div className="flex items-center justify-between gap-3">
          <SectionTitle>Alunos da academia</SectionTitle>
          <Badge tone="soft">{students.length}</Badge>
        </div>

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

        {error && <FormError>{error}</FormError>}
        {success && (
          <p
            role="status"
            className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600"
          >
            {success}
          </p>
        )}

        {loading ? (
          <SkeletonList rows={4} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Users}
            message={
              students.length === 0
                ? 'Nenhum aluno cadastrado ainda. Aprove solicitações para adicioná-los.'
                : 'Nenhum aluno encontrado para essa busca.'
            }
          />
        ) : (
          <div className="grid items-start gap-3 lg:grid-flow-row-dense lg:grid-cols-2">
            {visible.map((st) => (
              <StudentRow
                key={st.id_aluno}
                student={st}
                expanded={expandedId === st.id_aluno}
                onToggle={() =>
                  setExpandedId((id) => (id === st.id_aluno ? null : st.id_aluno))
                }
                onRemove={() => remove(st.id_aluno)}
                onPromote={() => promote(st)}
                onBelt={(faixa) => changeBelt(st, faixa)}
                busy={busyId === st.id_aluno}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Inline panel to (re)register the gym's location via PUT /Gyms/Location.
 * The teacher picks a point — current GPS position or a geocoded address —
 * previews the pin on the map and then saves it to the backend.
 */
function UpdateLocationPanel({
  gymName,
  onSaved,
}: {
  gymName: string
  onSaved: (point: LatLng) => void
}) {
  const [open, setOpen] = useState(false)
  // Structured address: a CEP lookup fills these in, and the house number plus
  // a structured geocode pin the gym far more precisely than a free-form query.
  const [cep, setCep] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [district, setDistrict] = useState('')
  const [city, setCity] = useState('')
  const [uf, setUf] = useState('')
  const [point, setPoint] = useState<LatLng | null>(null)
  const [busy, setBusy] = useState<'gps' | 'cep' | 'search' | 'save' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function resetFields() {
    setCep('')
    setStreet('')
    setNumber('')
    setDistrict('')
    setCity('')
    setUf('')
    setPoint(null)
    setError(null)
  }

  async function useGps() {
    setError(null)
    setBusy('gps')
    try {
      setPoint(await getCurrentPosition())
    } catch {
      setError(
        'Não foi possível obter sua posição. Verifique a permissão de localização do navegador.',
      )
    } finally {
      setBusy(null)
    }
  }

  /** Geocode the current structured address; auto-pins after CEP/number entry. */
  async function locate(overrides?: Partial<Record<'street' | 'district' | 'city' | 'uf' | 'cep', string>>) {
    const s = overrides?.street ?? street
    const c = overrides?.city ?? city
    if (!s && !c) return
    setError(null)
    setBusy('search')
    const hit = await geocodeAddress({
      street: s,
      number,
      district: overrides?.district ?? district,
      city: c,
      uf: overrides?.uf ?? uf,
      cep: onlyDigits(overrides?.cep ?? cep),
    })
    setBusy(null)
    if (hit) setPoint(hit)
    else setError('Endereço não encontrado. Confira o número, a cidade e a UF.')
  }

  /** ViaCEP lookup → autofill street/district/city/uf, then pin on the map. */
  async function handleCepChange(value: string) {
    setCep(maskCep(value))
    const digits = onlyDigits(value)
    if (digits.length !== 8) return
    setBusy('cep')
    const info = await lookupCep(digits)
    setBusy(null)
    if (!info) {
      setError('CEP não encontrado. Preencha o endereço manualmente.')
      return
    }
    setStreet(info.street ?? '')
    setDistrict(info.district ?? '')
    setCity(info.city ?? '')
    setUf(info.uf ?? '')
    void locate({ ...info, cep: digits })
  }

  async function save() {
    if (!point) return
    setError(null)
    setBusy('save')
    try {
      await api.put('/Gyms/Location', {
        latitude: point.lat,
        longitude: point.lng,
      })
      onSaved(point)
      setSaved(true)
      setOpen(false)
      resetFields()
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível salvar a localização.'))
    } finally {
      setBusy(null)
    }
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            setOpen(true)
            setSaved(false)
            setError(null)
          }}
        >
          <Pencil size={16} /> Atualizar localização
        </Button>
        {saved && (
          <p className="px-1 text-xs font-semibold text-emerald-600">
            Localização da academia atualizada!
          </p>
        )}
      </div>
    )
  }

  return (
    <Card className="flex flex-col gap-4">
      <p className="font-display text-sm font-bold uppercase tracking-tight text-content">
        Atualizar localização
      </p>

      <Button
        type="button"
        variant="secondary"
        loading={busy === 'gps'}
        onClick={useGps}
      >
        <LocateFixed size={17} /> Usar minha posição atual
      </Button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
          ou pelo endereço
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <Input
        name="cep"
        label={busy === 'cep' ? 'CEP (buscando…)' : 'CEP'}
        placeholder="00000-000"
        inputMode="numeric"
        value={cep}
        onChange={(e) => handleCepChange(e.target.value)}
      />

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <Input
          name="street"
          label="Logradouro"
          placeholder="Av. / Rua"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
        />
        <Input
          name="number"
          label="Número"
          placeholder="Nº"
          inputMode="numeric"
          className="w-24"
          value={number}
          onChange={(e) => setNumber(onlyDigits(e.target.value))}
          onBlur={() => locate()}
        />
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <Input
          name="district"
          label="Bairro"
          placeholder="Bairro"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
        />
        <Input
          name="uf"
          label="UF"
          placeholder="UF"
          maxLength={2}
          className="w-20 uppercase"
          value={uf}
          onChange={(e) => setUf(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2))}
        />
      </div>

      <Input
        name="city"
        label="Cidade"
        placeholder="Cidade"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />

      <Button
        type="button"
        variant="secondary"
        loading={busy === 'search'}
        onClick={() => locate()}
      >
        <Search size={16} /> Localizar no mapa
      </Button>

      {point && (
        <div className="flex flex-col gap-2">
          <MapView point={point} label={gymName} height={150} />
          <p className="flex items-start gap-2 px-1 text-xs text-muted">
            <MapPin size={14} className="mt-0.5 shrink-0 text-primary" />
            Confirme se o pino está no local correto. Ele será usado no mapa e
            no check-in por GPS dos alunos.
          </p>
        </div>
      )}

      {error && <FormError>{error}</FormError>}

      <div className="grid grid-cols-2 gap-3">
        <Button loading={busy === 'save'} disabled={!point} onClick={save}>
          Salvar
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setOpen(false)
            resetFields()
          }}
        >
          Cancelar
        </Button>
      </div>
    </Card>
  )
}
