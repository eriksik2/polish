import type { CaseFormEntry, CaseUsageRule, VocabEntry, VocabTag } from './types'

export type { VocabEntry, VocabTag }

export function wordIdFromSurface(surface: string): string {
  return surface
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
}

function w(
  surface: string,
  meaning: string,
  tags: VocabEntry['tags'],
  tip?: string,
  id?: string,
): VocabEntry {
  return {
    id: id ?? wordIdFromSurface(surface),
    surface,
    meaning,
    kind: 'word',
    tags,
    tip,
  }
}

function phrase(
  surface: string,
  meaning: string,
  wordIds: string[],
  tags: VocabEntry['tags'],
  tip?: string,
): VocabEntry {
  return {
    id: wordIdFromSurface(surface),
    surface,
    meaning,
    kind: 'phrase',
    wordIds,
    tags,
    tip,
  }
}

/** Canonical vocabulary — single source of truth for word & phrase meanings */
export const VOCABULARY: VocabEntry[] = [
  // — Greetings & farewells —
  w('cześć', 'hi / bye (informal)', ['greeting', 'farewell'], 'Used with friends — like “hi” and “bye”.'),
  w('hej', 'hey', ['greeting'], 'Very casual, like English “hey”.'),
  w('witam', 'welcome / I welcome you', ['greeting'], 'Host greeting guests; also “I greet you”.'),
  w('dzień', 'day', ['time', 'common']),
  w('dobry', 'good', ['common']),
  phrase('dzień dobry', 'good morning / good day', ['dzien', 'dobry'], ['greeting'], 'Polite default until evening.'),
  w('wieczór', 'evening', ['time']),
  phrase('dobry wieczór', 'good evening', ['dobry', 'wieczor'], ['greeting'], 'From late afternoon onward.'),
  w('dobranoc', 'good night', ['greeting', 'farewell'], 'Said when leaving at night or before sleep.'),
  phrase('do widzenia', 'goodbye (formal)', ['do', 'widzenia'], ['farewell'], 'Literally “until seeing”.'),
  w('widzenia', 'seeing (verbal noun)', ['common']),
  w('do', 'to / until', ['common']),
  phrase('do zobaczenia', 'see you later', ['do', 'zobaczenia'], ['farewell']),
  w('zobaczenia', 'seeing (verbal noun)', ['common']),
  w('pa', 'bye (informal)', ['farewell'], 'Short and casual.'),
  phrase('cześć ponownie', 'hello again', ['czesc', 'ponownie'], ['greeting'], 'When you meet someone again the same day.'),
  w('ponownie', 'again', ['common']),
  phrase('miło cię poznać', 'nice to meet you', ['milo', 'cie', 'poznac'], ['greeting', 'politeness']),
  w('miło', 'nice / pleasantly', ['politeness']),
  w('cię', 'you (accusative, informal)', ['common']),
  w('poznać', 'to meet / get to know', ['common']),
  phrase('jak się masz?', 'how are you?', ['jak', 'sie', 'masz'], ['greeting', 'question']),
  w('jak', 'how', ['question']),
  w('się', 'oneself (reflexive particle)', ['common']),
  w('masz', 'you have (2nd person)', ['common']),
  phrase('jak się pan ma?', 'how are you? (formal, to a man)', ['jak', 'sie', 'pan', 'ma'], ['greeting', 'question']),
  w('pan', 'Mr / sir (formal you, masculine)', ['politeness']),
  w('ma', 'he/she has / (formal) you have', ['common']),
  phrase('jak się pani ma?', 'how are you? (formal, to a woman)', ['jak', 'sie', 'pani', 'ma'], ['greeting', 'question']),
  w('pani', 'Mrs / madam (formal you, feminine)', ['politeness']),
  phrase('co słychać?', "what's up? / how are things?", ['co', 'slychac'], ['greeting', 'question'], 'Literally “what can be heard?”.'),
  w('słychać', 'to be heard', ['common']),
  phrase('wszystko w porządku?', 'is everything OK?', ['wszystko', 'w-prep', 'porzadku'], ['greeting', 'question']),
  w('wszystko', 'everything', ['common']),
  w('w', 'in / at', ['common'], undefined, 'w-prep'),
  w('porządku', 'order (locative of porządek)', ['common']),

  // — Politeness & responses —
  w('dziękuję', 'thank you', ['politeness']),
  w('dzięki', 'thanks (informal)', ['politeness']),
  phrase('bardzo dziękuję', 'thank you very much', ['bardzo', 'dziekuje'], ['politeness']),
  w('bardzo', 'very / very much', ['common']),
  w('proszę', 'please / here you are / you\'re welcome', ['politeness'], 'Context decides the meaning.'),
  w('przepraszam', 'excuse me / sorry', ['politeness']),
  phrase('nie ma za co', "you're welcome / don't mention it", ['nie', 'ma', 'za', 'co'], ['politeness', 'response']),
  w('za', 'for / behind', ['common']),
  w('tak', 'yes', ['response', 'common']),
  w('nie', 'no / not', ['response', 'common']),
  w('może', 'maybe / perhaps', ['response']),
  w('oczywiście', 'of course', ['response']),
  w('dobrze', 'fine / well / OK', ['response']),
  w('świetnie', 'great / excellent', ['response']),
  phrase('w porządku', 'all right / fine', ['w-prep', 'porzadku'], ['response']),
  w('rozumiem', 'I understand', ['response']),
  phrase('nie rozumiem', "I don't understand", ['nie', 'rozumiem'], ['response']),
  phrase('mówisz po angielsku?', 'do you speak English?', ['mowisz', 'po', 'angielsku'], ['question']),
  w('mówisz', 'you speak', ['common']),
  w('po', 'in (language) / after', ['common']),
  w('angielsku', 'English (language)', ['common']),
  phrase('mówię po polsku', 'I speak Polish', ['mowie', 'po', 'polsku'], ['response']),
  w('mówię', 'I speak', ['common']),
  w('polsku', 'Polish (language)', ['common']),

  // — Numbers 0–20 —
  w('zero', 'zero', ['number']),
  w('jeden', 'one', ['number']),
  w('dwa', 'two', ['number']),
  w('trzy', 'three', ['number']),
  w('cztery', 'four', ['number']),
  w('pięć', 'five', ['number']),
  w('sześć', 'six', ['number']),
  w('siedem', 'seven', ['number']),
  w('osiem', 'eight', ['number']),
  w('dziewięć', 'nine', ['number']),
  w('dziesięć', 'ten', ['number']),
  w('jedenaście', 'eleven', ['number']),
  w('dwanaście', 'twelve', ['number']),
  w('trzynaście', 'thirteen', ['number']),
  w('czternaście', 'fourteen', ['number']),
  w('piętnaście', 'fifteen', ['number']),
  w('szesnaście', 'sixteen', ['number']),
  w('siedemnaście', 'seventeen', ['number']),
  w('osiemnaście', 'eighteen', ['number']),
  w('dziewiętnaście', 'nineteen', ['number']),
  w('dwadzieścia', 'twenty', ['number']),

  // — Number phrases —
  w('ile?', 'how many?', ['number', 'question']),
  phrase('ile to kosztuje?', 'how much does it cost?', ['ile', 'to', 'kosztuje'], ['number', 'question']),
  w('ile', 'how many / how much', ['number', 'question']),
  w('to', 'this / it', ['common']),
  w('kosztuje', 'costs', ['common']),
  w('numer', 'number', ['number']),
  w('pierwszy', 'first', ['number']),
  w('drugi', 'second', ['number']),
  w('trzeci', 'third', ['number']),

  // — Extra common words —
  w('mama', 'mum / mom', ['family', 'common']),
  w('tata', 'dad', ['family', 'common']),
  w('syn', 'son', ['family', 'common']),
  w('córka', 'daughter', ['family', 'common']),
  w('dom', 'house / home', ['common']),
  w('woda', 'water', ['common']),
  phrase('tak jest', "that's right / yes it is", ['tak', 'jest'], ['response']),
  w('jest', 'is / there is', ['common']),
  w('dzisiaj', 'today', ['time', 'common']),
  w('jutro', 'tomorrow', ['time', 'common']),
  w('wczoraj', 'yesterday', ['time', 'common']),
  w('teraz', 'now', ['time', 'common']),
  w('rano', 'morning', ['time']),
]

