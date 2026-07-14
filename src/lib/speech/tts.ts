const POLISH_LOCALE = 'pl-PL'

let voicesCache: SpeechSynthesisVoice[] | null = null

export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function getPolishVoices(): SpeechSynthesisVoice[] {
  if (!isTTSSupported()) return []
  if (!voicesCache || voicesCache.length === 0) {
    voicesCache = speechSynthesis.getVoices().filter(
      (v) => v.lang.startsWith('pl') || v.lang.includes('PL'),
    )
    if (voicesCache.length === 0) {
      voicesCache = speechSynthesis.getVoices()
    }
  }
  return voicesCache
}

export function refreshVoices(): SpeechSynthesisVoice[] {
  voicesCache = null
  return getPolishVoices()
}

function getVoice(preferredName?: string): SpeechSynthesisVoice | null {
  const voices = getPolishVoices()
  if (preferredName) {
    const found = voices.find((v) => v.name === preferredName)
    if (found) return found
  }
  const polish = voices.find((v) => v.lang === 'pl-PL')
  return polish ?? voices[0] ?? null
}

export function speak(
  text: string,
  options?: { rate?: number; preferredVoiceName?: string; onEnd?: () => void },
): void {
  if (!isTTSSupported()) return

  speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = POLISH_LOCALE
  utterance.rate = options?.rate ?? 0.85

  const voice = getVoice(options?.preferredVoiceName)
  if (voice) utterance.voice = voice

  if (options?.onEnd) utterance.onend = options.onEnd

  speechSynthesis.speak(utterance)
}

/** Speak Polish letter name for spelling exercises */
export function speakLetterName(polishName: string, preferredVoiceName?: string): void {
  speak(polishName, { preferredVoiceName })
}

/** Speak example word to demonstrate letter sound */
export function speakExampleWord(word: string, preferredVoiceName?: string): void {
  speak(word, { rate: 0.75, preferredVoiceName })
}

/** For hear exercises — speak the letter sound via example word */
export function speakLetterSound(
  letter: { id: string; examples: { word: string }[]; polishName: string },
  preferredVoiceName?: string,
): void {
  if (letter.examples.length > 0) {
    speakExampleWord(letter.examples[0].word, preferredVoiceName)
  } else {
    speakLetterName(letter.polishName, preferredVoiceName)
  }
}

export function stopSpeaking(): void {
  if (isTTSSupported()) speechSynthesis.cancel()
}
