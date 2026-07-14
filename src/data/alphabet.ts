export type LetterCategory = 'vowel' | 'consonant' | 'digraph'

export interface LetterExample {
  word: string
  meaning: string
  /** Which part of the word highlights the letter */
  highlight: string
}

export interface PolishLetter {
  id: string
  upper: string
  lower: string
  polishName: string
  ipa: string
  englishApprox: string
  englishLabel: string
  englishAlternates: string[]
  category: LetterCategory
  tips: string[]
  examples: LetterExample[]
  confusedWith?: string[]
}

/** Canonical alphabet data — must match docs/polish-alphabet.md */
export const POLISH_ALPHABET: PolishLetter[] = [
  {
    id: 'a',
    upper: 'A', lower: 'a', polishName: 'a', ipa: '/a/',
    englishApprox: 'ah as in "father"',
    englishLabel: 'ah (father)',
    englishAlternates: ['ah', 'a', 'father'],
    category: 'vowel',
    tips: ['Always pronounced the same — like "a" in "father".', 'One of the most common letters in Polish.'],
    examples: [
      { word: 'auto', meaning: 'car', highlight: 'a' },
      { word: 'mama', meaning: 'mom', highlight: 'a' },
      { word: 'tam', meaning: 'there', highlight: 'a' },
    ],
  },
  {
    id: 'ą',
    upper: 'Ą', lower: 'ą', polishName: 'ą', ipa: '/ɔw̃/',
    englishApprox: 'own (nasal) — like "own" but through nose',
    englishLabel: 'own (nasal)',
    englishAlternates: ['own', 'on', 'ow', 'nasal o'],
    category: 'vowel',
    tips: ['A nasal vowel — air flows through nose and mouth.', 'Before w or word-finally, often loses full nasality.'],
    examples: [
      { word: 'gąś', meaning: 'geese (archaic/vocative)', highlight: 'ą' },
      { word: 'mąż', meaning: 'husband', highlight: 'ą' },
      { word: 'wąch', meaning: 'smell', highlight: 'ą' },
    ],
    confusedWith: ['ę', 'o'],
  },
  {
    id: 'b',
    upper: 'B', lower: 'b', polishName: 'be', ipa: '/b/',
    englishApprox: 'b as in "bed"',
    englishLabel: 'b (bed)',
    englishAlternates: ['b', 'bed'],
    category: 'consonant',
    tips: ['Devoiced to p at the end of words.'],
    examples: [
      { word: 'bardzo', meaning: 'very', highlight: 'b' },
      { word: 'brat', meaning: 'brother', highlight: 'b' },
      { word: 'być', meaning: 'to be', highlight: 'b' },
    ],
  },
  {
    id: 'c',
    upper: 'C', lower: 'c', polishName: 'ce', ipa: '/t̪s̪/',
    englishApprox: 'ts as in "cats"',
    englishLabel: 'ts (cats)',
    englishAlternates: ['ts', 'tz', 'cats'],
    category: 'consonant',
    tips: ['Never pronounced as "k" or "s" alone.', 'Always the "ts" sound — like end of "cats".'],
    examples: [
      { word: 'co', meaning: 'what', highlight: 'c' },
      { word: 'cały', meaning: 'whole', highlight: 'c' },
      { word: 'czas', meaning: 'time', highlight: 'c' },
    ],
    confusedWith: ['ć', 's'],
  },
  {
    id: 'ć',
    upper: 'Ć', lower: 'ć', polishName: 'cie', ipa: '/t͡ɕ/',
    englishApprox: 'ch as in "cheese" (softer, hissing)',
    englishLabel: 'ch (cheese, soft)',
    englishAlternates: ['ch', 'tch', 'cheese', 'ch soft'],
    category: 'consonant',
    tips: ['Softer than cz — tongue middle raised.', 'Alveolo-palatal sound.'],
    examples: [
      { word: 'ćma', meaning: 'moth', highlight: 'ć' },
      { word: 'leć', meaning: 'fly!', highlight: 'ć' },
      { word: 'ćwiczyć', meaning: 'to practice', highlight: 'ć' },
    ],
    confusedWith: ['c', 'cz'],
  },
  {
    id: 'd',
    upper: 'D', lower: 'd', polishName: 'de', ipa: '/d̪/',
    englishApprox: 'd as in "dog"',
    englishLabel: 'd (dog)',
    englishAlternates: ['d', 'dog'],
    category: 'consonant',
    tips: ['Devoiced to t at word end.'],
    examples: [
      { word: 'dom', meaning: 'house', highlight: 'd' },
      { word: 'dzień', meaning: 'day', highlight: 'd' },
      { word: 'dwa', meaning: 'two', highlight: 'd' },
    ],
  },
  {
    id: 'e',
    upper: 'E', lower: 'e', polishName: 'e', ipa: '/ɛ/',
    englishApprox: 'eh as in "bed"',
    englishLabel: 'eh (bed)',
    englishAlternates: ['eh', 'e', 'bed'],
    category: 'vowel',
    tips: ['Open-mid front vowel — like "e" in "bed".', 'Not the same as Polish y!'],
    examples: [
      { word: 'ten', meaning: 'this', highlight: 'e' },
      { word: 'lewy', meaning: 'left', highlight: 'e' },
      { word: 'ser', meaning: 'cheese', highlight: 'e' },
    ],
    confusedWith: ['y', 'ę'],
  },
  {
    id: 'ę',
    upper: 'Ę', lower: 'ę', polishName: 'ę', ipa: '/ɛw̃/',
    englishApprox: 'en (nasal) — like "end" through the nose',
    englishLabel: 'en (nasal)',
    englishAlternates: ['en', 'em', 'nasal e', 'end'],
    category: 'vowel',
    tips: ['Nasal version of e.', 'Word-finally often pronounced as plain e.'],
    examples: [
      { word: 'gęś', meaning: 'goose', highlight: 'ę' },
      { word: 'język', meaning: 'language/tongue', highlight: 'ę' },
      { word: 'imię', meaning: 'name', highlight: 'ę' },
    ],
    confusedWith: ['ą', 'e'],
  },
  {
    id: 'f',
    upper: 'F', lower: 'f', polishName: 'ef', ipa: '/f/',
    englishApprox: 'f as in "fish"',
    englishLabel: 'f (fish)',
    englishAlternates: ['f', 'fish'],
    category: 'consonant',
    tips: ['Less common in native words; often in loanwords.'],
    examples: [
      { word: 'foka', meaning: 'seal (animal)', highlight: 'f' },
      { word: 'fotel', meaning: 'armchair', highlight: 'f' },
      { word: 'film', meaning: 'film', highlight: 'f' },
    ],
  },
  {
    id: 'g',
    upper: 'G', lower: 'g', polishName: 'gie', ipa: '/ɡ/',
    englishApprox: 'g as in "go" (always hard)',
    englishLabel: 'g (go)',
    englishAlternates: ['g', 'go', 'hard g'],
    category: 'consonant',
    tips: ['Always hard — never "j" sound like English "giraffe".'],
    examples: [
      { word: 'góra', meaning: 'mountain', highlight: 'g' },
      { word: 'grać', meaning: 'to play', highlight: 'g' },
      { word: 'głos', meaning: 'voice', highlight: 'g' },
    ],
  },
  {
    id: 'h',
    upper: 'H', lower: 'h', polishName: 'ha', ipa: '/x/',
    englishApprox: 'ch as in Scottish "loch"',
    englishLabel: 'ch (loch)',
    englishAlternates: ['ch', 'kh', 'loch', 'h'],
    category: 'consonant',
    tips: ['Same sound as Polish ch.', 'A throaty h — not English "h" in "hello".'],
    examples: [
      { word: 'herbata', meaning: 'tea', highlight: 'h' },
      { word: 'hałas', meaning: 'noise', highlight: 'h' },
      { word: 'hokej', meaning: 'hockey', highlight: 'h' },
    ],
    confusedWith: ['ch'],
  },
  {
    id: 'i',
    upper: 'I', lower: 'i', polishName: 'i', ipa: '/i/',
    englishApprox: 'ee as in "feet"',
    englishLabel: 'ee (feet)',
    englishAlternates: ['ee', 'i', 'feet'],
    category: 'vowel',
    tips: ['Also softens preceding consonant before another vowel.', 'Completely different from Polish y!'],
    examples: [
      { word: 'idę', meaning: 'I go', highlight: 'i' },
      { word: 'piwo', meaning: 'beer', highlight: 'i' },
      { word: 'miło', meaning: 'nice', highlight: 'i' },
    ],
    confusedWith: ['y', 'j'],
  },
  {
    id: 'j',
    upper: 'J', lower: 'j', polishName: 'jot', ipa: '/j/',
    englishApprox: 'y as in "yes"',
    englishLabel: 'y (yes)',
    englishAlternates: ['y', 'yes', 'j'],
    category: 'consonant',
    tips: ['Like English "y" in "yes" — NOT like "j" in "jump".'],
    examples: [
      { word: 'ja', meaning: 'I', highlight: 'j' },
      { word: 'jeść', meaning: 'to eat', highlight: 'j' },
      { word: 'jutro', meaning: 'tomorrow', highlight: 'j' },
    ],
  },
  {
    id: 'k',
    upper: 'K', lower: 'k', polishName: 'ka', ipa: '/k/',
    englishApprox: 'k as in "king"',
    englishLabel: 'k (king)',
    englishAlternates: ['k', 'king'],
    category: 'consonant',
    tips: ['Always voiceless k sound.'],
    examples: [
      { word: 'kot', meaning: 'cat', highlight: 'k' },
      { word: 'kto', meaning: 'who', highlight: 'k' },
      { word: 'kawa', meaning: 'coffee', highlight: 'k' },
    ],
  },
  {
    id: 'l',
    upper: 'L', lower: 'l', polishName: 'el', ipa: '/l/',
    englishApprox: 'l as in "light"',
    englishLabel: 'l (light)',
    englishAlternates: ['l', 'light'],
    category: 'consonant',
    tips: ['Clear "light" L — not the English dark L.', 'Very different from ł!'],
    examples: [
      { word: 'lampa', meaning: 'lamp', highlight: 'l' },
      { word: 'las', meaning: 'forest', highlight: 'l' },
      { word: 'lód', meaning: 'ice', highlight: 'l' },
    ],
    confusedWith: ['ł'],
  },
  {
    id: 'ł',
    upper: 'Ł', lower: 'ł', polishName: 'eł', ipa: '/w/',
    englishApprox: 'w as in "will"',
    englishLabel: 'w (will)',
    englishAlternates: ['w', 'will', 'oo'],
    category: 'consonant',
    tips: ['THE most confusing letter for English speakers!', 'Ł sounds like English W, not L.'],
    examples: [
      { word: 'ładny', meaning: 'pretty', highlight: 'ł' },
      { word: 'głowa', meaning: 'head', highlight: 'ł' },
      { word: 'był', meaning: 'was', highlight: 'ł' },
    ],
    confusedWith: ['l', 'w'],
  },
  {
    id: 'm',
    upper: 'M', lower: 'm', polishName: 'em', ipa: '/m/',
    englishApprox: 'm as in "man"',
    englishLabel: 'm (man)',
    englishAlternates: ['m', 'man'],
    category: 'consonant',
    tips: ['Straightforward — same as English.'],
    examples: [
      { word: 'mama', meaning: 'mom', highlight: 'm' },
      { word: 'morze', meaning: 'sea', highlight: 'm' },
      { word: 'miasto', meaning: 'city', highlight: 'm' },
    ],
  },
  {
    id: 'n',
    upper: 'N', lower: 'n', polishName: 'en', ipa: '/n̪/',
    englishApprox: 'n as in "no"',
    englishLabel: 'n (no)',
    englishAlternates: ['n', 'no'],
    category: 'consonant',
    tips: ['Plain n — different from ń (soft).'],
    examples: [
      { word: 'nie', meaning: 'no/not', highlight: 'n' },
      { word: 'noc', meaning: 'night', highlight: 'n' },
      { word: 'nowy', meaning: 'new', highlight: 'n' },
    ],
    confusedWith: ['ń'],
  },
  {
    id: 'ń',
    upper: 'Ń', lower: 'ń', polishName: 'eń', ipa: '/ɲ/',
    englishApprox: 'ny as in "canyon"',
    englishLabel: 'ny (canyon)',
    englishAlternates: ['ny', 'gn', 'canyon', 'ni'],
    category: 'consonant',
    tips: ['Soft n — like "ni" in "onion".', 'Also written as ni before vowels.'],
    examples: [
      { word: 'koń', meaning: 'horse', highlight: 'ń' },
      { word: 'państwo', meaning: 'state/country', highlight: 'ń' },
      { word: 'głośni', meaning: 'loud (masc. pl.)', highlight: 'ń' },
    ],
    confusedWith: ['n'],
  },
  {
    id: 'o',
    upper: 'O', lower: 'o', polishName: 'o', ipa: '/ɔ/',
    englishApprox: 'aw as in "caught"',
    englishLabel: 'aw (caught)',
    englishAlternates: ['aw', 'o', 'caught'],
    category: 'vowel',
    tips: ['Open o — like "aw" without strong rounding.'],
    examples: [
      { word: 'oko', meaning: 'eye', highlight: 'o' },
      { word: 'rok', meaning: 'year', highlight: 'o' },
      { word: 'morze', meaning: 'sea', highlight: 'o' },
    ],
    confusedWith: ['ó', 'u'],
  },
  {
    id: 'ó',
    upper: 'Ó', lower: 'ó', polishName: 'o kreskowane', ipa: '/u/',
    englishApprox: 'oo as in "boot"',
    englishLabel: 'oo (boot)',
    englishAlternates: ['oo', 'u', 'boot'],
    category: 'vowel',
    tips: ['Same sound as u — only spelling differs.', 'Used after consonants; u after vowels and word-initially.'],
    examples: [
      { word: 'bóg', meaning: 'god', highlight: 'ó' },
      { word: 'góra', meaning: 'mountain', highlight: 'ó' },
      { word: 'król', meaning: 'king', highlight: 'ó' },
    ],
    confusedWith: ['u', 'o'],
  },
  {
    id: 'p',
    upper: 'P', lower: 'p', polishName: 'pe', ipa: '/p/',
    englishApprox: 'p as in "spot"',
    englishLabel: 'p (spot)',
    englishAlternates: ['p', 'spot'],
    category: 'consonant',
    tips: ['Unaspirated like most Polish consonants.'],
    examples: [
      { word: 'pies', meaning: 'dog', highlight: 'p' },
      { word: 'praca', meaning: 'work', highlight: 'p' },
      { word: 'piwo', meaning: 'beer', highlight: 'p' },
    ],
  },
  {
    id: 'r',
    upper: 'R', lower: 'r', polishName: 'er', ipa: '/r/',
    englishApprox: 'r — tapped/rolled',
    englishLabel: 'r (rolled)',
    englishAlternates: ['r', 'rr', 'rolled'],
    category: 'consonant',
    tips: ['Alveolar tap or trill — not the English approximant.', 'Like the "tt" in American "butter".'],
    examples: [
      { word: 'ręka', meaning: 'hand', highlight: 'r' },
      { word: 'rok', meaning: 'year', highlight: 'r' },
      { word: 'rzeka', meaning: 'river', highlight: 'r' },
    ],
  },
  {
    id: 's',
    upper: 'S', lower: 's', polishName: 'es', ipa: '/s̪/',
    englishApprox: 's as in "sea"',
    englishLabel: 's (sea)',
    englishAlternates: ['s', 'sea'],
    category: 'consonant',
    tips: ['Plain s — softer than English in some positions.'],
    examples: [
      { word: 'smak', meaning: 'taste', highlight: 's' },
      { word: 'słońce', meaning: 'sun', highlight: 's' },
      { word: 'syn', meaning: 'son', highlight: 's' },
    ],
    confusedWith: ['ś', 'z'],
  },
  {
    id: 'ś',
    upper: 'Ś', lower: 'ś', polishName: 'eś', ipa: '/ɕ/',
    englishApprox: 'sh as in "she" (softer)',
    englishLabel: 'sh (she, soft)',
    englishAlternates: ['sh', 'sh soft', 'she'],
    category: 'consonant',
    tips: ['Softer than sz — middle of tongue raised.', 'Alveolo-palatal sh.'],
    examples: [
      { word: 'świat', meaning: 'world', highlight: 'ś' },
      { word: 'śnieg', meaning: 'snow', highlight: 'ś' },
      { word: 'głośny', meaning: 'loud', highlight: 'ś' },
    ],
    confusedWith: ['s', 'sz'],
  },
  {
    id: 't',
    upper: 'T', lower: 't', polishName: 'te', ipa: '/t̪/',
    englishApprox: 't as in "stop"',
    englishLabel: 't (stop)',
    englishAlternates: ['t', 'stop'],
    category: 'consonant',
    tips: ['Less aspirated than English t.'],
    examples: [
      { word: 'tak', meaning: 'yes', highlight: 't' },
      { word: 'ten', meaning: 'this', highlight: 't' },
      { word: 'ty', meaning: 'you', highlight: 't' },
    ],
  },
  {
    id: 'u',
    upper: 'U', lower: 'u', polishName: 'u', ipa: '/u/',
    englishApprox: 'oo as in "boot"',
    englishLabel: 'oo (boot)',
    englishAlternates: ['oo', 'u', 'boot'],
    category: 'vowel',
    tips: ['Same sound as ó.', 'Used after vowels and at word start.'],
    examples: [
      { word: 'ulica', meaning: 'street', highlight: 'u' },
      { word: 'duży', meaning: 'big', highlight: 'u' },
      { word: 'tu', meaning: 'here', highlight: 'u' },
    ],
    confusedWith: ['ó', 'w'],
  },
  {
    id: 'w',
    upper: 'W', lower: 'w', polishName: 'wu', ipa: '/v/',
    englishApprox: 'v as in "vow"',
    englishLabel: 'v (vow)',
    englishAlternates: ['v', 'vow'],
    category: 'consonant',
    tips: ['CRITICAL: Polish w = English v sound!', 'Nothing like English "w" in "water".'],
    examples: [
      { word: 'woda', meaning: 'water', highlight: 'w' },
      { word: 'wielki', meaning: 'big/great', highlight: 'w' },
      { word: 'wczoraj', meaning: 'yesterday', highlight: 'w' },
    ],
    confusedWith: ['ł'],
  },
  {
    id: 'y',
    upper: 'Y', lower: 'y', polishName: 'igrek', ipa: '/ɨ/',
    englishApprox: 'i as in "bit" or "roses"',
    englishLabel: 'i (bit)',
    englishAlternates: ['ih', 'i short', 'bit', 'roses'],
    category: 'vowel',
    tips: ['Central vowel — no exact English equivalent.', 'NOT the same as Polish i (feet)!'],
    examples: [
      { word: 'my', meaning: 'we', highlight: 'y' },
      { word: 'być', meaning: 'to be', highlight: 'y' },
      { word: 'dym', meaning: 'smoke', highlight: 'y' },
    ],
    confusedWith: ['i', 'e'],
  },
  {
    id: 'z',
    upper: 'Z', lower: 'z', polishName: 'zet', ipa: '/z̪/',
    englishApprox: 'z as in "zoo"',
    englishLabel: 'z (zoo)',
    englishAlternates: ['z', 'zoo'],
    category: 'consonant',
    tips: ['Most common consonant in Polish texts.'],
    examples: [
      { word: 'zima', meaning: 'winter', highlight: 'z' },
      { word: 'za', meaning: 'behind/for', highlight: 'z' },
      { word: 'zamek', meaning: 'castle', highlight: 'z' },
    ],
    confusedWith: ['ź', 'ż'],
  },
  {
    id: 'ź',
    upper: 'Ź', lower: 'ź', polishName: 'ziet', ipa: '/ʑ/',
    englishApprox: 'zh as in "vision" (softer)',
    englishLabel: 'zh (vision, soft)',
    englishAlternates: ['zh', 'zh soft', 'vision', 'si'],
    category: 'consonant',
    tips: ['Softer than ż — alveolo-palatal.', 'Also written as zi before vowels.'],
    examples: [
      { word: 'źle', meaning: 'badly', highlight: 'ź' },
      { word: 'źródło', meaning: 'source/spring', highlight: 'ź' },
      { word: 'luźny', meaning: 'loose', highlight: 'ź' },
    ],
    confusedWith: ['z', 'ż'],
  },
  {
    id: 'ż',
    upper: 'Ż', lower: 'ż', polishName: 'żet', ipa: '/ʐ/',
    englishApprox: 'zh as in "measure"',
    englishLabel: 'zh (measure)',
    englishAlternates: ['zh', 'measure', 'si'],
    category: 'consonant',
    tips: ['Harder than ź — retroflex.', 'Same sound as rz digraph.'],
    examples: [
      { word: 'żaba', meaning: 'frog', highlight: 'ż' },
      { word: 'może', meaning: 'maybe', highlight: 'ż' },
      { word: 'żółty', meaning: 'yellow', highlight: 'ż' },
    ],
    confusedWith: ['ź', 'z'],
  },
]

