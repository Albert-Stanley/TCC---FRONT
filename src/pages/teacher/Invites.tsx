import { useEffect, useMemo, useState } from 'react'
import { Plus, Copy, Trash2, Link2, Check, X, QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { api, asList, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useInviteStore } from '@/store/inviteStore'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormError } from '@/components/ui/FormError'
import type { Invite } from '@/types'

/** Builds the shareable invite link from a token (mirrors the mockup format). */
function inviteUrl(token: string): string {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  return `${origin}/invite?invite=${token}`
}

export function Invites() {
  const userName = useAuthStore((s) => s.user?.name)
  const invites = useInviteStore((s) => s.invites)
  const removeInvite = useInviteStore((s) => s.removeInvite)

  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justGenerated, setJustGenerated] = useState(false)
  const [copiedId, setCopiedId] = useState<string | number | null>(null)
  const [qrInvite, setQrInvite] = useState<Invite | null>(null)

  // Fecha o modal do QR Code com Escape.
  useEffect(() => {
    if (!qrInvite) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setQrInvite(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [qrInvite])

  const stats = useMemo(() => {
    const used = invites.filter((i) => i.status === 'used').length
    return { total: invites.length, active: invites.length - used, used }
  }, [invites])

  // Load existing invites (GET /Gyms/Invites/List → [{id_convite, link}]).
  async function loadInvites() {
    try {
      const { data } = await api.get('/Gyms/Invites/List')
      const list = asList<{ id_convite: string; link: string }>(data).map(
        (c): Invite => ({
          id: c.id_convite,
          token: c.id_convite,
          url: c.link,
          status: 'active',
        }),
      )
      useInviteStore.setState({ invites: list })
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível carregar os convites.'))
    }
  }

  useEffect(() => {
    void loadInvites()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function generate() {
    setGenerating(true)
    setError(null)
    try {
      await api.post('/Gyms/Invites/Creation')
      await loadInvites()
      setJustGenerated(true)
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível gerar o convite.'))
    } finally {
      setGenerating(false)
    }
  }

  async function remove(id: string | number) {
    setError(null)
    try {
      await api.delete(`/Gyms/Invites/${encodeURIComponent(String(id))}`)
      removeInvite(id)
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível remover o convite.'))
    }
  }

  async function copy(invite: Invite) {
    const url = invite.url ?? inviteUrl(invite.token)
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(invite.id)
      setTimeout(() => setCopiedId((c) => (c === invite.id ? null : c)), 1500)
    } catch {
      // Clipboard blocked — silently ignore; the link is still visible.
    }
  }

  return (
    <div className="flex flex-col">
      <Header
        title="Convites"
        subtitle="Gere e compartilhe links para novos alunos entrarem."
        back={false}
        right={
          <>
            <span className="lg:hidden">
              <Avatar name={userName} accent size="h-9 w-9 text-sm" />
            </span>
            <button
              onClick={generate}
              disabled={generating}
              className="hidden items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-primary transition-all hover:bg-primary-dark active:scale-95 disabled:opacity-50 lg:flex"
            >
              <Plus size={18} /> Gerar convite
            </button>
          </>
        }
      />

      <div className="flex flex-col gap-4 px-6 py-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: stats.total, tone: 'text-content' },
            { label: 'Ativos', value: stats.active, tone: 'text-primary' },
            { label: 'Usados', value: stats.used, tone: 'text-muted' },
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

        {justGenerated && (
          <div
            role="status"
            aria-live="polite"
            className="flex animate-slide-up items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-white shadow-card"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary">
              <Check size={20} />
            </span>
            <div className="flex-1">
              <p className="font-display text-sm font-bold uppercase tracking-tight">
                Novo convite gerado!
              </p>
              <p className="text-xs text-white/60">Compartilhe com seu aluno.</p>
            </div>
            <button
              aria-label="Fechar"
              onClick={() => setJustGenerated(false)}
              className="text-white/60 transition-colors hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        )}

        <button
          onClick={generate}
          disabled={generating}
          className="flex h-13 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold uppercase tracking-wide text-white shadow-primary transition-all hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50 lg:hidden"
        >
          <Plus size={20} /> Gerar novo convite
        </button>

        {error && <FormError>{error}</FormError>}

        {invites.length === 0 ? (
          <EmptyState
            icon={Link2}
            message="Nenhum convite gerado ainda. Gere um link para compartilhar com seus alunos."
          />
        ) : (
          <div className="grid min-w-0 items-start gap-4 lg:grid-cols-2">
            {invites.map((invite) => {
            const url = invite.url ?? inviteUrl(invite.token)
            const used = invite.status === 'used'
            return (
              <Card key={invite.id} className="flex min-w-0 flex-col gap-3">
                <div className="flex items-center justify-end gap-3">
                  <Badge tone={used ? 'neutral' : 'primary'}>
                    {used ? 'Usado' : 'Ativo'}
                  </Badge>
                </div>

                {/* Tap-to-copy link: the URL truncates but the copy affordance
                    stays pinned (shrink-0), so it never overflows the frame. */}
                <button
                  type="button"
                  onClick={() => copy(invite)}
                  disabled={used}
                  aria-label="Copiar link do convite"
                  className="group flex min-w-0 items-center gap-3 rounded-xl border border-line bg-canvas px-3.5 py-3 text-left transition-colors hover:border-primary/40 active:scale-[0.99] disabled:opacity-60"
                >
                  <span className="min-w-0 flex-1 truncate font-mono text-sm text-content">
                    {url}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                    {copiedId === invite.id ? (
                      <>
                        <Check size={16} /> Copiado
                      </>
                    ) : (
                      <>
                        <Copy size={16} /> Copiar
                      </>
                    )}
                  </span>
                </button>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setQrInvite(invite)}
                    disabled={used}
                    aria-label="Mostrar QR Code do convite"
                    className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold uppercase tracking-wide text-content transition-colors hover:text-primary active:bg-canvas disabled:opacity-50"
                  >
                    <QrCode size={16} /> QR Code
                  </button>
                  <button
                    onClick={() => remove(invite.id)}
                    aria-label="Remover convite"
                    className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold uppercase tracking-wide text-muted transition-colors hover:text-primary active:bg-canvas"
                  >
                    <Trash2 size={16} /> Remover
                  </button>
                </div>
              </Card>
            )
          })}
          </div>
        )}
      </div>

      {qrInvite && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/80 p-6 backdrop-blur-sm"
          onClick={() => setQrInvite(null)}
          role="dialog"
          aria-modal="true"
          aria-label="QR Code do convite"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-xs flex-col items-center gap-4 rounded-3xl border border-line bg-surface p-6 text-center shadow-card"
          >
            <div>
              <p className="font-display text-lg font-extrabold uppercase tracking-tight text-content">
                Convite da academia
              </p>
              <p className="mt-1 text-sm text-muted">
                Peça ao aluno para escanear com a câmera do celular.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-soft">
              <QRCodeSVG
                value={qrInvite.url ?? inviteUrl(qrInvite.token)}
                size={208}
                level="M"
              />
            </div>
            <button
              type="button"
              onClick={() => copy(qrInvite)}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary transition-colors hover:text-primary-dark"
            >
              {copiedId === qrInvite.id ? (
                <>
                  <Check size={15} /> Copiado
                </>
              ) : (
                <>
                  <Copy size={15} /> Copiar link
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setQrInvite(null)}
              className="h-11 w-full rounded-xl bg-primary text-sm font-semibold uppercase tracking-wide text-white shadow-primary transition-all hover:bg-primary-dark active:scale-[0.98]"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
