import type { StructuredLesson } from '../../types/lesson'
import { FINAL_QUIZ_SIZE, SECTION_QUIZ_SIZE } from '../../types/lesson'

const VOCAB_FORMATS = [
  'vocab-pick-meaning',
  'vocab-meaning-pick-word',
  'vocab-hear-pick-meaning',
  'vocab-hear-pick-word',
] as const

export const NUMBERS_LESSON: StructuredLesson = {
  id: 'numbers-basics',
  moduleId: 'basic-words',
  category: 'first-words',
  title: 'Numbers',
  subtitle: 'Count from zero to twenty and ask “how many?”',
  estimatedMinutes: 25,
  sections: [
    {
      id: 'intro',
      title: 'Numbers in daily Polish',
      kind: 'intro',
      blocks: [
        {
          type: 'heading',
          text: 'Why learn numbers early',
        },
        {
          type: 'paragraph',
          text: 'Numbers appear everywhere: prices, addresses, phone numbers, dates, and “how many?”. Polish number words have patterns that make eleven through nineteen easier once you know one through ten.',
        },
        {
          type: 'tip',
          text: 'Listen for stress: PIĘĆ (five) and DZIESIĘĆ (ten) are common in shops. Practise them until they feel automatic.',
        },
        {
          type: 'paragraph',
          text: 'Tap a word badge to hear it. Each section ends with a short quiz mixing number recognition and quick questions.',
        },
      ],
    },
    {
      id: 'zero-to-five',
      title: 'Zero to five',
      kind: 'teach',
      blocks: [
        {
          type: 'paragraph',
          text: 'Start with the foundation. Zero is used like English. One and two change form when counting objects (jeden dom but dwie kobiety) — for now learn the dictionary forms below.',
        },
        {
          type: 'words',
          wordIds: ['zero', 'jeden', 'dwa', 'trzy', 'cztery', 'piec'],
          title: '0 – 5',
        },
        {
          type: 'tip',
          text: 'Cztery (four) sounds like “CHEH-tery” — you already met this sound in the digraph cz.',
        },
      ],
      popQuestions: [
        {
          id: 'n05-two',
          prompt: 'The Polish word for “two” is…',
          options: ['Jeden', 'Dwa', 'Trzy', 'Zero'],
          correctIndex: 1,
        },
        {
          id: 'n05-five',
          prompt: 'Pięć means…',
          options: ['Four', 'Five', 'Six', 'Fifty'],
          correctIndex: 1,
        },
        {
          id: 'n05-zero',
          prompt: 'Zero is used in Polish much like in English.',
          options: ['True', 'False'],
          correctIndex: 0,
        },
        {
          id: 'n05-cztery',
          prompt: 'Cztery contains the cz digraph.',
          options: ['True', 'False'],
          correctIndex: 0,
        },
        {
          id: 'n05-one',
          prompt: 'Jeden means…',
          options: ['One', 'Ten', 'Eleven', 'First'],
          correctIndex: 0,
        },
      ],
      practice: {
        unitIds: [],
        wordIds: ['zero', 'jeden', 'dwa', 'trzy', 'cztery', 'piec'],
        formats: [...VOCAB_FORMATS],
        exerciseCount: SECTION_QUIZ_SIZE,
        timeLimitSec: 240,
        helpAllowed: true,
        passAccuracy: 70,
      },
    },
    {
      id: 'six-to-ten',
      title: 'Six to ten',
      kind: 'teach',
      blocks: [
        {
          type: 'paragraph',
          text: 'Six through nine are straightforward. Dziesięć (ten) is a anchor word — it appears inside jedenaście, dwanaście, and so on.',
        },
        {
          type: 'words',
          wordIds: ['szesc', 'siedem', 'osiem', 'dziewiec', 'dziesiec'],
          title: '6 – 10',
        },
        {
          type: 'tip',
          text: 'Sześć (six) and siedem (seven) both start with “s” — say them in pairs when drilling: sześć, siedem, osiem…',
        },
        {
          type: 'paragraph',
          text: 'Use ile? to ask “how many?” and ile to kosztuje? for “how much does it cost?” — essential shopping phrases.',
        },
        {
          type: 'words',
          wordIds: ['ile?', 'ile to kosztuje?', 'numer'],
          title: 'Useful phrases',
        },
      ],
      popQuestions: [
        {
          id: 'n610-ten',
          prompt: 'Dziesięć means…',
          options: ['Nine', 'Ten', 'Twelve', 'Twenty'],
          correctIndex: 1,
        },
        {
          id: 'n610-ile',
          prompt: 'Ile? asks…',
          options: ['What time?', 'How many?', 'Where?', 'Why?'],
          correctIndex: 1,
        },
        {
          id: 'n610-seven',
          prompt: 'Siedem is…',
          options: ['Six', 'Seven', 'Eight', 'Seventeen'],
          correctIndex: 1,
        },
        {
          id: 'n610-pattern',
          prompt: 'Teens like jedenaście build on the word for ten.',
          options: ['True', 'False'],
          correctIndex: 0,
        },
        {
          id: 'n610-nine',
          prompt: 'Dziewięć means nine.',
          options: ['True', 'False'],
          correctIndex: 0,
        },
      ],
      practice: {
        unitIds: [],
        wordIds: ['szesc', 'siedem', 'osiem', 'dziewiec', 'dziesiec', 'ile?', 'numer'],
        formats: [...VOCAB_FORMATS],
        exerciseCount: SECTION_QUIZ_SIZE,
        timeLimitSec: 300,
        helpAllowed: true,
        passAccuracy: 70,
      },
    },
    {
      id: 'eleven-to-twenty',
      title: 'Eleven to twenty',
      kind: 'teach',
      blocks: [
        {
          type: 'paragraph',
          text: 'Eleven to nineteen follow a clear pattern: the unit + -naście (on ten). Dwadzieścia (twenty) starts the next decade. Ordinal words pierwszy, drugi, trzeci (first, second, third) are useful in lists and dates.',
        },
        {
          type: 'words',
          wordIds: [
            'jedenascie',
            'dwanascie',
            'trzynascie',
            'czternascie',
            'pietnascie',
            'szesnascie',
            'siedemnascie',
            'osiemnascie',
            'dziewietnascie',
            'dwadziescia',
          ],
          title: '11 – 20',
        },
        {
          type: 'words',
          wordIds: ['pierwszy', 'drugi', 'trzeci'],
          title: 'Ordinals (first – third)',
        },
        {
          type: 'tip',
          text: 'Break long teens into syllables: siedem-naście, osiem-naście. The stress usually falls on -naście.',
        },
      ],
      popQuestions: [
        {
          id: 'n1120-12',
          prompt: 'Dwanaście means…',
          options: ['Ten', 'Eleven', 'Twelve', 'Twenty'],
          correctIndex: 2,
        },
        {
          id: 'n1120-20',
          prompt: 'Dwadzieścia means…',
          options: ['Twelve', 'Twenty', 'Two', 'Twenty-two'],
          correctIndex: 1,
        },
        {
          id: 'n1120-pattern',
          prompt: 'Jedenaście literally builds on “one on ten”.',
          options: ['True', 'False'],
          correctIndex: 0,
        },
        {
          id: 'n1120-first',
          prompt: 'Pierwszy means…',
          options: ['First', 'One', 'Eleven', 'Before'],
          correctIndex: 0,
        },
        {
          id: 'n1120-15',
          prompt: 'Piętnaście means fifteen.',
          options: ['True', 'False'],
          correctIndex: 0,
        },
      ],
      practice: {
        unitIds: [],
        wordIds: [
          'jedenascie',
          'dwanascie',
          'trzynascie',
          'czternascie',
          'pietnascie',
          'szesnascie',
          'siedemnascie',
          'osiemnascie',
          'dziewietnascie',
          'dwadziescia',
          'pierwszy',
          'drugi',
          'trzeci',
        ],
        formats: [...VOCAB_FORMATS],
        exerciseCount: SECTION_QUIZ_SIZE,
        timeLimitSec: 360,
        helpAllowed: true,
        passAccuracy: 70,
      },
    },
    {
      id: 'recap',
      title: 'Count with confidence',
      kind: 'recap',
      blocks: [
        {
          type: 'paragraph',
          text: 'You can now count to twenty, ask ile?, and recognise ordinals first through third. Keep drilling teens — they unlock dates, times, and prices.',
        },
        {
          type: 'tip',
          text: 'Count aloud daily: in the shower, on a walk, or while checking your phone battery percentage in Polish.',
        },
        {
          type: 'paragraph',
          text: 'The final quiz draws from every number in this lesson. No hints — listen and recall.',
        },
      ],
    },
  ],
  finalQuiz: {
    unitIds: [],
    wordIds: [
      'zero',
      'jeden',
      'dwa',
      'trzy',
      'cztery',
      'piec',
      'szesc',
      'siedem',
      'osiem',
      'dziewiec',
      'dziesiec',
      'jedenascie',
      'dwanascie',
      'trzynascie',
      'czternascie',
      'pietnascie',
      'szesnascie',
      'siedemnascie',
      'osiemnascie',
      'dziewietnascie',
      'dwadziescia',
      'ile?',
      'numer',
    ],
    formats: [...VOCAB_FORMATS],
    exerciseCount: FINAL_QUIZ_SIZE,
    timeLimitSec: 480,
    helpAllowed: false,
    passAccuracy: 75,
  },
}
