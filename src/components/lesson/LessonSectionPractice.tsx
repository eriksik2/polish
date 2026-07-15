import { useCallback, useEffect, useRef, useState } from 'react'
import { ExerciseCard } from '../ExerciseCard'
import { LessonPopQuestionCard } from './LessonPopQuestionCard'
import { generateExercise } from '../../lib/exercises'
import { isVocabHearFormat, hasNativeWordRecording } from '../../lib/speech/audio'
import type { Exercise } from '../../lib/exercises'
import type { LessonPopQuestion, LessonPracticePreset } from '../../types/lesson'
import { shuffle } from '../../lib/scheduler'

interface LessonSectionPracticeProps {
  moduleId: string
  preset: LessonPracticePreset
  title: string
  popQuestions?: LessonPopQuestion[]
  wordPool?: string[]
  onComplete: (passed: boolean, wrongUnitIds: string[]) => void
  onCancel: () => void
}

type QuizItem =
  | { kind: 'exercise'; moduleId: string; letterId: string; format: LessonPracticePreset['formats'][number] }
  | { kind: 'pop'; question: LessonPopQuestion }

function presetUnitIds(preset: LessonPracticePreset): string[] {
  if (preset.wordIds?.length) return preset.wordIds
  return preset.unitIds
}

function buildExercisePool(
  moduleId: string,
  preset: LessonPracticePreset,
): QuizItem[] {
  const pool: QuizItem[] = []
  const ids = presetUnitIds(preset)
  for (const letterId of ids) {
    for (const format of preset.formats) {
      if (isVocabHearFormat(format) && !hasNativeWordRecording(letterId)) continue
      pool.push({ kind: 'exercise', moduleId, letterId, format })
    }
  }
  return shuffle(pool)
}

function buildSectionQuizQueue(
  moduleId: string,
  preset: LessonPracticePreset,
  popQuestions: LessonPopQuestion[],
): QuizItem[] {
  const total = preset.exerciseCount
  const popCount = popQuestions.length > 0 ? Math.min(Math.floor(total / 2), popQuestions.length) : 0
  const exerciseCount = total - popCount

  const exercisePool = buildExercisePool(moduleId, preset)
  const exercises: QuizItem[] = []
  let i = 0
  while (exercises.length < exerciseCount && exercisePool.length > 0) {
    exercises.push(exercisePool[i % exercisePool.length])
    i++
  }

  const pops: QuizItem[] = shuffle([...popQuestions])
    .slice(0, popCount)
    .map((question) => ({ kind: 'pop', question }))

  return shuffle([...exercises, ...pops])
}

function buildFinalQuizQueue(moduleId: string, preset: LessonPracticePreset): QuizItem[] {
  const pool = buildExercisePool(moduleId, preset)
  const result: QuizItem[] = []
  let i = 0
  while (result.length < preset.exerciseCount && pool.length > 0) {
    result.push(pool[i % pool.length])
    i++
  }
  return result
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function LessonSectionPractice({
  moduleId,
  preset,
  title,
  popQuestions = [],
  wordPool,
  onComplete,
  onCancel,
}: LessonSectionPracticeProps) {
  const [queue] = useState(() =>
    popQuestions.length > 0
      ? buildSectionQuizQueue(moduleId, preset, popQuestions)
      : buildFinalQuizQueue(moduleId, preset),
  )
  const [index, setIndex] = useState(0)
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [answered, setAnswered] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [awaitingContinue, setAwaitingContinue] = useState(false)
  const [done, setDone] = useState(false)
  const [remaining, setRemaining] = useState(preset.timeLimitSec)
  const resultsRef = useRef({ correct: 0, wrong: [] as string[] })

  const currentItem = queue[index]

  const vocabPool = wordPool ?? preset.wordIds ?? []

  const loadExerciseAt = useCallback(
    (idx: number) => {
      const item = queue[idx]
      if (!item || item.kind !== 'exercise') return null
      return generateExercise(
        item.moduleId,
        item.letterId,
        item.format,
        vocabPool.length > 0 ? vocabPool : undefined,
      )
    },
    [queue, vocabPool],
  )

  useEffect(() => {
    if (currentItem?.kind === 'exercise') {
      setExercise(loadExerciseAt(index))
    } else {
      setExercise(null)
    }
    setAwaitingContinue(false)
  }, [index, currentItem?.kind, loadExerciseAt])

  useEffect(() => {
    if (!preset.timeLimitSec || done) return
    if (remaining !== null && remaining <= 0) {
      const acc = (resultsRef.current.correct / Math.max(1, answered)) * 100
      onComplete(acc >= preset.passAccuracy, resultsRef.current.wrong)
      setDone(true)
      return
    }
    const t = setInterval(() => setRemaining((r) => (r === null ? null : r - 1)), 1000)
    return () => clearInterval(t)
  }, [remaining, done, preset, answered, onComplete])

  const finishQuiz = () => {
    const acc = (resultsRef.current.correct / queue.length) * 100
    setDone(true)
    onComplete(acc >= preset.passAccuracy, [...new Set(resultsRef.current.wrong)])
  }

  const advance = () => {
    setAwaitingContinue(false)
    const next = index + 1
    if (next >= queue.length) {
      finishQuiz()
      return
    }
    setIndex(next)
  }

  const recordAnswer = (ok: boolean, letterId?: string) => {
    if (ok) {
      resultsRef.current.correct++
      setCorrect((c) => c + 1)
    } else if (letterId) {
      resultsRef.current.wrong.push(letterId)
    }
    setAnswered((a) => a + 1)
    setAwaitingContinue(true)
  }

  const handleExerciseAnswer = (ok: boolean, _ms: number) => {
    recordAnswer(ok, exercise?.letterId)
  }

  const handlePopAnswer = (ok: boolean) => {
    recordAnswer(ok)
  }

  if (done) return null

  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0
  const displayIndex = index + (awaitingContinue ? 0 : 1)

  return (
    <div className="space-y-4 rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-red-300">{title}</p>
          <p className="text-xs text-slate-500">
            {displayIndex} / {queue.length} · need {preset.passAccuracy}%
          </p>
        </div>
        {remaining !== null && (
          <p className="text-sm font-mono text-slate-400">⏱ {formatTime(remaining)}</p>
        )}
      </div>

      {currentItem?.kind === 'pop' ? (
        <LessonPopQuestionCard
          key={currentItem.question.id}
          question={currentItem.question}
          onAnswer={handlePopAnswer}
          onContinue={advance}
        />
      ) : exercise ? (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onAnswer={handleExerciseAnswer}
          onContinue={advance}
          noHelp={!preset.helpAllowed}
          quickMode={false}
        />
      ) : (
        <p className="text-slate-400">Could not generate exercise.</p>
      )}

      <button type="button" onClick={onCancel} className="text-xs text-slate-600">
        Cancel practice
      </button>

      {answered > 0 && (
        <p className="text-xs text-center text-slate-500">Running accuracy: {accuracy}%</p>
      )}
    </div>
  )
}
