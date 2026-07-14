import type { Exercise } from './exercises'
import { graphemeModuleId } from '../data/wordBank'
import { hasUnitRecording, hasWordRecording, playGraphemeSequence, playUnitAudio, playWordAudio } from './speech/audio'

/** Play the sound for the correct answer after the user confirms. */
export function playCorrectAnswerAudio(exercise: Exercise): void {
  setTimeout(() => {
    const format = exercise.format

    if (
      format === 'unit-pick-word' ||
      format === 'hear-unit-pick-word' ||
      format === 'hear-word-pick-letter' ||
      format === 'hear-word-build-sequence' ||
      format === 'hear-sequence-pick-word'
    ) {
      const wordId = exercise.targetWordId ?? exercise.correctAnswer
      if (wordId && hasWordRecording(wordId)) {
        playWordAudio(wordId)
        return
      }
    }

    if (format === 'hear-sequence-pick-word' && exercise.playSequence?.length) {
      playGraphemeSequence(exercise.playSequence)
      return
    }

    if (format === 'word-pick-unit' && exercise.targetWordId && hasWordRecording(exercise.targetWordId)) {
      playWordAudio(exercise.targetWordId)
      return
    }

    const unitId = exercise.letterId
    const moduleId = exercise.moduleId
    if (unitId && hasUnitRecording(moduleId, unitId)) {
      playUnitAudio(moduleId, unitId)
    }
  }, 280)
}

export function playReviewItemAudio(item: {
  unitId?: string
  unitModuleId?: string
  wordId?: string
}): boolean {
  if (item.wordId && hasWordRecording(item.wordId)) {
    return playWordAudio(item.wordId)
  }
  if (item.unitId) {
    const moduleId = item.unitModuleId ?? graphemeModuleId(item.unitId)
    return playUnitAudio(moduleId, item.unitId)
  }
  return false
}
