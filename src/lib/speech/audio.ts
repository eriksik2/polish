import letterManifest from '../../data/letter-audio-manifest.json'
import digraphManifest from '../../data/digraph-audio-manifest.json'
import wordManifest from '../../data/word-audio-manifest.json'

const BASE = import.meta.env.BASE_URL

const MANIFESTS: Record<string, Record<string, string>> = {
  alphabet: letterManifest,
  digraphs: digraphManifest,
}

let currentAudio: HTMLAudioElement | null = null

export function hasUnitRecording(moduleId: string, unitId: string): boolean {
  return Boolean(MANIFESTS[moduleId]?.[unitId])
}

export function isModuleAudioAvailable(moduleId: string): boolean {
  const manifest = MANIFESTS[moduleId]
  if (!manifest) return false
  const expected = moduleId === 'alphabet' ? 32 : moduleId === 'digraphs' ? 7 : 0
  return Object.keys(manifest).length >= expected
}

function audioUrl(moduleId: string, unitId: string): string | null {
  const rel = MANIFESTS[moduleId]?.[unitId]
  if (!rel) return null
  return `${BASE}${rel}`
}

export function stopUnitAudio(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }
}

/** @deprecated use stopUnitAudio */
export const stopLetterAudio = stopUnitAudio

export function playUnitAudio(
  moduleId: string,
  unitId: string,
  options?: { onEnd?: () => void; onError?: () => void },
): boolean {
  const url = audioUrl(moduleId, unitId)
  if (!url) {
    options?.onError?.()
    return false
  }

  stopUnitAudio()
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

export function hasWordRecording(wordId: string): boolean {
  return Boolean(wordManifest[wordId as keyof typeof wordManifest])
}

function wordAudioUrl(wordId: string): string | null {
  const rel = wordManifest[wordId as keyof typeof wordManifest]
  if (!rel) return null
  return `${BASE}${rel}`
}

export function playWordAudio(
  wordId: string,
  options?: { onEnd?: () => void; onError?: () => void },
): boolean {
  const url = wordAudioUrl(wordId)
  if (!url) {
    options?.onError?.()
    return false
  }

  stopUnitAudio()
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

/** @deprecated use playUnitAudio */
export function playLetterAudio(
  letterId: string,
  options?: { onEnd?: () => void; onError?: () => void },
): boolean {
  return playUnitAudio('alphabet', letterId, options)
}

/** @deprecated */
export function hasLetterRecording(letterId: string): boolean {
  return hasUnitRecording('alphabet', letterId)
}

/** @deprecated */
export function isLetterAudioAvailable(): boolean {
  return isModuleAudioAvailable('alphabet')
}

export const LETTER_AUDIO_ATTRIBUTION = {
  title: 'Polish Alphabet.oga',
  author: 'Wyksztalcioch',
  license: 'Public domain',
  url: 'https://commons.wikimedia.org/wiki/File:Polish_Alphabet.oga',
}

export const DIGRAPH_AUDIO_ATTRIBUTION = {
  title: 'Wikimedia Commons pronunciation clips',
  author: 'Various native speakers',
  license: 'See individual files on Wikimedia Commons',
  url: 'https://commons.wikimedia.org/wiki/Category:Polish_pronunciation',
}
