import type { StructuredLesson } from '../../types/lesson'
import { FINAL_QUIZ_SIZE, SECTION_QUIZ_SIZE } from '../../types/lesson'

const VOCAB_FORMATS = [
  'vocab-pick-meaning',
  'vocab-meaning-pick-word',
  'vocab-hear-pick-meaning',
  'vocab-hear-pick-word',
] as const

export const GREETINGS_LESSON: StructuredLesson = {
  id: 'greetings-basics',
  moduleId: 'basic-words',
  category: 'first-words',
  title: 'Greetings & Politeness',
  subtitle: 'Hello, goodbye, thank you — the phrases you need every day',
  estimatedMinutes: 30,
  sections: [
    {
      id: 'intro',
      title: 'Why greetings matter',
      kind: 'intro',
      blocks: [
        {
          type: 'heading',
          text: 'First impressions in Polish',
        },
        {
          type: 'paragraph',
          text: 'Polish has distinct informal and polite registers. With friends you will hear cześć and pa; in shops, offices, and with strangers use dzień dobry and do widzenia. Getting this right is more important than perfect grammar.',
        },
        {
          type: 'tip',
          text: 'When unsure, default to polite forms (dzień dobry, dziękuję, do widzenia). You can always shift informal once someone uses cześć with you.',
        },
        {
          type: 'paragraph',
          text: 'Tap any word badge to hear pronunciation. Section quizzes mix vocabulary drills with quick knowledge checks about what you just read.',
        },
      ],
    },
    {
      id: 'informal',
      title: 'Informal hellos',
      kind: 'teach',
      blocks: [
        {
          type: 'paragraph',
          text: 'These are for friends, peers, and casual situations. Cześć works as both “hi” and “bye” — one of the most useful single words in Polish.',
        },
        {
          type: 'words',
          wordIds: ['czesc', 'hej', 'witam', 'jak sie masz?', 'co slychac?', 'wszystko w porzadku?'],
          title: 'Casual greetings',
        },
        {
          type: 'tip',
          text: 'Jak się masz? is singular informal. With groups or politely, Poles often ask jak się macie? — same pattern, plural form.',
        },
        {
          type: 'paragraph',
          text: 'Common answers: dobrze (fine), świetnie (great), w porządku (all right). You do not need a long reply — dobrze, dzięki is perfectly natural.',
        },
        {
          type: 'words',
          wordIds: ['dobrze', 'swietnie', 'w porzadku'],
          title: 'Typical replies',
        },
      ],
      popQuestions: [
        {
          id: 'inf-czesc',
          prompt: 'Cześć can mean both “hi” and “bye”.',
          options: ['True', 'False'],
          correctIndex: 0,
        },
        {
          id: 'inf-register',
          prompt: 'Cześć is best used with…',
          options: ['A shop assistant', 'Friends and peers', 'A job interview', 'A doctor you just met'],
          correctIndex: 1,
        },
        {
          id: 'inf-reply',
          prompt: 'A short natural reply to jak się masz? is…',
          options: ['Do widzenia', 'Dobrze, dzięki', 'Dobranoc', 'Przepraszam'],
          correctIndex: 1,
        },
        {
          id: 'inf-hej',
          prompt: 'Hej is more casual than dzień dobry.',
          options: ['True', 'False'],
          correctIndex: 0,
        },
        {
          id: 'inf-witam',
          prompt: 'Witam often means…',
          options: ['Good night', 'Welcome / I welcome you', 'Excuse me', 'See you later'],
          correctIndex: 1,
        },
      ],
      practice: {
        unitIds: [],
        wordIds: ['czesc', 'hej', 'witam', 'jak sie masz?', 'co slychac?', 'dobrze', 'swietnie', 'w porzadku'],
        formats: [...VOCAB_FORMATS],
        exerciseCount: SECTION_QUIZ_SIZE,
        timeLimitSec: 300,
        helpAllowed: true,
        passAccuracy: 70,
      },
    },
    {
      id: 'polite-time',
      title: 'Polite & time-based greetings',
      kind: 'teach',
      blocks: [
        {
          type: 'paragraph',
          text: 'Dzień dobry is the safe default from morning until evening — literally “good day”. In the evening switch to dobry wieczór. Dobranoc is only for good night when leaving late or going to bed.',
        },
        {
          type: 'words',
          wordIds: ['dzien dobry', 'dobry wieczor', 'dobranoc', 'jak sie pan ma?', 'jak sie pani ma?'],
          title: 'Polite greetings',
        },
        {
          type: 'tip',
          text: 'Pan (sir) and pani (madam) mark respect. Jak się pan/pani ma? is how you ask “how are you?” formally.',
        },
        {
          type: 'paragraph',
          text: 'Miło cię poznać (nice to meet you) works informally. In formal introductions you might hear miło pana/panią poznać — same idea, polite address.',
        },
        {
          type: 'words',
          wordIds: ['milo cie poznac'],
          title: 'Meeting someone',
        },
      ],
      popQuestions: [
        {
          id: 'pol-dzien',
          prompt: 'Dzień dobry is appropriate in a shop or office.',
          options: ['True', 'False'],
          correctIndex: 0,
        },
        {
          id: 'pol-wieczor',
          prompt: 'In the evening you should prefer…',
          options: ['Dzień dobry', 'Dobry wieczór', 'Hej', 'Pa'],
          correctIndex: 1,
        },
        {
          id: 'pol-dobranoc',
          prompt: 'Dobranoc means…',
          options: ['Good morning', 'Good night', 'See you', 'Thank you'],
          correctIndex: 1,
        },
        {
          id: 'pol-pan',
          prompt: 'Jak się pan ma? is the formal way to ask a man how he is.',
          options: ['True', 'False'],
          correctIndex: 0,
        },
        {
          id: 'pol-default',
          prompt: 'When unsure, the safest greeting is…',
          options: ['Pa', 'Cześć', 'Dzień dobry', 'Hej'],
          correctIndex: 2,
        },
      ],
      practice: {
        unitIds: [],
        wordIds: ['dzien dobry', 'dobry wieczor', 'dobranoc', 'jak sie pan ma?', 'jak sie pani ma?', 'milo cie poznac'],
        formats: [...VOCAB_FORMATS],
        exerciseCount: SECTION_QUIZ_SIZE,
        timeLimitSec: 300,
        helpAllowed: true,
        passAccuracy: 70,
      },
    },
    {
      id: 'farewells-politeness',
      title: 'Goodbyes & politeness',
      kind: 'teach',
      blocks: [
        {
          type: 'paragraph',
          text: 'Do widzenia is the standard polite goodbye. Do zobaczenia promises another meeting — “until we see each other again”. Pa is quick and informal, like “bye”.',
        },
        {
          type: 'words',
          wordIds: ['do widzenia', 'do zobaczenia', 'pa', 'czesc ponownie'],
          title: 'Farewells',
        },
        { type: 'heading', text: 'Please, thanks, sorry' },
        {
          type: 'paragraph',
          text: 'Dziękuję is neutral-polite; dzięki is casual. Proszę covers please, here you are, and you are welcome depending on context. Przepraszam is excuse me or sorry.',
        },
        {
          type: 'words',
          wordIds: [
            'dziekuje',
            'dzieki',
            'bardzo dziekuje',
            'prosze',
            'przepraszam',
            'nie ma za co',
            'tak',
            'nie',
            'moze',
            'oczywiscie',
          ],
          title: 'Politeness essentials',
        },
        {
          type: 'tip',
          text: 'Nie ma za co (don’t mention it) is a friendly reply to dziękuję — very common in Poland.',
        },
      ],
      popQuestions: [
        {
          id: 'far-formal',
          prompt: 'The most neutral polite goodbye is…',
          options: ['Pa', 'Do widzenia', 'Hej', 'Cześć'],
          correctIndex: 1,
        },
        {
          id: 'far-dzieki',
          prompt: 'Dzięki is more informal than dziękuję.',
          options: ['True', 'False'],
          correctIndex: 0,
        },
        {
          id: 'far-prosze',
          prompt: 'Proszę can mean “please” and also “here you are”.',
          options: ['True', 'False'],
          correctIndex: 0,
        },
        {
          id: 'far-nie',
          prompt: 'Nie ma za co is a typical reply to…',
          options: ['Dzień dobry', 'Dziękuję', 'Dobranoc', 'Przepraszam'],
          correctIndex: 1,
        },
        {
          id: 'far-zobaczenia',
          prompt: 'Do zobaczenia suggests you expect to meet again.',
          options: ['True', 'False'],
          correctIndex: 0,
        },
      ],
      practice: {
        unitIds: [],
        wordIds: [
          'do widzenia',
          'do zobaczenia',
          'pa',
          'dziekuje',
          'dzieki',
          'prosze',
          'przepraszam',
          'nie ma za co',
          'tak',
          'nie',
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
      title: 'Ready to greet',
      kind: 'recap',
      blocks: [
        {
          type: 'paragraph',
          text: 'You now have informal and polite greetings, farewells, and the core politeness phrases. In real life, tone and context matter as much as the words — when in doubt, stay polite.',
        },
        {
          type: 'tip',
          text: 'Practise switching registers: cześć ↔ dzień dobry, pa ↔ do widzenia, dzięki ↔ dziękuję.',
        },
        {
          type: 'paragraph',
          text: 'The final quiz covers every greeting and politeness word from this lesson. No hints — trust what you have learned.',
        },
      ],
    },
  ],
  finalQuiz: {
    unitIds: [],
    wordIds: [
      'czesc',
      'hej',
      'witam',
      'dzien dobry',
      'dobry wieczor',
      'dobranoc',
      'do widzenia',
      'do zobaczenia',
      'pa',
      'jak sie masz?',
      'co slychac?',
      'dziekuje',
      'dzieki',
      'prosze',
      'przepraszam',
      'tak',
      'nie',
      'dobrze',
      'milo cie poznac',
      'nie ma za co',
    ],
    formats: [...VOCAB_FORMATS],
    exerciseCount: FINAL_QUIZ_SIZE,
    timeLimitSec: 600,
    helpAllowed: false,
    passAccuracy: 75,
  },
}
