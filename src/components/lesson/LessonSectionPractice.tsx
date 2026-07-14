import { useCallback, useEffect, useRef, useState } from 'react'
import { ExerciseCard } from '../ExerciseCard'
import { generateExercise } from '../../lib/exercises'
import type { Exercise } from '../../lib/exercises'
import type { LessonPracticePreset } from '../../types/lesson'
import { shuffle } from '../../lib/scheduler'

interface LessonSectionPracticeProps {
  moduleId: string
  preset: LessonPracticePreset
  title: string
  onComplete: (passed: boolean, wrongUnitIds: string[]) => void
  onCancel: () => void
}

function buildPresetQueue(
  moduleId: string,
  preset: LessonPracticePreset,
): { moduleId: string; letterId: string; format: LessonPracticePreset['formats'][number] }[] {
  const pool: { moduleId: string; letterId: string; format: LessonPracticePreset['formats'][number] }[] = []
  for (const letterId of preset.unitIds) {
    for (const format of preset.formats) {
      pool.push({ moduleId, letterId, format })
    }
  }
  const shuffled = shuffle(pool)
  const result: typeof pool = []
  let i = 0
  while (result.length < preset.exerciseCount && shuffled.length > 0) {
    result.push(shuffled[i % shuffled.length])
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
  onComplete,
  onCancel,
}: LessonSectionPracticeProps) {
  const [queue] = useState(() => buildPresetQueue(moduleId, preset))
  const [index, setIndex] = useState(0)
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [answered, setAnswered] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [awaitingContinue, setAwaitingContinue] = useState(false)
  const [done, setDone] = useState(false)
  const [remaining, setRemaining] = useState(preset.timeLimitSec)
  const resultsRef = useRef({ correct: 0, wrong: [] as string[] })

  const loadAt = useCallback(
    (idx: number) => {
      if (idx >= queue.length) return null
      const item = queue[idx]
      return generateExercise(item.moduleId, item.letterId, item.format)
    },
    [queue],
  )

  useEffect(() => {
    setExercise(loadAt(0))
  }, [loadAt])

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

  const advance = () => {
    setAwaitingContinue(false)
    const next = index + 1
    if (next >= queue.length) {
      const acc = (resultsRef.current.correct / queue.length) * 100
      setDone(true)
      onComplete(acc >= preset.passAccuracy, [...new Set(resultsRef.current.wrong)])
      return
    }
    setIndex(next)
    setExercise(loadAt(next))
  }

  const handleAnswer = (ok: boolean, _ms: number) => {
    if (ok) {
      resultsRef.current.correct++
      setCorrect((c) => c + 1)
    } else if (exercise) {
      resultsRef.current.wrong.push(exercise.letterId)
    }
    setAnswered((a) => a + 1)
    setAwaitingContinue(true)
  }

  if (done) return null

  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0

  return (
    <div className="space-y-4 rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-red-300">{title}</p>
          <p className="text-xs text-slate-500">
            {index + (awaitingContinue ? 0 : 1)} / {queue.length} · need {preset.passAccuracy}%
          </p>
        </div>
        {remaining !== null && (
          <p className="text-sm font-mono text-slate-400">⏱ {formatTime(remaining)}</p>
        )}
      </div>

      {exercise ? (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onAnswer={handleAnswer}
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
