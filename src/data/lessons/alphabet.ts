import type { StructuredLesson } from '../../types/lesson'

export const ALPHABET_LESSON: StructuredLesson = {
  id: 'alphabet-fundamentals',
  moduleId: 'alphabet',
  title: 'Polish Alphabet Fundamentals',
  subtitle: 'Sounds, spelling, and the letters that trip up English speakers',
  estimatedMinutes: 45,
  sections: [
    {
      id: 'intro',
      title: 'Before we begin',
      kind: 'intro',
      blocks: [
        {
          type: 'heading',
          text: 'Why Polish spelling is worth learning properly',
        },
        {
          type: 'paragraph',
          text: 'Polish is largely phonetic: once you know what each letter usually sounds like, you can read new words aloud with confidence. The alphabet has 32 letters. Some look like English but sound different; others (ą, ę, ć, ś…) are uniquely Polish.',
        },
        {
          type: 'tip',
          text: 'Do not anglicise Polish letters. Ł is not “L”. Ó is not “O with a slash”. Learn each symbol as its own sound.',
        },
        {
          type: 'paragraph',
          text: 'This lesson moves in steps. Read each section calmly — there is no quiz after the introduction. Later sections end with a short practice to lock in what you just learned. The final quiz covers everything, without hints.',
        },
        {
          type: 'paragraph',
          text: 'Tap any 🔊 button to hear native pronunciation. Use headphones if you can.',
        },
      ],
    },
    {
      id: 'vowels',
      title: 'Vowels: the backbone of every word',
      kind: 'teach',
      blocks: [
        {
          type: 'paragraph',
          text: 'Polish has nine vowel letters. Five are “plain” (a, e, i, o, u) and four carry special marks or spellings (ą, ę, ó, y). Vowels can be short and clear — Polish does not lengthen them the way English sometimes does.',
        },
        { type: 'heading', text: 'Plain vowels' },
        {
          type: 'units',
          moduleId: 'alphabet',
          unitIds: ['a', 'e', 'i', 'o', 'u'],
          title: 'a · e · i · o · u',
        },
        { type: 'audio', moduleId: 'alphabet', unitId: 'a', label: 'Hear A' },
        { type: 'audio', moduleId: 'alphabet', unitId: 'o', label: 'Hear O' },
        {
          type: 'tip',
          text: 'Polish A is like “ah” in father. O is an open “aw” like in caught — not a tight English “oh”.',
        },
        { type: 'heading', text: 'Nasal vowels ą and ę' },
        {
          type: 'paragraph',
          text: 'Ą and ę are nasal vowels — air flows through your nose as well as your mouth. At the end of a word they are subtle; before a consonant they sound closer to “on” / “en” clusters.',
        },
        { type: 'units', moduleId: 'alphabet', unitIds: ['ą', 'ę'] },
        { type: 'audio', moduleId: 'alphabet', unitId: 'ą', label: 'Hear Ą' },
        { type: 'audio', moduleId: 'alphabet', unitId: 'ę', label: 'Hear Ę' },
        { type: 'heading', text: 'Ó and U — same sound, different rules' },
        {
          type: 'paragraph',
          text: 'Ó and u represent the same “oo” sound (as in boot). Use ó after consonants in native words; u appears after vowels and at the start of words.',
        },
        { type: 'units', moduleId: 'alphabet', unitIds: ['ó', 'u', 'y'] },
        { type: 'audio', moduleId: 'alphabet', unitId: 'ó', label: 'Hear Ó' },
        {
          type: 'tip',
          text: 'Y after consonants sounds like Polish i (“ee”). After another vowel it forms a diphthong — listen in words like maj.',
        },
      ],
      practice: {
        unitIds: ['a', 'ą', 'e', 'ę', 'i', 'o', 'ó', 'u', 'y'],
        formats: ['pick-english', 'hear-pick-letter', 'pick-audio'],
        exerciseCount: 9,
        timeLimitSec: 300,
        helpAllowed: true,
        passAccuracy: 70,
      },
    },
    {
      id: 'consonants-core',
      title: 'Core consonants',
      kind: 'teach',
      blocks: [
        {
          type: 'paragraph',
          text: 'Many Polish consonants resemble English, but most are less aspirated — the little puff of air after English “p” and “t” is softer in Polish.',
        },
        {
          type: 'units',
          moduleId: 'alphabet',
          unitIds: ['b', 'c', 'd', 'f', 'g', 'h', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'z'],
        },
        { type: 'audio', moduleId: 'alphabet', unitId: 'c', label: 'Hear C (ts)' },
        { type: 'audio', moduleId: 'alphabet', unitId: 'r', label: 'Hear R (tapped)' },
        {
          type: 'tip',
          text: 'Polish R is tapped or lightly rolled — closer to the “tt” in American “butter”, not the English approximant.',
        },
        {
          type: 'paragraph',
          text: 'C before e/i/y is always “ts” (cats), never “k”. That rule will matter again when we meet digraphs in the next course.',
        },
      ],
      practice: {
        unitIds: ['b', 'c', 'd', 'f', 'g', 'h', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'z'],
        formats: ['hear-pick-letter', 'pick-english', 'hear-type-letter'],
        exerciseCount: 12,
        timeLimitSec: 360,
        helpAllowed: true,
        passAccuracy: 70,
      },
    },
    {
      id: 'special-letters',
      title: 'Letters that confuse English speakers',
      kind: 'teach',
      blocks: [
        { type: 'heading', text: 'Ł — definitely not L' },
        {
          type: 'paragraph',
          text: 'Ł is a dark “w” sound, like the “w” in will. The word łódź (boat) starts with this sound. English speakers often misread it as L — train your eye to treat ł as its own letter.',
        },
        { type: 'units', moduleId: 'alphabet', unitIds: ['ł', 'w'] },
        { type: 'audio', moduleId: 'alphabet', unitId: 'ł', label: 'Hear Ł' },
        { type: 'audio', moduleId: 'alphabet', unitId: 'w', label: 'Hear W (v)' },
        {
          type: 'tip',
          text: 'Polish W is pronounced like English V. Woda (water) sounds like “voda”.',
        },
        { type: 'heading', text: 'Soft consonants: ć, ś, ź, ń' },
        {
          type: 'paragraph',
          text: 'These four letters are “soft” or palatalised — the middle of the tongue is raised toward the hard palate. They pair with harder cousins (cz, sz, ż, n) you will meet in the digraphs lesson.',
        },
        { type: 'units', moduleId: 'alphabet', unitIds: ['ć', 'ś', 'ź', 'ń', 'j'] },
        { type: 'audio', moduleId: 'alphabet', unitId: 'ć', label: 'Hear Ć' },
        { type: 'audio', moduleId: 'alphabet', unitId: 'ś', label: 'Hear Ś' },
        { type: 'audio', moduleId: 'alphabet', unitId: 'ń', label: 'Hear Ń' },
        {
          type: 'paragraph',
          text: 'Ż is the hard zh sound (vision). Do not confuse it with ź or rz (covered in digraphs).',
        },
        { type: 'units', moduleId: 'alphabet', unitIds: ['ż'] },
        { type: 'audio', moduleId: 'alphabet', unitId: 'ż', label: 'Hear Ż' },
      ],
      practice: {
        unitIds: ['ć', 'j', 'ł', 'ń', 'ś', 'w', 'ź', 'ż'],
        formats: ['pick-audio', 'hear-pick-letter', 'hear-word-pick-letter'],
        exerciseCount: 10,
        timeLimitSec: 360,
        helpAllowed: true,
        passAccuracy: 70,
      },
    },
    {
      id: 'recap',
      title: 'Putting it together',
      kind: 'recap',
      blocks: [
        {
          type: 'paragraph',
          text: 'You now have the full 32-letter map. Vowels carry word rhythm; consonants (especially ł, w, and the soft series) are where English habits mislead you most.',
        },
        {
          type: 'tip',
          text: 'When reading Polish, slice words into sounds letter by letter — but remember that ó, u, ch, rz, etc. may be one sound each. The digraphs course covers two-letter spellings.',
        },
        {
          type: 'paragraph',
          text: 'The final quiz draws from the whole alphabet. No info buttons, no peeking — trust your ear and what you have read. If you stumble, we will point you back to the sections that need another look.',
        },
      ],
    },
  ],
  finalQuiz: {
    unitIds: [
      'a', 'ą', 'b', 'c', 'ć', 'd', 'e', 'ę', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'ł',
      'm', 'n', 'ń', 'o', 'ó', 'p', 'r', 's', 'ś', 't', 'u', 'w', 'y', 'z', 'ź', 'ż',
    ],
    formats: ['hear-pick-letter', 'pick-english', 'hear-word-pick-letter'],
    exerciseCount: 16,
    timeLimitSec: 600,
    helpAllowed: false,
    passAccuracy: 75,
  },
}
