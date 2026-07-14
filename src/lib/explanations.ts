import type { ExerciseFormat } from '../data/modules'
import { getModuleUnits, getUnit, type PolishLetter } from '../data/moduleRegistry'
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
  answerCorrect?: boolean
}): ReviewItem[] {
  const correct = getUnit(params.moduleId, params.correctUnitId)
  if (!correct) return []

  const items: ReviewItem[] = []

  // Always explain the correct answer
  const heardName =
    params.format === 'hear-pick-letter' || params.format === 'hear-type-letter'
  items.push({
    unitId: correct.id,
    label: correct.upper,
    status: 'correct',
    heading: `✓ ${correct.upper} is correct`,
    body: heardName
      ? `You heard "${correct.polishName}" — the Polish name for ${correct.upper}. ${unitSummary(correct)} ${correct.tips[0] ?? ''}`.trim()
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
