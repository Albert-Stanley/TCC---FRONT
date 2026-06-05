/** Extracts a YouTube video id from common URL shapes, or null. */
export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url.trim())
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') return u.pathname.slice(1) || null
    if (host.endsWith('youtube.com')) {
      if (u.pathname === '/watch') return u.searchParams.get('v')
      const m = u.pathname.match(/\/(embed|shorts)\/([\w-]+)/)
      if (m) return m[2]
    }
    return null
  } catch {
    return null
  }
}

/** Medium-quality thumbnail URL for a YouTube id. */
export function youtubeThumb(id: string): string {
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`
}

/** A short, human label for a video URL (host or "YouTube"). */
export function videoLabel(url: string): string {
  if (youtubeId(url)) return 'YouTube'
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'Vídeo'
  }
}
