import { getUnit } from '../../data/moduleRegistry'

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
  rec.interimResults = true
  rec.maxAlternatives = 5
  return rec
}

export interface ListenResult {
  transcript: string
  confidence: number
  alternatives: string[]
}

export type ListenStatus = 'idle' | 'listening' | 'processing'

export interface ListenInteractiveCallbacks {
  onLevels: (levels: number[]) => void
  onStatus?: (status: ListenStatus) => void
}

function rmsFromTimeDomain(data: Uint8Array): number {
  let sum = 0
  for (let i = 0; i < data.length; i++) {
    const v = (data[i] - 128) / 128
    sum += v * v
  }
  return Math.sqrt(sum / data.length)
}

function barsFromFrequency(data: Uint8Array, barCount: number): number[] {
  const bars: number[] = []
  const step = Math.floor(data.length / barCount)
  for (let i = 0; i < barCount; i++) {
    let peak = 0
    const start = i * step
    for (let j = start; j < start + step; j++) {
      peak = Math.max(peak, data[j] / 255)
    }
    bars.push(peak)
  }
  return bars
}

/**
 * Listen with live waveform levels and voice-activity detection.
 * Stops soon after you finish speaking instead of waiting for a long timeout.
 */
export function listenInteractive(
  callbacks: ListenInteractiveCallbacks,
  options?: {
    maxMs?: number
    silenceMs?: number
    speechThreshold?: number
    barCount?: number
  },
): { promise: Promise<ListenResult>; abort: () => void } {
  const maxMs = options?.maxMs ?? 6000
  const silenceMs = options?.silenceMs ?? 700
  const speechThreshold = options?.speechThreshold ?? 0.018
  const barCount = options?.barCount ?? 28

  let aborted = false
  let settled = false
  let rafId = 0
  let stream: MediaStream | null = null
  let audioCtx: AudioContext | null = null
  let rec: SpeechRecognition | null = null

  const cleanup = () => {
    cancelAnimationFrame(rafId)
    stream?.getTracks().forEach((t) => t.stop())
    stream = null
    if (audioCtx && audioCtx.state !== 'closed') {
      void audioCtx.close()
    }
    audioCtx = null
  }

  const abort = () => {
    if (settled) return
    aborted = true
    try {
      rec?.stop()
    } catch {
      /* ignore */
    }
    cleanup()
  }

  const promise = new Promise<ListenResult>((resolve, reject) => {
    const fail = (err: Error) => {
      if (settled || aborted) return
      settled = true
      cleanup()
      callbacks.onStatus?.('idle')
      reject(err)
    }

    const succeed = (result: ListenResult) => {
      if (settled || aborted) return
      settled = true
      cleanup()
      callbacks.onStatus?.('idle')
      resolve(result)
    }

    const run = async () => {
      rec = createRecognition()
      if (!rec) {
        fail(new Error('Speech recognition not supported'))
        return
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch {
        fail(new Error('Microphone access denied. Allow the mic in browser settings.'))
        return
      }

      if (aborted) return

      audioCtx = new AudioContext()
      await audioCtx.resume()

      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.65
      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)

      const timeData = new Uint8Array(analyser.fftSize)
      const freqData = new Uint8Array(analyser.frequencyBinCount)

      let hasSpeech = false
      let lastSpeechAt = 0
      let bestTranscript = ''
      let bestConfidence = 0
      const alternatives = new Set<string>()

      callbacks.onStatus?.('listening')

      const maxTimer = setTimeout(() => {
        callbacks.onStatus?.('processing')
        try {
          rec?.stop()
        } catch {
          if (!bestTranscript) fail(new Error('No speech detected — try again closer to the mic'))
        }
      }, maxMs)

      const tick = () => {
        if (settled || aborted) return

        analyser.getByteTimeDomainData(timeData)
        analyser.getByteFrequencyData(freqData)

        const level = rmsFromTimeDomain(timeData)
        const bars = barsFromFrequency(freqData, barCount)
        // Blend RMS into bars so quiet speech still shows movement
        const boosted = bars.map((b) => Math.min(1, Math.max(b, level * 2.5)))
        callbacks.onLevels(boosted)

        const now = performance.now()
        if (level > speechThreshold) {
          hasSpeech = true
          lastSpeechAt = now
        } else if (hasSpeech && now - lastSpeechAt > silenceMs) {
          callbacks.onStatus?.('processing')
          try {
            rec?.stop()
          } catch {
            /* ignore */
          }
          return
        }

        rafId = requestAnimationFrame(tick)
      }

      rafId = requestAnimationFrame(tick)

      rec.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          for (let j = 0; j < result.length; j++) {
            alternatives.add(result[j].transcript)
          }
          if (result.isFinal) {
            bestTranscript = result[0].transcript
            bestConfidence = result[0].confidence
            clearTimeout(maxTimer)
            callbacks.onStatus?.('processing')
            try {
              rec?.stop()
            } catch {
              /* ignore */
            }
          } else if (!bestTranscript) {
            bestTranscript = result[0].transcript
            bestConfidence = result[0].confidence
          }
        }
      }

      rec.onerror = (event: SpeechRecognitionErrorEvent) => {
        clearTimeout(maxTimer)
        if (event.error === 'aborted' && (settled || aborted)) return
        if (event.error === 'no-speech' && bestTranscript) {
          succeed({
            transcript: bestTranscript,
            confidence: bestConfidence,
            alternatives: [...alternatives],
          })
          return
        }
        const messages: Record<string, string> = {
          'no-speech': 'No speech detected — tap the mic and say the letter',
          'not-allowed': 'Microphone blocked — check browser permissions',
          network: 'Speech recognition needs a network connection',
        }
        fail(new Error(messages[event.error] ?? `Recognition error: ${event.error}`))
      }

      rec.onend = () => {
        clearTimeout(maxTimer)
        if (settled || aborted) return
        if (bestTranscript.trim()) {
          succeed({
            transcript: bestTranscript,
            confidence: bestConfidence,
            alternatives: [...alternatives],
          })
        } else {
          fail(new Error('No speech detected — tap the mic and say the letter'))
        }
      }

      try {
        rec.start()
      } catch {
        fail(new Error('Could not start listening — try again'))
      }
    }

    void run()
  })

  return { promise, abort }
}

