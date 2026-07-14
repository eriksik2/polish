import { getLetter } from '../../data/alphabet'

const POLISH_LOCALE = 'pl-PL'

export function isSTTSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  )
}

function createRecognition(): SpeechRecognition | null {
  if (!isSTTSupported()) return null
  const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition
  const rec = new Ctor()
  rec.lang = POLISH_LOCALE
  rec.interimResults = false
  rec.maxAlternatives = 5
  return rec
}

export interface ListenResult {
  transcript: string
  confidence: number
  alternatives: string[]
}

export function listenOnce(timeoutMs = 8000): Promise<ListenResult> {
  return new Promise((resolve, reject) => {
    const rec = createRecognition()
    if (!rec) {
      reject(new Error('Speech recognition not supported'))
      return
    }

    const timer = setTimeout(() => {
      rec.stop()
      reject(new Error('Listening timed out'))
    }, timeoutMs)

    rec.onresult = (event: SpeechRecognitionEvent) => {
      clearTimeout(timer)
      const result = event.results[0]
      const alternatives: string[] = []
      for (let i = 0; i < result.length; i++) {
        alternatives.push(result[i].transcript)
      }
      resolve({
        transcript: result[0].transcript,
        confidence: result[0].confidence,
        alternatives,
      })
    }

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      clearTimeout(timer)
      reject(new Error(event.error))
    }

    rec.onend = () => clearTimeout(timer)
    rec.start()
  })
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/** Score how well spoken input matches expected letter */
export function scorePronunciation(
  letterId: string,
  transcript: string,
  alternatives: string[] = [],
): { correct: boolean; score: number; feedback: string } {
  const letter = getLetter(letterId)
  if (!letter) return { correct: false, score: 0, feedback: 'Unknown letter' }

  const allTexts = [transcript, ...alternatives].map(normalize)
  const targets = new Set<string>([
    normalize(letter.lower),
    normalize(letter.upper),
    normalize(letter.polishName),
    normalize(letter.id),
    ...letter.englishAlternates.map(normalize),
    ...letter.examples.map((e) => normalize(e.word)),
    ...letter.examples.map((e) => normalize(e.highlight)),
  ])

  let bestScore = 0
  for (const text of allTexts) {
    for (const target of targets) {
      if (text === target) bestScore = Math.max(bestScore, 1)
      else if (text.includes(target) || target.includes(text)) bestScore = Math.max(bestScore, 0.8)
    }
    const words = text.split(/\s+/)
    for (const w of words) {
      if (targets.has(w)) bestScore = Math.max(bestScore, 0.9)
    }
  }

  const correct = bestScore >= 0.8
  const feedback = correct
    ? 'Great pronunciation!'
    : `Expected something like "${letter.englishApprox}" or the letter name "${letter.polishName}". Heard: "${transcript}"`

  return { correct, score: bestScore, feedback }
}
