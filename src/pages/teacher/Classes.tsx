import { useState, type FormEvent } from 'react'
import { GraduationCap, FileText, Video, Check, Plus } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { InfoNote } from '@/components/ui/InfoNote'
import { FormError } from '@/components/ui/FormError'
import { SectionTitle } from '@/components/ui/SectionTitle'

/**
 * Manage classes. A class must be created (POST /Gym/Classes/Creation) before
 * content (POST /Gym/Classes/Information) or videos (POST /Gym/Classes/Videos)
 * can be attached. Body field names should be confirmed with the backend.
 */
export function Classes() {
  const [classId, setClassId] = useState<string | number | null>(null)
  const [className, setClassName] = useState('')

  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Attached items (kept in view after each successful POST).
  const [contents, setContents] = useState<string[]>([])
  const [videos, setVideos] = useState<string[]>([])
  const [contentDraft, setContentDraft] = useState('')
  const [videoDraft, setVideoDraft] = useState('')
  const [savingContent, setSavingContent] = useState(false)
  const [savingVideo, setSavingVideo] = useState(false)

  async function createClass(e: FormEvent) {
    e.preventDefault()
    if (!className.trim()) return
    setCreating(true)
    setError(null)
    try {
      const { data } = await api.post<Record<string, unknown>>(
        '/Gym/Classes/Creation',
        { name: className },
      )
      setClassId(String(data?.id ?? data?.id_class ?? className))
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível criar a aula.'))
    } finally {
      setCreating(false)
    }
  }

  async function addContent(e: FormEvent) {
    e.preventDefault()
    if (!contentDraft.trim()) return
    setSavingContent(true)
    setError(null)
    try {
      await api.post('/Gym/Classes/Information', {
        id_class: classId,
        content: contentDraft,
      })
      setContents((c) => [...c, contentDraft])
      setContentDraft('')
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível adicionar o conteúdo.'))
    } finally {
      setSavingContent(false)
    }
  }

  async function addVideo(e: FormEvent) {
    e.preventDefault()
    if (!videoDraft.trim()) return
    setSavingVideo(true)
    setError(null)
    try {
      await api.post('/Gym/Classes/Videos', {
        id_class: classId,
        url: videoDraft,
      })
      setVideos((v) => [...v, videoDraft])
      setVideoDraft('')
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível adicionar o vídeo.'))
    } finally {
      setSavingVideo(false)
    }
  }

  return (
    <div className="flex flex-col">
      <Header title="Aulas" backTo="/students" />

      <div className="flex flex-col gap-6 px-6 py-6">
        <SectionTitle underline>Gerenciar aulas</SectionTitle>

        {error && <FormError>{error}</FormError>}

        {/* Step 1: create the class */}
        <form onSubmit={createClass}>
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-white dark:bg-white/10">
                <GraduationCap size={20} />
              </span>
              <h3 className="font-display text-sm font-bold uppercase tracking-tight text-content">
                Nova aula
              </h3>
              {classId && <Check size={18} className="ml-auto text-primary" />}
            </div>
            <Input
              name="className"
              label="Nome da aula"
              placeholder="Ex: Fundamentos — Faixa Branca"
              value={className}
              disabled={Boolean(classId)}
              onChange={(e) => setClassName(e.target.value)}
            />
            {!classId && (
              <Button type="submit" loading={creating}>
                Criar aula
              </Button>
            )}
          </Card>
        </form>

        {!classId && (
          <InfoNote>
            Crie a aula antes de adicionar conteúdo e vídeos.
          </InfoNote>
        )}

        {/* Step 2: content + videos (unlocked after creation) */}
        {classId && (
          <>
            <form onSubmit={addContent}>
              <Card className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-primary">
                    <FileText size={20} />
                  </span>
                  <h3 className="font-display text-sm font-bold uppercase tracking-tight text-content">
                    Conteúdo
                  </h3>
                </div>
                {contents.map((c, i) => (
                  <p
                    key={i}
                    className="rounded-lg bg-canvas px-3 py-2 text-sm text-content"
                  >
                    {c}
                  </p>
                ))}
                <Input
                  name="content"
                  placeholder="Descreva o conteúdo da aula..."
                  value={contentDraft}
                  onChange={(e) => setContentDraft(e.target.value)}
                />
                <Button type="submit" variant="secondary" loading={savingContent}>
                  <Plus size={18} /> Adicionar conteúdo
                </Button>
              </Card>
            </form>

            <form onSubmit={addVideo}>
              <Card className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-primary">
                    <Video size={20} />
                  </span>
                  <h3 className="font-display text-sm font-bold uppercase tracking-tight text-content">
                    Vídeos
                  </h3>
                </div>
                {videos.map((v, i) => (
                  <p
                    key={i}
                    className="truncate rounded-lg bg-canvas px-3 py-2 font-mono text-sm text-content"
                  >
                    {v}
                  </p>
                ))}
                <Input
                  name="video"
                  type="url"
                  placeholder="https://..."
                  value={videoDraft}
                  onChange={(e) => setVideoDraft(e.target.value)}
                />
                <Button type="submit" variant="secondary" loading={savingVideo}>
                  <Plus size={18} /> Adicionar vídeo
                </Button>
              </Card>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