export const VOCABULARY_MAP = new Map(VOCABULARY.map((v) => [v.id, v]))

/** General rules for when Polish cases are used */
export const CASE_USAGE_RULES: CaseUsageRule[] = [
  {
    case: 'nominative',
    summary: 'Subject of the sentence — who or what does the action.',
    polishExamples: ['Kot śpi.', 'Mama pracuje.'],
  },
  {
    case: 'genitive',
    summary: 'Possession (of X), negation (nie ma X), and after many prepositions.',
    polishExamples: ['dom mamy', 'nie ma wody', 'bez problemu'],
  },
  {
    case: 'dative',
    summary: 'Indirect object — to/for someone; also with certain verbs (pomóc, dziękować).',
    polishExamples: ['Daję mamie kwiaty.', 'Dziękuję panu.'],
  },
  {
    case: 'accusative',
    summary: 'Direct object of a verb — what is seen, eaten, bought, etc.',
    polishExamples: ['Widzę kota.', 'Piję wodę.', 'Mam dom.'],
  },
  {
    case: 'instrumental',
    summary: 'With “by means of”, after “być” for professions/roles, and some prepositions.',
    polishExamples: ['Jadę autem.', 'Jestem studentem.'],
  },
  {
    case: 'locative',
    summary: 'Only after prepositions — location, topic, or time (w, na, o, przy…).',
    polishExamples: ['w domu', 'o pracy', 'na stole'],
  },
  {
    case: 'vocative',
    summary: 'Direct address — calling someone by name or title.',
    polishExamples: ['Cześć, Anno!', 'Panie profesorze!'],
  },
]

