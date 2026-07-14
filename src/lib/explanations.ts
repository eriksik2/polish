import type { ExerciseFormat } from '../data/modules'
import { getWord } from '../data/wordBank'
import { getModuleUnits, getUnit, type PolishLetter } from '../data/moduleRegistry'
import { renderHighlightedWord, wordContainsUnit } from './graphemes'
import { similarityScore } from './similarity'
import { scorePronunciation } from './speech/stt'

export type ReviewStatus = 'correct' | 'your-answer' | 'wrong-option'

export interface ReviewItem {
  unitId?: string
  label: string
  status: ReviewStatus
  heading: string
  body: string
}

function compareUnits(correct: PolishLetter, other: PolishLetter): string {
  if (correct.id === other.id) {
    return `${correct.upper} is pronounced ${correct.englishApprox}. In IPA: ${correct.ipa}.`
  }

  if (correct.ipa === other.ipa) {
    return `${correct.upper} and ${other.upper} sound the same (${correct.englishApprox}) — only the spelling differs.`
  }

  const parts = [
    `${other.upper} sounds like ${other.englishApprox} (${other.ipa}), not like ${correct.englishApprox} (${correct.ipa}).`,
  ]

  if (similarityScore(correct, other) >= 40) {
    parts.push(`These are easy to confuse — focus on: ${other.tips[0] ?? correct.tips[0] ?? 'the lesson examples'}.`)
  }

  return parts.join(' ')
}

function unitSummary(unit: PolishLetter): string {
  const ex = unit.examples[0]
  const example = ex ? ` Example: ${ex.word} (${ex.meaning}).` : ''
  return `${unit.upper} → ${unit.englishApprox}.${example}`
}

function guessUnitFromSpeech(
  moduleId: string,
  transcript: string,
  alternatives: string[] = [],
): PolishLetter | undefined {
  let best: { unit: PolishLetter; score: number } | undefined
  for (const unit of getModuleUnits(moduleId)) {
    const { score } = scorePronunciation(moduleId, unit.id, transcript, alternatives)
    if (!best || score > best.score) best = { unit, score }
  }
  return best && best.score >= 0.5 ? best.unit : undefined
}

function resolveTypedUnitId(moduleId: string, typed: string): string | undefined {
  const n = typed.trim().toLowerCase()
  if (!n) return undefined
  return getUnit(moduleId, n)?.id
}

