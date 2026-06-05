import { useMemo, useState } from 'react'
import { Plus, Copy, Trash2, Link2, Check, X } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useInviteStore } from '@/store/inviteStore'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormError } from '@/components/ui/FormError'
import { formatDate } from '@/lib/format'
import type { Invite } from '@/types'

/** Builds the shareable invite link from a token (mirrors the mockup format). */
function inviteUrl(token: string): string {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  return `${origin}/invite?=${token}`
}

export function Invites() {
  const userName = useAuthStore((s) => s.user?.name)
  const invites = useInviteStore((s) => s.invites)
  const addInvite = useInviteStore((s) => s.addInvite)
  const removeInvite = useInviteStore((s) => s.removeInvite)

  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justGenerated, setJustGenerated] = useState(false)
  const [copiedId, setCopiedId] = useState<string | number | null>(null)

  const stats = useMemo(() => {
    const used = invites.filter((i) => i.status === 'used').length
    return { total: invites.length, active: invites.length - used, used }
  }, [invites])

  async function generate() {
    setGenerating(true)
    setError(null)
    try {
      const { data } = await api.post<Record<string, unknown>>(
        '/Gym/Invite/Generate',
      )
      const token = String(
        data?.token ?? data?.uuid ?? data?.id ?? crypto.randomUUID(),
      )
      const invite: Invite = {
        id: token,
        token,
        url: (data?.url as string) ?? inviteUrl(token),
        status: 'active',
        createdAt: new Date().toISOString(),
        expiresAt: (data?.expiration as string) ?? (data?.expiresAt as string),
      }
      addInvite(invite)
      setJustGenerated(true)
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível gerar o convite.'))
    } finally {
      setGenerating(false)
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
          <div className="grid items-start gap-4 lg:grid-cols-2">
            {invites.map((invite) => {
            const url = invite.url ?? inviteUrl(invite.token)
            const used = invite.status === 'used'
            return (
              <Card key={invite.id} className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <Link2 size={22} className="mt-0.5 shrink-0 text-content" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm text-content">{url}</p>
                    <p className="text-xs text-muted">
                      Criado em {formatDate(invite.createdAt) || '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge tone={used ? 'neutral' : 'primary'}>
                    {used ? 'Usado' : 'Ativo'}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {!used && (
                      <button
                        onClick={() => copy(invite)}
                        aria-label="Copiar link"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted active:bg-canvas active:text-primary"
                      >
                        {copiedId === invite.id ? (
                          <Check size={18} className="text-primary" />
                        ) : (
                          <Copy size={18} />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => removeInvite(invite.id)}
                      aria-label="Remover convite"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted active:bg-canvas active:text-primary"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
          </div>
        )}
      </div>
    </div>
  )
}