/** Inflected forms linked to vocabulary lemmas */
export const CASE_FORMS: CaseFormEntry[] = [
  {
    id: wordIdFromSurface('domu'),
    surface: 'domu',
    meaning: 'house / home (genitive or locative)',
    lemmaId: 'dom',
    case: 'genitive',
    number: 'singular',
    gender: 'masculine',
    usageNote: 'Genitive: “brak domu” (no house). Locative after w/na: “w domu” (at home).',
  },
  {
    id: wordIdFromSurface('domem'),
    surface: 'domem',
    meaning: 'house / home (instrumental)',
    lemmaId: 'dom',
    case: 'instrumental',
    number: 'singular',
    gender: 'masculine',
    usageNote: 'Instrumental after być or “by means of”: rzadko z “domem”, częściej przy opisie.',
  },
  {
    id: wordIdFromSurface('mamę'),
    surface: 'mamę',
    meaning: 'mum / mom (accusative)',
    lemmaId: 'mama',
    case: 'accusative',
    number: 'singular',
    gender: 'feminine',
    usageNote: 'Direct object: “Kocham mamę.” (I love mum.)',
  },
  {
    id: wordIdFromSurface('mamy'),
    surface: 'mamy',
    meaning: 'mum’s / of mum (genitive)',
    lemmaId: 'mama',
    case: 'genitive',
    number: 'singular',
    gender: 'feminine',
    usageNote: 'Possession: “dom mamy” (mum’s house).',
  },
  {
    id: wordIdFromSurface('wodę'),
    surface: 'wodę',
    meaning: 'water (accusative)',
    lemmaId: 'woda',
    case: 'accusative',
    number: 'singular',
    gender: 'feminine',
    usageNote: 'Direct object: “Piję wodę.” (I drink water.)',
  },
  {
    id: wordIdFromSurface('wody'),
    surface: 'wody',
    meaning: 'water (genitive) / waters (plural nominative)',
    lemmaId: 'woda',
    case: 'genitive',
    number: 'singular',
    gender: 'feminine',
    usageNote: 'Partitive/negation: “nie ma wody” (there is no water).',
  },
  {
    id: wordIdFromSurface('dniu'),
    surface: 'dniu',
    meaning: 'day (locative)',
    lemmaId: 'dzien',
    case: 'locative',
    number: 'singular',
    gender: 'masculine',
    usageNote: 'After w/na: “w tym dniu” (on that day).',
  },
  {
    id: wordIdFromSurface('dobrego'),
    surface: 'dobrego',
    meaning: 'good (genitive masculine/neuter)',
    lemmaId: 'dobry',
    case: 'genitive',
    number: 'singular',
    gender: 'masculine',
    usageNote: 'Modifies masculine nouns: “dobrego dnia” (of a good day).',
  },
]

export const CASE_FORMS_MAP = new Map(CASE_FORMS.map((c) => [c.id, c]))

export function getVocabEntry(id: string): VocabEntry | undefined {
  return VOCABULARY_MAP.get(id)
}

export function getCaseForm(id: string): CaseFormEntry | undefined {
  return CASE_FORMS_MAP.get(id)
}
