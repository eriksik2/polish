import manifest from '../../data/letter-audio-manifest.json'

const BASE = import.meta.env.BASE_URL

let currentAudio: HTMLAudioElement | null = null

export function hasLetterRecording(letterId: string): boolean {
  return letterId in manifest
}

export function isLetterAudioAvailable(): boolean {
  return Object.keys(manifest).length >= 32
}

function audioUrl(letterId: string): string | null {
  const rel = manifest[letterId as keyof typeof manifest]
  if (!rel) return null
  return `${BASE}${rel}`
}

export function stopLetterAudio(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }
}

/** Play native Polish letter pronunciation from bundled recordings (Wikimedia Commons, public domain). */
export function playLetterAudio(
  letterId: string,
  options?: { onEnd?: () => void; onError?: () => void },
): boolean {
  const url = audioUrl(letterId)
  if (!url) {
    options?.onError?.()
    return false
  }

  stopLetterAudio()
  const audio = new Audio(url)
  currentAudio = audio
  audio.onended = () => {
    if (currentAudio === audio) currentAudio = null
    options?.onEnd?.()
  }
  audio.onerror = () => {
    if (currentAudio === audio) currentAudio = null
    options?.onError?.()
  }
  void audio.play().catch(() => options?.onError?.())
  return true
}

export const LETTER_AUDIO_ATTRIBUTION = {
  title: 'Polish Alphabet.oga',
  author: 'Wyksztalcioch',
  license: 'Public domain',
  url: 'https://commons.wikimedia.org/wiki/File:Polish_Alphabet.oga',
}
