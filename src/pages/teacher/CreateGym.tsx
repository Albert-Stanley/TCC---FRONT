import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useGymStore } from '@/store/gymStore'
import { Users, Link2, GraduationCap, MapPin, LocateFixed } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { FormLayout } from '@/components/layout/FormLayout'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { InfoNote } from '@/components/ui/InfoNote'
import { FormError } from '@/components/ui/FormError'
import { MapView } from '@/components/ui/MapView'
import { maskCnpj, maskCep, onlyDigits } from '@/lib/format'
import { lookupCep, geocodeAddress, type LatLng } from '@/lib/geo'
import { fetchProfile } from '@/lib/auth'

const PERKS = [
  { icon: Link2, text: 'Gere convites e adicione alunos.' },
  { icon: Users, text: 'Gerencie alunos, faixas e mensalidades.' },
  { icon: GraduationCap, text: 'Crie aulas com conteúdo e graduação.' },
]

export function CreateGym() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const setGym = useGymStore((s) => s.setGym)

  const [name, setName] = useState('')
  const [cnpj, setCnpj] = useState('')

  // Address + geolocation.
  const [cep, setCep] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [district, setDistrict] = useState('')
  const [city, setCity] = useState('')
  const [uf, setUf] = useState('')
  const [coords, setCoords] = useState<LatLng | null>(null)
  const [cepLoading, setCepLoading] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  /** Geocode the assembled address to coordinates for the map preview. */
  async function locate(
    parts?: Partial<Record<'street' | 'district' | 'city' | 'uf' | 'cep', string>>,
  ) {
    const s = parts?.street ?? street
    const c = parts?.city ?? city
    if (!s && !c) return
    setGeoLoading(true)
    const hit = await geocodeAddress({
      street: s,
      number,
      district: parts?.district ?? district,
      city: c,
      uf: parts?.uf ?? uf,
      cep: onlyDigits(parts?.cep ?? cep),
    })
    setGeoLoading(false)
    if (hit) setCoords(hit)
  }

  async function handleCepChange(value: string) {
    setCep(maskCep(value))
    const digits = onlyDigits(value)
    if (digits.length !== 8) return
    setCepLoading(true)
    const info = await lookupCep(digits)
    setCepLoading(false)
    if (!info) return
    setStreet(info.street ?? '')
    setDistrict(info.district ?? '')
    setCity(info.city ?? '')
    setUf(info.uf ?? '')
    void locate({ ...info, cep: digits })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (onlyDigits(cnpj).length !== 14) {
      setError('Informe um CNPJ válido (14 dígitos).')
      return
    }

    setLoading(true)
    try {
      await api.post('/Gyms/Creation', {
        cnpj: onlyDigits(cnpj),
        nome: name,
      })

      // Persist the gym's geolocation (used for the students' GPS check-in).
      if (coords) {
        await api
          .put('/Gyms/Location', { latitude: coords.lat, longitude: coords.lng })
          .catch(() => {})
      }

      const addressStr =
        [number ? `${street}, ${number}` : street, district]
          .filter(Boolean)
          .join(' — ') || undefined
      const cityStr = [city, uf].filter(Boolean).join(' · ') || undefined

      setGym({
        id: onlyDigits(cnpj),
        name,
        cnpj: onlyDigits(cnpj),
        teacherName: user?.name,
        address: addressStr,
        city: cityStr,
        cep: onlyDigits(cep) || undefined,
        lat: coords?.lat,
        lng: coords?.lng,
      })

      // Creating a gym promotes the user to teacher — refresh role from backend.
      try {
        setUser(await fetchProfile())
      } catch {
        if (user) setUser({ ...user, role: 'teacher' })
      }
      navigate('/home', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível criar a academia.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col">
      <Header title="Nova academia" backTo="/home" />

      <FormLayout
        aside={
          <Card className="flex flex-col gap-4">
            <p className="font-display text-sm font-bold uppercase tracking-tight text-content">
              Ao criar você poderá
            </p>
            {PERKS.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Icon size={18} />
                </span>
                <p className="text-sm text-content">{text}</p>
              </div>
            ))}
          </Card>
        }
      >
        <header>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-content">
            Cadastrar nova academia
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Você se tornará o professor responsável.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Card className="flex flex-col gap-5">
            <Input
              name="name"
              label="Nome da academia"
              placeholder="Ex: Academia Central Krav Maga"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              name="cnpj"
              label="CNPJ"
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
              required
              value={cnpj}
              onChange={(e) => setCnpj(maskCnpj(e.target.value))}
            />
          </Card>

          {/* Address + map */}
          <Card className="flex flex-col gap-5">
            <p className="font-display text-sm font-bold uppercase tracking-tight text-content">
              Endereço da academia
            </p>

            <Input
              name="cep"
              label={cepLoading ? 'CEP (buscando…)' : 'CEP'}
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

            <div className="grid grid-cols-2 gap-3">
              <Input
                name="district"
                label="Bairro"
                placeholder="Bairro"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              />
              <Input
                name="city"
                label="Cidade"
                placeholder="Cidade"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <Button
              type="button"
              variant="secondary"
              loading={geoLoading}
              onClick={() => locate()}
            >
              <LocateFixed size={17} /> Localizar no mapa
            </Button>

            {coords ? (
              <div className="flex flex-col gap-2">
                <MapView point={coords} label={name || 'Sua academia'} height={160} />
                <p className="flex items-start gap-2 px-1 text-xs text-muted">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-primary" />
                  Confirme se o pino está no local correto. Ele será usado no
                  mapa e no check-in por GPS dos alunos.
                </p>
              </div>
            ) : (
              <InfoNote>
                Informe o CEP para preencher o endereço e posicionar a academia
                no mapa.
              </InfoNote>
            )}
          </Card>

          {error && <FormError>{error}</FormError>}

          <Button type="submit" loading={loading}>
            Criar academia
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/home')}
          >
            Cancelar
          </Button>
        </form>
      </FormLayout>
    </div>
  )
}
