import type { PolishLetter } from './alphabet'

/** Canonical digraph data — must match docs/polish-digraphs.md */
export const POLISH_DIGRAPHS: PolishLetter[] = [
  {
    id: 'ch',
    upper: 'CH', lower: 'ch', polishName: 'ch', ipa: '/x/',
    englishApprox: 'ch as in Scottish "loch"',
    englishLabel: 'ch (loch)',
    englishAlternates: ['ch', 'kh', 'loch', 'h'],
    category: 'digraph',
    tips: ['Identical sound to Polish h.', 'Never pronounced as English "church".'],
    examples: [
      { word: 'chleb', meaning: 'bread', highlight: 'ch' },
      { word: 'brzuch', meaning: 'stomach', highlight: 'ch' },
      { word: 'chory', meaning: 'sick', highlight: 'ch' },
    ],
    confusedWith: ['cz', 'sz'],
  },
  {
    id: 'cz',
    upper: 'CZ', lower: 'cz', polishName: 'cz', ipa: '/tʂ/',
    englishApprox: 'ch as in "child" (hard, retroflex)',
    englishLabel: 'ch (child, hard)',
    englishAlternates: ['ch', 'tch', 'child', 'church'],
    category: 'digraph',
    tips: ['Hard affricate — harder than ć.', 'Retroflex: tongue curled back.'],
    examples: [
      { word: 'czas', meaning: 'time', highlight: 'cz' },
      { word: 'cześć', meaning: 'hi', highlight: 'cz' },
      { word: 'cztery', meaning: 'four', highlight: 'cz' },
    ],
    confusedWith: ['sz', 'dż', 'dz'],
  },
  {
    id: 'dz',
    upper: 'DZ', lower: 'dz', polishName: 'dz', ipa: '/dz/',
    englishApprox: 'ds as in "beds"',
    englishLabel: 'ds (beds)',
    englishAlternates: ['ds', 'dz', 'beds'],
    category: 'digraph',
    tips: ['Voiced partner of c (/ts/).', 'Before i often sounds like dź.'],
    examples: [
      { word: 'dzban', meaning: 'jug', highlight: 'dz' },
      { word: 'dzwon', meaning: 'bell', highlight: 'dz' },
      { word: 'bardzo', meaning: 'very', highlight: 'dz' },
    ],
    confusedWith: ['dź', 'dż'],
  },
  {
    id: 'dź',
    upper: 'DŹ', lower: 'dź', polishName: 'dź', ipa: '/dʑ/',
    englishApprox: 'j as in "jeep" (soft)',
    englishLabel: 'j (jeep, soft)',
    englishAlternates: ['j', 'jeep', 'dź'],
    category: 'digraph',
    tips: ['Soft voiced affricate — softer than dż.', 'Often written as dzi before vowels.'],
    examples: [
      { word: 'dźwig', meaning: 'crane/hoist', highlight: 'dź' },
      { word: 'dziadek', meaning: 'grandfather', highlight: 'dzi' },
      { word: 'dzisiaj', meaning: 'today', highlight: 'dzi' },
    ],
    confusedWith: ['dz', 'dż', 'cz'],
  },
  {
    id: 'dż',
    upper: 'DŻ', lower: 'dż', polishName: 'dż', ipa: '/dʐ/',
    englishApprox: 'j as in "jug" (hard)',
    englishLabel: 'j (jug, hard)',
    englishAlternates: ['j', 'jug', 'dż'],
    category: 'digraph',
    tips: ['Hard voiced affricate — voiced partner of cz.', 'Common in loanwords.'],
    examples: [
      { word: 'dżem', meaning: 'jam', highlight: 'dż' },
      { word: 'dżungla', meaning: 'jungle', highlight: 'dż' },
      { word: 'dżinsy', meaning: 'jeans', highlight: 'dż' },
    ],
    confusedWith: ['cz', 'rz'],
  },
  {
    id: 'rz',
    upper: 'RZ', lower: 'rz', polishName: 'rz', ipa: '/ʐ/',
    englishApprox: 'zh as in "measure"',
    englishLabel: 'zh (measure)',
    englishAlternates: ['zh', 'measure', 'si'],
    category: 'digraph',
    tips: ['Same sound as ż in standard Polish.', 'Historically different; now identical for learners.'],
    examples: [
      { word: 'rzeka', meaning: 'river', highlight: 'rz' },
      { word: 'marzec', meaning: 'March', highlight: 'rz' },
      { word: 'przyjaciel', meaning: 'friend', highlight: 'rz' },
    ],
    confusedWith: ['dż', 'sz'],
  },
  {
    id: 'sz',
    upper: 'SZ', lower: 'sz', polishName: 'sz', ipa: '/ʂ/',
    englishApprox: 'sh as in "shore" (hard)',
    englishLabel: 'sh (shore, hard)',
    englishAlternates: ['sh', 'shore', 'ship'],
    category: 'digraph',
    tips: ['Hard fricative — harder than ś.', 'Retroflex sh sound.'],
    examples: [
      { word: 'szum', meaning: 'noise/hiss', highlight: 'sz' },
      { word: 'szkoła', meaning: 'school', highlight: 'sz' },
      { word: 'nasz', meaning: 'our', highlight: 'sz' },
    ],
    confusedWith: ['cz', 'rz'],
  },
]

export const DIGRAPH_MAP = new Map(POLISH_DIGRAPHS.map((d) => [d.id, d]))

export const GENERAL_DIGRAPH_LESSON = {
  id: 'general',
  title: 'Polish Digraphs',
  sections: [
    {
      heading: 'What are digraphs?',
      body: 'Digraphs are two-letter combinations that represent a single sound. Polish has seven: ch, cz, dz, dź, dż, rz, sz.',
    },
    {
      heading: 'Same sound, different spelling',
      body: 'ch sounds exactly like h. rz sounds exactly like ż. You must learn both spellings even when the sound is identical.',
    },
    {
      heading: 'Hard vs soft',
      body: 'cz/sz are hard (retroflex); ć/ś are soft. dż is hard; dź is soft. dz is the voiced partner of c.',
    },
    {
      heading: 'Why this matters',
      body: 'Digraphs appear in almost every Polish word. Mastering them unlocks reading words like szczęście (happiness) and przyjaciel (friend).',
    },
  ],
}

export function getDigraph(id: string): PolishLetter | undefined {
  return DIGRAPH_MAP.get(id)
}

export function getAllDigraphIds(): string[] {
  return POLISH_DIGRAPHS.map((d) => d.id)
}

export function getDigraphDistractorLabels(correct: PolishLetter, count: number): string[] {
  const others = POLISH_DIGRAPHS.filter((d) => d.id !== correct.id)
  const shuffled = [...others].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map((d) => d.englishLabel)
}

export function getDigraphDistractors(correct: PolishLetter, count: number): PolishLetter[] {
  const pool = correct.confusedWith
    ? correct.confusedWith.map((id) => DIGRAPH_MAP.get(id)!).filter(Boolean)
    : []
  const others = POLISH_DIGRAPHS.filter(
    (d) => d.id !== correct.id && !pool.some((p) => p.id === d.id),
  )
  const combined = [...pool, ...others.sort(() => Math.random() - 0.5)]
  return combined.slice(0, count)
}
