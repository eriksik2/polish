/** Polish multi-letter graphemes — longest match first */
export const POLISH_MULTIGRAPHS = ['dź', 'dż', 'dz', 'ch', 'cz', 'rz', 'sz'] as const

export const POLISH_DIGRAPH_IDS = new Set(POLISH_MULTIGRAPHS)

/** Tokenize a Polish word into grapheme units (letters + digraphs). */
export function tokenizeGraphemes(word: string): string[] {
  const lower = word.toLowerCase()
  const tokens: string[] = []
  let i = 0

  while (i < lower.length) {
    let matched: string | null = null
    for (const mg of POLISH_MULTIGRAPHS) {
      if (lower.slice(i, i + mg.length) === mg) {
        matched = mg
        i += mg.length
        break
      }
    }
    if (!matched) {
      tokens.push(lower[i])
      i += 1
    } else {
      tokens.push(matched)
    }
  }

  return tokens
}

/**
 * Map lesson highlight text to the unit id it represents at a grapheme index.
 * Handles dzi→dź, ci→ć style spellings before vowels.
 */
export function highlightToUnitId(highlight: string): string {
  const h = highlight.toLowerCase()
  if (h === 'dzi') return 'dź'
  if (h === 'ci') return 'ć'
  if (h === 'si') return 'ś'
  if (h === 'zi') return 'ź'
  if (h === 'ni') return 'ń'
  return h
}

/** Find grapheme index for a highlight substring in a word. */
export function findHighlightIndex(word: string, highlight: string): number {
  const tokens = tokenizeGraphemes(word)
  const unitId = highlightToUnitId(highlight)
  const lower = word.toLowerCase()
  const h = highlight.toLowerCase()

  // Direct substring match at grapheme boundaries
  let pos = 0
  for (let i = 0; i < tokens.length; i++) {
    const slice = lower.slice(pos, pos + h.length)
    if (slice === h || tokens[i] === unitId || tokens[i] === h) {
      if (slice === h || tokens[i] === unitId) return i
    }
    pos += tokens[i].length
  }

  // Spelling variants (dziadek → dź at index 0)
  if (lower.startsWith(h)) {
    return 0
  }

  throw new Error(`Cannot locate highlight "${highlight}" in "${word}" (tokens: ${tokens.join(' ')})`)
}

export function graphemeAtIndex(word: string, index: number): string {
  return tokenizeGraphemes(word)[index]
}

export function wordContainsUnit(word: string, unitId: string): boolean {
  const tokens = tokenizeGraphemes(word)
  if (tokens.includes(unitId)) return true

  const lower = word.toLowerCase()
  const spellingPrefixes: Record<string, string[]> = {
    'dź': ['dzi', 'dź'],
    'ć': ['ci', 'ć'],
    'ś': ['si', 'ś'],
    'ź': ['zi', 'ź'],
    'ń': ['ni', 'ń'],
  }

  const prefixes = spellingPrefixes[unitId]
  if (!prefixes) return false

  for (const p of prefixes) {
    if (lower.includes(p)) {
      // Ensure match aligns with a syllable boundary (start or after vowel)
      const idx = lower.indexOf(p)
      if (idx === 0 || isVowel(lower[idx - 1])) {
        return true
      }
    }
  }
  return false
}

function isVowel(ch: string): boolean {
  return 'aąeęioóuy'.includes(ch)
}

/** Spelling digraphs that map to a single phoneme unit for audio playback */
const SPELLING_TO_PHONEME: Record<string, string> = {
  dzi: 'dź',
  ci: 'ć',
  si: 'ś',
  zi: 'ź',
  ni: 'ń',
}

/**
 * Convert tokenized graphemes to audio unit ids (letters/digraphs with recordings).
 * Merges soft spelling pairs (si→ś, ci→ć, etc.) so composed playback matches pronunciation.
 */
export function graphemesToAudioIds(graphemes: string[]): string[] {
  const out: string[] = []
  let i = 0
  while (i < graphemes.length) {
    const pair = graphemes[i] + (graphemes[i + 1] ?? '')
    const triple = graphemes[i] + (graphemes[i + 1] ?? '') + (graphemes[i + 2] ?? '')
    if (SPELLING_TO_PHONEME[triple]) {
      out.push(SPELLING_TO_PHONEME[triple])
      i += 3
    } else if (SPELLING_TO_PHONEME[pair]) {
      out.push(SPELLING_TO_PHONEME[pair])
      i += 2
    } else {
      out.push(highlightToUnitId(graphemes[i]))
      i += 1
    }
  }
  return out
}

/** Max graphemes in a composed word clip — longer words sound wrong when spelled out. */
export const MAX_COMPOSABLE_AUDIO_GRAPHENES = 6

/**
 * Whether letter-by-letter playback is a reasonable stand-in for a whole word.
 * Rejects long words, phrases, and forms where sequential units won't match pronunciation.
 */
export function isComposableWordAudio(surface: string, audioIds: string[]): boolean {
  if (!audioIds.length || audioIds.length > MAX_COMPOSABLE_AUDIO_GRAPHENES) return false
  if (/\s/.test(surface.trim())) return false
  const clean = surface.replace(/[^\p{L}]/gu, '')
  if (!clean) return false
  // Spelling must match merged audio units (no hidden phonological rewrites beyond soft pairs)
  const expected = wordToAudioGraphemeIds(clean)
  if (expected.length !== audioIds.length) return false
  return expected.every((g, i) => g === audioIds[i])
}

/** Tokenize a word (or phrase) into audio-ready grapheme unit ids. */
export function wordToAudioGraphemeIds(word: string): string[] {
  const parts = word.trim().split(/\s+/)
  const sequence: string[] = []
  for (const part of parts) {
    const clean = part.replace(/[^\p{L}]/gu, '')
    if (!clean) continue
    sequence.push(...graphemesToAudioIds(tokenizeGraphemes(clean)))
  }
  return sequence
}

/** Render word with one grapheme index highlighted for display */
export function renderHighlightedWord(word: string, highlightIndex: number): {
  before: string
  highlight: string
  after: string
} {
  const tokens = tokenizeGraphemes(word)
  const before = tokens.slice(0, highlightIndex).join('')
  const highlight = tokens[highlightIndex] ?? ''
  const after = tokens.slice(highlightIndex + 1).join('')
  return { before, highlight, after }
}
