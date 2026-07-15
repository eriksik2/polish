import { tokenizeGraphemes } from '../lib/graphemes'
import type { WordEntry } from './wordBank'
import { wordIdFromWord } from './wordBank'

export type BasicWordTag =
  | 'greeting'
  | 'farewell'
  | 'politeness'
  | 'response'
  | 'number'
  | 'question'
  | 'family'
  | 'time'
  | 'common'

export interface BasicWord {
  id: string
  word: string
  meaning: string
  tags: BasicWordTag[]
  tip?: string
}

function bw(word: string, meaning: string, tags: BasicWordTag[], tip?: string): BasicWord {
  return { id: wordIdFromWord(word), word, meaning, tags, tip }
}

/** Curated basic vocabulary for the basic-words module */
export const BASIC_WORDS: BasicWord[] = [
  // — Greetings & farewells —
  bw('cześć', 'hi / bye (informal)', ['greeting', 'farewell'], 'Used with friends — like “hi” and “bye”.'),
  bw('hej', 'hey', ['greeting'], 'Very casual, like English “hey”.'),
  bw('witam', 'welcome / I welcome you', ['greeting'], 'Host greeting guests; also “I greet you”.'),
  bw('dzień dobry', 'good morning / good day', ['greeting'], 'Polite default until evening.'),
  bw('dobry wieczór', 'good evening', ['greeting'], 'From late afternoon onward.'),
  bw('dobranoc', 'good night', ['greeting', 'farewell'], 'Said when leaving at night or before sleep.'),
  bw('do widzenia', 'goodbye (formal)', ['farewell'], 'Literally “until seeing”.'),
  bw('do zobaczenia', 'see you later', ['farewell']),
  bw('pa', 'bye (informal)', ['farewell'], 'Short and casual.'),
  bw('cześć ponownie', 'hello again', ['greeting'], 'When you meet someone again the same day.'),
  bw('miło cię poznać', 'nice to meet you', ['greeting', 'politeness']),
  bw('jak się masz?', 'how are you?', ['greeting', 'question']),
  bw('jak się pan ma?', 'how are you? (formal, to a man)', ['greeting', 'question']),
  bw('jak się pani ma?', 'how are you? (formal, to a woman)', ['greeting', 'question']),
  bw('co słychać?', "what's up? / how are things?", ['greeting', 'question'], 'Literally “what can be heard?”.'),
  bw('wszystko w porządku?', 'is everything OK?', ['greeting', 'question']),

  // — Politeness & responses —
  bw('dziękuję', 'thank you', ['politeness']),
  bw('dzięki', 'thanks (informal)', ['politeness']),
  bw('bardzo dziękuję', 'thank you very much', ['politeness']),
  bw('proszę', 'please / here you are / you\'re welcome', ['politeness'], 'Context decides the meaning.'),
  bw('przepraszam', 'excuse me / sorry', ['politeness']),
  bw('nie ma za co', "you're welcome / don't mention it", ['politeness', 'response']),
  bw('tak', 'yes', ['response', 'common']),
  bw('nie', 'no / not', ['response', 'common']),
  bw('może', 'maybe / perhaps', ['response']),
  bw('oczywiście', 'of course', ['response']),
  bw('dobrze', 'fine / well / OK', ['response']),
  bw('świetnie', 'great / excellent', ['response']),
  bw('w porządku', 'all right / fine', ['response']),
  bw('rozumiem', 'I understand', ['response']),
  bw('nie rozumiem', "I don't understand", ['response']),
  bw('mówisz po angielsku?', 'do you speak English?', ['question']),
  bw('mówię po polsku', 'I speak Polish', ['response']),

  // — Numbers 0–20 —
  bw('zero', 'zero', ['number']),
  bw('jeden', 'one', ['number']),
  bw('dwa', 'two', ['number']),
  bw('trzy', 'three', ['number']),
  bw('cztery', 'four', ['number']),
  bw('pięć', 'five', ['number']),
  bw('sześć', 'six', ['number']),
  bw('siedem', 'seven', ['number']),
  bw('osiem', 'eight', ['number']),
  bw('dziewięć', 'nine', ['number']),
  bw('dziesięć', 'ten', ['number']),
  bw('jedenaście', 'eleven', ['number']),
  bw('dwanaście', 'twelve', ['number']),
  bw('trzynaście', 'thirteen', ['number']),
  bw('czternaście', 'fourteen', ['number']),
  bw('piętnaście', 'fifteen', ['number']),
  bw('szesnaście', 'sixteen', ['number']),
  bw('siedemnaście', 'seventeen', ['number']),
  bw('osiemnaście', 'eighteen', ['number']),
  bw('dziewiętnaście', 'nineteen', ['number']),
  bw('dwadzieścia', 'twenty', ['number']),

  // — Number phrases —
  bw('ile?', 'how many?', ['number', 'question']),
  bw('ile to kosztuje?', 'how much does it cost?', ['number', 'question']),
  bw('numer', 'number', ['number']),
  bw('pierwszy', 'first', ['number']),
  bw('drugi', 'second', ['number']),
  bw('trzeci', 'third', ['number']),

  // — Extra common words (module bank) —
  bw('mama', 'mum / mom', ['family', 'common']),
  bw('tata', 'dad', ['family', 'common']),
  bw('syn', 'son', ['family', 'common']),
  bw('córka', 'daughter', ['family', 'common']),
  bw('dom', 'house / home', ['common']),
  bw('woda', 'water', ['common']),
  bw('tak jest', 'that\'s right / yes it is', ['response']),
  bw('dzisiaj', 'today', ['time', 'common']),
  bw('jutro', 'tomorrow', ['time', 'common']),
  bw('wczoraj', 'yesterday', ['time', 'common']),
  bw('teraz', 'now', ['time', 'common']),
  bw('rano', 'morning', ['time']),
  bw('wieczór', 'evening', ['time']),
  bw('dzień', 'day', ['time', 'common']),
]

export const BASIC_WORD_MAP = new Map(BASIC_WORDS.map((w) => [w.id, w]))

export function getBasicWord(id: string): BasicWord | undefined {
  return BASIC_WORD_MAP.get(id)
}

export function getBasicWordsByTag(tag: BasicWordTag): BasicWord[] {
  return BASIC_WORDS.filter((w) => w.tags.includes(tag))
}

export function basicWordToEntry(word: BasicWord): WordEntry {
  return {
    id: word.id,
    word: word.word,
    meaning: word.meaning,
    graphemes: tokenizeGraphemes(word.word),
    unitLinks: [],
    modules: ['basic-words'],
  }
}

export const BASIC_WORD_ENTRIES: WordEntry[] = BASIC_WORDS.map(basicWordToEntry)

export const GENERAL_BASIC_WORDS_LESSON = {
  id: 'basic-words-overview',
  title: 'Basic Polish Words',
  sections: [
    {
      heading: 'Everyday vocabulary',
      body: 'This module collects high-frequency words for greetings, numbers, politeness, and daily life. Use structured lessons for guided study, or browse the full word list here.',
    },
    {
      heading: 'Tips',
      body: 'Tap any word to hear it. Native recordings play full words; words marked “Letter sounds” spell out using alphabet and digraph clips until a native recording is added.',
    },
  ],
}
