import { useState, type FormEvent } from 'react'
import {
  GraduationCap,
  FileText,
  Video,
  Plus,
  ChevronDown,
  Trash2,
  Clock,
} from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { useClassStore } from '@/store/classStore'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { InfoNote } from '@/components/ui/InfoNote'
import { FormError } from '@/components/ui/FormError'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { EmptyState } from '@/components/ui/EmptyState'
import { videoLabel } from '@/lib/video'
import type { GymClass } from '@/types'

/**
 * Manage classes. A class must be created (POST /Gym/Classes/Creation) before
 * content (POST /Gym/Classes/Information) or videos (POST /Gym/Classes/Videos)
 * can be attached. Created classes are cached in the class store (no GET in the
 * API map) so they can be listed here and read by students.
 */
export function Classes() {
  const classes = useClassStore((s) => s.classes)
  const addClass = useClassStore((s) => s.addClass)
  const addContentStore = useClassStore((s) => s.addContent)
  const addVideoStore = useClassStore((s) => s.addVideo)
  const removeClass = useClassStore((s) => s.removeClass)

  const [name, setName] = useState('')
  const [modality, setModality] = useState('')
  const [schedule, setSchedule] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function createClass(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    setError(null)
    try {
      const { data } = await api.post<Record<string, unknown>>(
        '/Gym/Classes/Creation',
        { name, modality, schedule },
      )
      const id = String(data?.id ?? data?.id_class ?? crypto.randomUUID())
      const created: GymClass = {
        id,
        name: name.trim(),
        modality: modality.trim() || undefined,
        schedule: schedule.trim() || undefined,
        contents: [],
        videos: [],
        createdAt: new Date().toISOString(),
      }
      addClass(created)
      setExpandedId(id)
      setName('')
      setModality('')
      setSchedule('')
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível criar a aula.'))
    } finally {
      setCreating(false)
    }
  }

  async function addContent(id: string, content: string) {
    await api.post('/Gym/Classes/Information', { id_class: id, content })
    addContentStore(id, content)
  }

  async function addVideo(id: string, url: string) {
    await api.post('/Gym/Classes/Videos', { id_class: id, url })
    addVideoStore(id, url)
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
              name="className"
              label="Nome da aula"
              placeholder="Ex: Fundamentos — Faixa Branca"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                name="modality"
                label="Modalidade"
                placeholder="Ex: Krav Maga"
                value={modality}
                onChange={(e) => setModality(e.target.value)}
              />
              <Input
                name="schedule"
                label="Horário"
                placeholder="Ex: Seg/Qua · 19:00"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
              />
            </div>
            <Button type="submit" loading={creating}>
              <Plus size={18} /> Criar aula
            </Button>
          </Card>
        </form>

        <div className="flex items-center justify-between">
          <SectionTitle>Aulas da academia</SectionTitle>
          <Badge tone="soft">{classes.length}</Badge>
        </div>

        {classes.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            message="Nenhuma aula criada ainda. Crie a primeira acima."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {classes.map((c) => (
              <ClassManagerCard
                key={c.id}
                gymClass={c}
                expanded={expandedId === c.id}
                onToggle={() =>
                  setExpandedId((id) => (id === c.id ? null : c.id))
                }
                onAddContent={(text) => addContent(c.id, text)}
                onAddVideo={(url) => addVideo(c.id, url)}
                onRemove={() => {
                  if (window.confirm('Excluir esta aula?')) removeClass(c.id)
                }}
              />
            ))}
          </div>
        )}

        <InfoNote>
          O conteúdo e os vídeos adicionados aqui ficam visíveis para os alunos
          na aba <strong>Aulas</strong>.
        </InfoNote>
      </div>
    </div>
  )
}