export const LETTER_MAP = new Map(POLISH_ALPHABET.map((l) => [l.id, l]))

export const GENERAL_ALPHABET_LESSON = {
  id: 'general',
  title: 'The Polish Alphabet',
  sections: [
    {
      heading: 'Overview',
      body: 'Polish uses 32 letters based on the Latin alphabet, with 9 special diacritic letters: ą, ć, ę, ł, ń, ó, ś, ź, ż. Unlike English, letters usually sound the same everywhere in a word.',
    },
    {
      heading: 'Vowels (9)',
      body: 'a, e, i, o, u, y, ą, ę, ó — Polish has two nasal vowels (ą, ę) and a unique central vowel y (/ɨ/) that is NOT the same as i.',
    },
    {
      heading: 'The big traps for English speakers',
      body: 'ł sounds like English W (will), w sounds like English V (vow), c sounds like TS (cats), and y is a vowel like "i" in "bit" — completely different from Polish i (feet).',
    },
    {
      heading: 'Soft vs hard sounds',
      body: 'Polish distinguishes softer (ć, ś, ź, ń) from harder sounds (cz, sz, ż). The soft sounds have the middle of the tongue raised — almost an "ee" color.',
    },
    {
      heading: 'ó and u',
      body: 'These two letters represent the exact same sound (/u/ like "boot"). ó appears after consonants; u appears after vowels and at the start of words.',
    },
    {
      heading: 'How to use this module',
      body: 'Study each letter\'s mini-lesson, then practice with the exercise stream. Open lessons anytime during practice. Toggle exercise formats in Settings to focus on your weak spots.',
    },
  ],
}

export function getLetter(id: string): PolishLetter | undefined {
  return LETTER_MAP.get(id)
}

export function getAllLetterIds(): string[] {
  return POLISH_ALPHABET.map((l) => l.id)
}

export function getDistractorLabels(correct: PolishLetter, count: number): string[] {
  const others = POLISH_ALPHABET.filter((l) => l.id !== correct.id)
  const shuffled = [...others].sort(() => Math.random() - 0.5)
  const labels = shuffled.slice(0, count).map((l) => l.englishLabel)
  return labels
}

export function getDistractorLetters(correct: PolishLetter, count: number): PolishLetter[] {
  const pool = correct.confusedWith
    ? correct.confusedWith.map((id) => LETTER_MAP.get(id)!).filter(Boolean)
    : []
  const others = POLISH_ALPHABET.filter(
    (l) => l.id !== correct.id && !pool.some((p) => p.id === l.id),
  )
  const combined = [...pool, ...others.sort(() => Math.random() - 0.5)]
  return combined.slice(0, count)
}