export function buildAnswerReview(params: {
  moduleId: string
  format: ExerciseFormat
  correctUnitId: string
  selectedUnitId?: string
  selectedLabel?: string
  typedAnswer?: string
  transcript?: string
  alternatives?: string[]
  optionUnitIds?: { label: string; unitId: string }[]
  optionWordIds?: { label: string; wordId: string; meaning?: string }[]
  targetWordId?: string
  highlightIndex?: number
  answerCorrect?: boolean
}): ReviewItem[] {
  const correct = getUnit(params.moduleId, params.correctUnitId)
  if (!correct) return []

  const items: ReviewItem[] = []

  const targetWord = params.targetWordId ? getWord(params.targetWordId) : undefined

  // Word-matching formats
  if (params.format === 'unit-pick-word' || params.format === 'hear-unit-pick-word') {
    items.push({
      unitId: correct.id,
      label: correct.upper,
      status: 'correct',
      heading: `✓ Find a word with ${correct.upper}`,
      body: `${correct.upper} (${correct.englishApprox}) — choose a word whose spelling includes this grapheme.`,
    })

    const correctWordId = params.targetWordId
    const correctW = correctWordId ? getWord(correctWordId) : undefined
    if (correctW) {
      items.push({
        label: correctW.word,
        status: 'correct',
        heading: `✓ ${correctW.word} (${correctW.meaning})`,
        body: `Graphemes: ${correctW.graphemes.join(' · ')} — includes ${correct.upper}.`,
      })
    }

    const selectedWordId = params.selectedUnitId
    if (selectedWordId && selectedWordId !== correctWordId) {
      const picked = getWord(selectedWordId)
      items.push({
        label: picked?.word ?? selectedWordId,
        status: 'your-answer',
        heading: `Your choice: ${picked?.word ?? selectedWordId}`,
        body: picked
          ? wordContainsUnit(picked.word, correct.id)
            ? `This word does contain ${correct.upper}, but another option was intended for this exercise.`
            : `"${picked.word}" does not contain ${correct.upper}. Its graphemes: ${picked.graphemes.join(' · ')}.`
          : 'Not the expected word.',
      })
    }

    for (const opt of params.optionWordIds ?? []) {
      if (opt.wordId === correctWordId) continue
      if (opt.wordId === selectedWordId) continue
      const w = getWord(opt.wordId)
      items.push({
        label: opt.label,
        status: 'wrong-option',
        heading: `${opt.label} — why not`,
        body: w
          ? `"${w.word}" (${w.meaning}) has graphemes ${w.graphemes.join(' · ')} — no ${correct.upper}.`
          : 'Does not contain the target grapheme.',
      })
    }
    return items
  }

  if (params.format === 'word-pick-unit' && targetWord && params.highlightIndex !== undefined) {
    const { before, highlight, after } = renderHighlightedWord(
      targetWord.word,
      params.highlightIndex,
    )
    items.push({
      unitId: correct.id,
      label: correct.upper,
      status: 'correct',
      heading: `✓ ${correct.upper} is correct`,
      body: `In "${targetWord.word}" (${targetWord.meaning}), the highlighted part "${highlight}" is ${correct.upper} (${correct.ipa}). Full spelling: ${before}[${highlight}]${after}.`,
    })

    const selectedId = params.selectedUnitId
    if (selectedId && selectedId !== correct.id) {
      const picked = getUnit(params.moduleId, selectedId)
      if (picked) {
        items.push({
          unitId: picked.id,
          label: picked.upper,
          status: 'your-answer',
          heading: `Your choice: ${picked.upper}`,
          body: `The highlighted grapheme is ${correct.upper}, not ${picked.upper}. ${compareUnits(correct, picked)}`,
        })
      }
    }

    for (const opt of params.optionUnitIds ?? []) {
      if (opt.unitId === correct.id || opt.unitId === selectedId) continue
      const unit = getUnit(params.moduleId, opt.unitId)
      if (unit) {
        items.push({
          unitId: unit.id,
          label: unit.upper,
          status: 'wrong-option',
          heading: `${unit.upper} — why not`,
          body: `The highlighted sound in "${targetWord.word}" is ${correct.upper}, not ${unit.upper}.`,
        })
      }
    }
    return items
  }

  // Always explain the correct answer
  const heardName =
    params.format === 'hear-pick-letter' || params.format === 'hear-type-letter'
  const isDigraph = correct.category === 'digraph'
  items.push({
    unitId: correct.id,
    label: correct.upper,
    status: 'correct',
    heading: `✓ ${correct.upper} is correct`,
    body: heardName
      ? isDigraph
        ? `You heard the ${correct.upper} sound (${correct.ipa}), not a full word. Type the digraph "${correct.lower}". ${correct.tips[0] ?? ''}`.trim()
        : `You heard "${correct.polishName}" — the Polish name for ${correct.upper}. ${unitSummary(correct)} ${correct.tips[0] ?? ''}`.trim()
      : `${unitSummary(correct)} ${correct.tips[0] ?? ''}`.trim(),
  })

  if (params.format === 'speak-letter') {
    const heard = params.transcript?.trim()
    const isCorrect = params.answerCorrect === true
    if (heard) {
      const guessed = !isCorrect
        ? guessUnitFromSpeech(params.moduleId, heard, params.alternatives)
        : undefined

      items.push({
        label: heard,
        status: isCorrect ? 'correct' : 'your-answer',
        heading: isCorrect ? `What we heard: "${heard}"` : `We heard: "${heard}"`,
        body: isCorrect
          ? `Good — that matches ${correct.upper} (${correct.englishApprox}).`
          : guessed && guessed.id !== correct.id
            ? `Why this is wrong: ${compareUnits(correct, guessed)}`
            : `Expected the sound of ${correct.upper} (${correct.englishApprox}) or its name "${correct.polishName}". Try the example word "${correct.examples[0]?.word ?? correct.polishName}".`,
      })

      if (!isCorrect && guessed && guessed.id !== correct.id) {
        items.push({
          unitId: guessed.id,
          label: guessed.upper,
          status: 'wrong-option',
          heading: `Interpreted as ${guessed.upper}`,
          body: `Speech recognition likely matched "${heard}" to ${guessed.upper} (${guessed.englishApprox}), but you needed ${correct.upper}.`,
        })
      }

      if (params.alternatives?.length) {
        for (const alt of params.alternatives.slice(1, 3)) {
          if (alt.trim() && alt !== heard) {
            const altGuess = guessUnitFromSpeech(params.moduleId, alt)
            items.push({
              label: alt,
              status: 'wrong-option',
              heading: `Also considered: "${alt}"`,
              body: altGuess
                ? `Another possible match was ${altGuess.upper} (${altGuess.englishApprox}), not ${correct.upper}.`
                : `Speech recognition had this as a possible match, but it doesn't fit ${correct.upper}.`,
            })
          }
        }
      }
    }
    return items
  }

  if (params.format === 'hear-type-letter' && params.typedAnswer !== undefined) {
    const typed = params.typedAnswer.trim()
    const isCorrect = params.answerCorrect === true
    if (!isCorrect && typed) {
      const guessedId = resolveTypedUnitId(params.moduleId, typed)
      const guessed = guessedId ? getUnit(params.moduleId, guessedId) : undefined
      items.push({
        unitId: guessed?.id,
        label: typed,
        status: 'your-answer',
        heading: `Your answer: "${typed}"`,
        body: guessed
          ? `Why this is wrong: ${compareUnits(correct, guessed)}`
          : `"${typed}" is not the right ${correct.category === 'digraph' ? 'digraph' : 'letter'}. The answer was ${correct.upper}.`,
      })
    }
    return items
  }

  // Multiple-choice formats
  const selectedId = params.selectedUnitId
  const options = params.optionUnitIds ?? []

  if (selectedId && selectedId !== correct.id) {
    const pickedUnit = getUnit(params.moduleId, selectedId)
    if (pickedUnit) {
      items.push({
        unitId: pickedUnit.id,
        label: pickedUnit.upper,
        status: 'your-answer',
        heading: `Your choice: ${pickedUnit.upper}`,
        body: `Why this is wrong: ${compareUnits(correct, pickedUnit)}`,
      })
    } else if (params.selectedLabel) {
      items.push({
        label: params.selectedLabel,
        status: 'your-answer',
        heading: `Your choice: ${params.selectedLabel}`,
        body: `The correct sound description is "${correct.englishLabel}" (${correct.englishApprox}).`,
      })
    }
  }

  for (const opt of options) {
    if (opt.unitId === correct.id) continue
    if (opt.unitId === selectedId) continue
    const unit = getUnit(params.moduleId, opt.unitId)
    if (!unit) {
      if (params.format === 'pick-english') {
        items.push({
          label: opt.label,
          status: 'wrong-option',
          heading: opt.label,
          body: `"${opt.label}" describes a different sound than ${correct.upper} (${correct.englishApprox}).`,
        })
      }
      continue
    }
    items.push({
      unitId: unit.id,
      label: unit.upper,
      status: 'wrong-option',
      heading: `${unit.upper} — why not`,
      body: compareUnits(correct, unit),
    })
  }

  return items
}