function ClassManagerCard({
  gymClass: c,
  expanded,
  onToggle,
  onAddContent,
  onAddVideo,
  onRemove,
}: {
  gymClass: GymClass
  expanded: boolean
  onToggle: () => void
  onAddContent: (text: string) => Promise<void>
  onAddVideo: (url: string) => Promise<void>
  onRemove: () => void
}) {
  const [contentDraft, setContentDraft] = useState('')
  const [videoDraft, setVideoDraft] = useState('')
  const [savingContent, setSavingContent] = useState(false)
  const [savingVideo, setSavingVideo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submitContent(e: FormEvent) {
    e.preventDefault()
    if (!contentDraft.trim()) return
    setSavingContent(true)
    setError(null)
    try {
      await onAddContent(contentDraft.trim())
      setContentDraft('')
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível adicionar o conteúdo.'))
    } finally {
      setSavingContent(false)
    }
  }

  async function submitVideo(e: FormEvent) {
    e.preventDefault()
    if (!videoDraft.trim()) return
    setSavingVideo(true)
    setError(null)
    try {
      await onAddVideo(videoDraft.trim())
      setVideoDraft('')
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível adicionar o vídeo.'))
    } finally {
      setSavingVideo(false)
    }
  }

  return (
    <Card className="flex flex-col gap-0 overflow-hidden p-0">
      <button
        onClick={onToggle}
        className="flex items-center gap-3 p-4 text-left transition-colors hover:bg-canvas"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <GraduationCap size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-display text-[15px] font-bold uppercase tracking-tight text-content">
            {c.name}
          </h4>
          <p className="truncate text-xs text-muted">
            {c.modality ? `${c.modality} · ` : ''}
            {c.contents.length} conteúdo(s) · {c.videos.length} vídeo(s)
          </p>
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 text-neutral-400 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {expanded && (
        <div className="flex animate-fade-in flex-col gap-4 border-t border-line bg-canvas/40 p-4">
          {c.schedule && (
            <p className="flex items-center gap-2 text-sm text-content">
              <Clock size={15} className="text-primary" /> {c.schedule}
            </p>
          )}

          {error && <FormError>{error}</FormError>}

          {/* Content */}
          <form onSubmit={submitContent} className="flex flex-col gap-2.5">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted">
              <FileText size={14} /> Conteúdo
            </p>
            {c.contents.map((text, i) => (
              <p
                key={i}
                className="rounded-xl bg-surface px-3 py-2 text-sm text-content"
              >
                {text}
              </p>
            ))}
            <div className="flex gap-2">
              <Input
                name="content"
                placeholder="Descreva o conteúdo da aula..."
                value={contentDraft}
                onChange={(e) => setContentDraft(e.target.value)}
              />
              <Button
                type="submit"
                variant="secondary"
                loading={savingContent}
                className="w-auto shrink-0 px-4"
              >
                <Plus size={18} />
              </Button>
            </div>
          </form>

          {/* Videos */}
          <form onSubmit={submitVideo} className="flex flex-col gap-2.5">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted">
              <Video size={14} /> Vídeos
            </p>
            {c.videos.map((url, i) => (
              <p
                key={i}
                className="flex items-center gap-2 truncate rounded-xl bg-surface px-3 py-2 text-sm text-content"
              >
                <Video size={14} className="shrink-0 text-primary" />
                <span className="truncate">{videoLabel(url)} · {url}</span>
              </p>
            ))}
            <div className="flex gap-2">
              <Input
                name="video"
                type="url"
                placeholder="https://youtube.com/..."
                value={videoDraft}
                onChange={(e) => setVideoDraft(e.target.value)}
              />
              <Button
                type="submit"
                variant="secondary"
                loading={savingVideo}
                className="w-auto shrink-0 px-4"
              >
                <Plus size={18} />
              </Button>
            </div>
          </form>

          <button
            onClick={onRemove}
            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-line text-sm font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary-soft"
          >
            <Trash2 size={16} /> Excluir aula
          </button>
        </div>
      )}
    </Card>
  )
}
