import type { StructuredLesson } from '../../types/lesson'
import { FINAL_QUIZ_SIZE, SECTION_QUIZ_SIZE } from '../../types/lesson'

export const DIGRAPHS_LESSON: StructuredLesson = {
  id: 'digraphs-fundamentals',
  moduleId: 'digraphs',
  title: 'Polish Digraphs',
  subtitle: 'Two letters, one sound — ch, cz, sz, rz, dz, and more',
  estimatedMinutes: 35,
  sections: [
    {
      id: 'intro',
      title: 'What is a digraph?',
      kind: 'intro',
      blocks: [
        {
          type: 'heading',
          text: 'When two letters are really one sound',
        },
        {
          type: 'paragraph',
          text: 'A digraph is a pair of letters that spell a single sound. Polish uses seven common digraphs: ch, cz, dz, dź, dż, rz, and sz. They are not optional spelling variants — they are essential to read and write correctly.',
        },
        {
          type: 'tip',
          text: 'If you already know the alphabet, think of digraphs as new symbols made of two familiar keys on the keyboard.',
        },
        {
          type: 'paragraph',
          text: 'This lesson compares soft and hard pairs (ć/cz, ś/sz, ź/ż, dź/dż) and explains when Polish spelling uses rz instead of ż. Read each section, then practise only what you just covered.',
        },
      ],
    },
    {
      id: 'fricatives',
      title: 'Fricatives: ch, sz, cz',
      kind: 'teach',
      blocks: [
        {
          type: 'paragraph',
          text: 'Start with the “hissing” family. SZ is the hard sh (like shut). CZ is the hard ch in cheese. CH is the guttural sound in Scottish loch — quite different from English church.',
        },
        { type: 'units', moduleId: 'digraphs', unitIds: ['sz', 'cz', 'ch'] },
        {
          type: 'tip',
          text: 'SZ vs Ś: sz is harder and harsher; ś (alphabet) is softer. Your ear will separate them with practice.',
        },
        {
          type: 'paragraph',
          text: 'In spelling, cz often appears where English might expect “ch”. The word czas (time) is a good anchor sound.',
        },
      ],
      popQuestions: [
        {
          id: 'fric-sz',
          prompt: 'SZ is the hard “sh” sound (like shut).',
          options: ['True', 'False'],
          correctIndex: 0,
        },
        {
          id: 'fric-ch',
          prompt: 'Polish CH sounds most like…',
          options: ['English church', 'Scottish loch', 'Polish cz', 'Silent h'],
          correctIndex: 1,
        },
        {
          id: 'fric-cz',
          prompt: 'CZ is the hard “ch” in cheese.',
          options: ['True', 'False'],
          correctIndex: 0,
        },
        {
          id: 'fric-soft',
          prompt: 'Compared with ś (alphabet), sz is…',
          options: ['Softer', 'Harder and harsher', 'Identical', 'Silent'],
          correctIndex: 1,
        },
        {
          id: 'fric-count',
          prompt: 'How many digraphs are in this fricatives group?',
          options: ['2', '3', '4', '7'],
          correctIndex: 1,
        },
      ],
      practice: {
        unitIds: ['ch', 'cz', 'sz'],
        formats: ['hear-pick-letter', 'pick-audio', 'hear-type-letter'],
        exerciseCount: SECTION_QUIZ_SIZE,
        timeLimitSec: 240,
        helpAllowed: true,
        passAccuracy: 70,
      },
    },
    {
      id: 'affricates',
      title: 'Affricates: dz, dź, dż',
      kind: 'teach',
      blocks: [
        {
          type: 'paragraph',
          text: 'Affricates begin like a stop consonant and release into a fricative. DZ is “dz” in beds. DŹ and DŻ add softness vs hardness — compare dźwięk (sound) with dżem (jam).',
        },
        { type: 'units', moduleId: 'digraphs', unitIds: ['dz', 'dź', 'dż'] },
        {
          type: 'tip',
          text: 'Before i, Polish often writes dzi instead of dź (dziadek). The sound at the start is still the soft dź.',
        },
        {
          type: 'paragraph',
          text: 'Do not confuse dz with plain c or dż with cz — the middle of the tongue and the release are different.',
        },
      ],
      popQuestions: [
        {
          id: 'aff-dz',
          prompt: 'DZ sounds like the “dz” in beds.',
          options: ['True', 'False'],
          correctIndex: 0,
        },
        {
          id: 'aff-dzi',
          prompt: 'Before i, dzi often spells the soft…',
          options: ['dz sound', 'dź sound', 'dż sound', 'Silent d'],
          correctIndex: 1,
          explanation: 'dziadek starts with soft dź, even though it is written dzi.',
        },
        {
          id: 'aff-pair',
          prompt: 'DŹ is the soft partner of…',
          options: ['cz', 'dż', 'dz', 'ch'],
          correctIndex: 1,
        },
        {
          id: 'aff-type',
          prompt: 'DZ, dź, and dż are all…',
          options: ['Fricatives', 'Affricates', 'Vowels', 'Nasal sounds'],
          correctIndex: 1,
        },
        {
          id: 'aff-confuse',
          prompt: 'You should avoid confusing dż with cz.',
          options: ['True', 'False'],
          correctIndex: 0,
        },
      ],
      practice: {
        unitIds: ['dz', 'dź', 'dż'],
        formats: ['hear-pick-letter', 'pick-audio', 'hear-word-pick-letter'],
        exerciseCount: SECTION_QUIZ_SIZE,
        timeLimitSec: 300,
        helpAllowed: true,
        passAccuracy: 70,
      },
    },
    {
      id: 'rz',
      title: 'RZ — spelling trickery',
      kind: 'teach',
      blocks: [
        {
          type: 'paragraph',
          text: 'RZ is usually pronounced like ż (the “vision” sound). Historically it could be a palatalised cluster, but in modern Polish rzeka (river) and morze (sea) use the same zh-quality sound as ż.',
        },
        { type: 'units', moduleId: 'digraphs', unitIds: ['rz'] },
        {
          type: 'tip',
          text: 'When you see rz, think ż first. True r+z clusters are rare in the standard language.',
        },
        {
          type: 'paragraph',
          text: 'Compare: szum (noise) vs śnieg (snow) from the alphabet lesson — here compare czysty (clean) with rzadko (rarely) to lock the rz sound.',
        },
      ],
      popQuestions: [
        {
          id: 'rz-sound',
          prompt: 'In modern Polish, RZ usually sounds like…',
          options: ['r + z separately', 'ż (zh)', 'sz', 'Silent'],
          correctIndex: 1,
        },
        {
          id: 'rz-spell',
          prompt: 'When you see rz in a word, you should first think of…',
          options: ['ż', 'sz', 'English r', 'A silent letter'],
          correctIndex: 0,
        },
        {
          id: 'rz-rare',
          prompt: 'True r+z clusters are rare in standard Polish.',
          options: ['True', 'False'],
          correctIndex: 0,
        },
        {
          id: 'rz-example',
          prompt: 'Rzeka (river) uses the rz digraph.',
          options: ['True', 'False'],
          correctIndex: 0,
        },
        {
          id: 'rz-total',
          prompt: 'How many common Polish digraphs does this course cover?',
          options: ['5', '6', '7', '9'],
          correctIndex: 2,
        },
      ],
      practice: {
        unitIds: ['rz'],
        formats: ['hear-pick-letter', 'hear-word-pick-letter', 'pick-english'],
        exerciseCount: SECTION_QUIZ_SIZE,
        timeLimitSec: 180,
        helpAllowed: true,
        passAccuracy: 70,
      },
    },
    {
      id: 'recap',
      title: 'All seven, one mouth',
      kind: 'recap',
      blocks: [
        {
          type: 'paragraph',
          text: 'You have met all seven digraphs. Hard pairs: cz/sz/dż. Soft neighbours in the alphabet: ć/ś/ź/dź. CH stands apart with its back-of-the-throat friction. RZ joins ż in sound.',
        },
        {
          type: 'units',
          moduleId: 'digraphs',
          unitIds: ['ch', 'cz', 'dz', 'dź', 'dż', 'rz', 'sz'],
        },
        {
          type: 'paragraph',
          text: 'The final quiz mixes every digraph without help. Pass it to complete this lesson — if you miss a sound, we will send you back to the section that teaches it.',
        },
      ],
    },
  ],
  finalQuiz: {
    unitIds: ['ch', 'cz', 'dz', 'dź', 'dż', 'rz', 'sz'],
    formats: ['hear-pick-letter', 'pick-audio', 'hear-word-pick-letter'],
    exerciseCount: FINAL_QUIZ_SIZE,
    timeLimitSec: 480,
    helpAllowed: false,
    passAccuracy: 75,
  },
}