/** @deprecated Use listenInteractive for waveform + faster end detection */
export function listenOnce(timeoutMs = 8000): Promise<ListenResult> {
  const { promise } = listenInteractive(
    { onLevels: () => {} },
    { maxMs: timeoutMs },
  )
  return promise
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
  moduleId: string,
  unitId: string,
  transcript: string,
  alternatives: string[] = [],
): { correct: boolean; score: number; feedback: string } {
  const letter = getUnit(moduleId, unitId)
  if (!letter) return { correct: false, score: 0, feedback: 'Unknown letter' }

  const allTexts = [transcript, ...alternatives].map(normalize).filter(Boolean)
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
      if (!target) continue
      if (text === target) bestScore = Math.max(bestScore, 1)
      else if (text.includes(target) || target.includes(text)) bestScore = Math.max(bestScore, 0.85)
    }
    for (const w of text.split(/\s+/)) {
      if (targets.has(w)) bestScore = Math.max(bestScore, 0.9)
    }
  }

  // Short utterances: accept close phonetic name attempts
  if (bestScore < 0.8 && allTexts.some((t) => t.length <= 4)) {
    const name = normalize(letter.polishName)
    for (const text of allTexts) {
      if (name.startsWith(text) || text.startsWith(name)) bestScore = Math.max(bestScore, 0.82)
    }
  }

  const correct = bestScore >= 0.8
  const feedback = correct
    ? '✓ Correct!'
    : `✗ Not quite — scroll down for details`

  return { correct, score: bestScore, feedback }
}
