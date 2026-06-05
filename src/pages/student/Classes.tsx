import { useState } from 'react'
import { GraduationCap, ChevronDown, FileText, Play, Clock, Video } from 'lucide-react'
import { useClassStore } from '@/store/classStore'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { youtubeId, youtubeThumb, videoLabel } from '@/lib/video'
import type { GymClass } from '@/types'

/**
 * Student view of the gym's classes: read-only list with each class's content
 * notes and videos. Reads from the class store (the teacher populates it via
 * the class manager — no GET endpoint exists in the API map yet).
 */
export function StudentClasses() {
  const classes = useClassStore((s) => s.classes)
  const [expandedId, setExpandedId] = useState<string | null>(
    classes[0]?.id ?? null,
  )

  return (
    <div className="flex flex-col">
      <Header
        title="Aulas"
        subtitle="Conteúdos e vídeos das aulas da sua academia."
        back={false}
      />

      <div className="flex flex-col gap-4 px-6 py-6">
        {classes.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            message="Nenhuma aula disponível ainda. Seu professor publicará os conteúdos aqui."
          />
        ) : (
          classes.map((c) => (
            <ClassCard
              key={c.id}
              gymClass={c}
              expanded={expandedId === c.id}
              onToggle={() =>
                setExpandedId((id) => (id === c.id ? null : c.id))
              }
            />
          ))
        )}
      </div>
    </div>
  )
}

function ClassCard({
  gymClass: c,
  expanded,
  onToggle,
}: {
  gymClass: GymClass
  expanded: boolean
  onToggle: () => void
}) {
  const hasContent = c.contents.length > 0 || c.videos.length > 0

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
          <h3 className="truncate font-display text-[15px] font-bold uppercase tracking-tight text-content">
            {c.name}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {c.modality && <Badge tone="neutral">{c.modality}</Badge>}
            {c.videos.length > 0 && (
              <Badge tone="soft">{c.videos.length} vídeo(s)</Badge>
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
        <div className="flex animate-fade-in flex-col gap-4 border-t border-line bg-canvas/40 p-4">
          {c.schedule && (
            <p className="flex items-center gap-2 text-sm text-content">
              <Clock size={15} className="text-primary" /> {c.schedule}
            </p>
          )}

          {!hasContent && (
            <p className="text-sm text-muted">
              O professor ainda não publicou conteúdo para esta aula.
            </p>
          )}

          {c.contents.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted">
                <FileText size={14} /> Conteúdo
              </p>
              {c.contents.map((text, i) => (
                <p
                  key={i}
                  className="rounded-xl bg-surface px-3 py-2.5 text-sm text-content"
                >
                  {text}
                </p>
              ))}
            </div>
          )}

          {c.videos.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted">
                <Video size={14} /> Vídeos
              </p>
              {c.videos.map((url, i) => (
                <VideoCard key={i} url={url} />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function VideoCard({ url }: { url: string }) {
  const id = youtubeId(url)
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-primary/40"
    >
      <span className="relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden bg-ink">
        {id ? (
          <img
            src={youtubeThumb(id)}
            alt=""
            className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
            loading="lazy"
          />
        ) : (
          <Video size={22} className="text-white/70" />
        )}
        <span className="absolute flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-primary">
          <Play size={15} className="ml-0.5" fill="currentColor" />
        </span>
      </span>
      <div className="min-w-0 flex-1 py-2 pr-3">
        <p className="truncate text-sm font-semibold text-content">
          {videoLabel(url)}
        </p>
        <p className="truncate text-xs text-muted">{url}</p>
      </div>
    </a>
  )
}
