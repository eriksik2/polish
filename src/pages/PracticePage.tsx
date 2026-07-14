import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ExerciseCard } from '../components/ExerciseCard'
import { useLessonDrawer } from '../context/LessonDrawerContext'
import { useSettings } from '../hooks/useSettings'
import { generateExercise } from '../lib/exercises'
import type { Exercise } from '../lib/exercises'
import { buildExerciseQueue, qualityFromAttempt } from '../lib/scheduler'
import { recordAttempt, updateMemoryAfterAttempt } from '../lib/tracking'
import { EXERCISE_FORMATS } from '../data/modules'

export function PracticePage() {
  const [params] = useSearchParams()
  const moduleId = params.get('module') ?? 'alphabet'
  const { settings, loading } = useSettings()
  const { openGeneralLesson } = useLessonDrawer()

  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [queue, setQueue] = useState<{ letterId: string; format: string }[]>([])
  const [sessionStats, setSessionStats] = useState({ done: 0, correct: 0 })
  const [ready, setReady] = useState(false)

  const loadQueue = useCallback(async () => {
    if (!settings) return
    const items = await buildExerciseQueue(moduleId, settings, 30)
    setQueue(items)
    return items
  }, [moduleId, settings])

  const nextExercise = useCallback(
    async (items?: { letterId: string; format: string }[]) => {
      const q = items ?? queue
      if (q.length === 0) {
        const fresh = await loadQueue()
        if (!fresh || fresh.length === 0) {
          setExercise(null)
          return
        }
        const [first, ...rest] = fresh
        setQueue(rest)
        const ex = generateExercise(moduleId, first.letterId, first.format as Exercise['format'])
        setExercise(ex)
        return
      }
      const [first, ...rest] = q
      setQueue(rest)
      const ex = generateExercise(moduleId, first.letterId, first.format as Exercise['format'])
      setExercise(ex)
    },
    [queue, loadQueue, moduleId],
  )

  useEffect(() => {
    if (loading || !settings) return
    loadQueue().then((items) => {
      if (items && items.length > 0) {
        nextExercise(items)
      }
      setReady(true)
    })
  }, [loading, settings])

  const handleAnswer = async (
    correct: boolean,
    responseTimeMs: number,
    meta?: Record<string, unknown>,
  ) => {
    if (!exercise || !settings) return

    await recordAttempt({
      moduleId,
      letterId: exercise.letterId,
      format: exercise.format,
      correct,
      responseTimeMs,
      userAnswer: meta?.transcript as string | undefined,
      expectedAnswer: exercise.correctAnswer,
      confidence: meta?.confidence as number | undefined,
    })

    const quality = qualityFromAttempt(correct, responseTimeMs)
    await updateMemoryAfterAttempt(moduleId, exercise.letterId, exercise.format, correct, quality)

    setSessionStats((s) => ({
      done: s.done + 1,
      correct: s.correct + (correct ? 1 : 0),
    }))

    setTimeout(() => nextExercise(), correct ? 1200 : 2000)
  }

  const handleNext = () => {
    nextExercise()
  }

  const enabledCount = settings
    ? EXERCISE_FORMATS.filter((f) => settings.enabledFormats[f.id]).length
    : 0

  if (loading || !ready) {
    return <div className="p-4 text-slate-400">Loading…</div>
  }

  if (enabledCount === 0) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold">Practice</h1>
        <p className="text-slate-400">No exercise formats enabled. Enable some in Settings.</p>
      </div>
    )
  }

  const formatLabel = exercise
    ? EXERCISE_FORMATS.find((f) => f.id === exercise.format)?.shortLabel
    : ''

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Practice</h1>
          <p className="text-xs text-slate-500">Alphabet module</p>
        </div>
        <div className="text-right text-sm">
          <p className="text-slate-400">
            Session: {sessionStats.correct}/{sessionStats.done}
          </p>
          {exercise && (
            <p className="text-xs text-red-400/80">Format {formatLabel}</p>
          )}
        </div>
      </header>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={openGeneralLesson}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300"
        >
          📖 General lesson
        </button>
      </div>

      {exercise ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onAnswer={handleAnswer}
          />
          <button
            type="button"
            onClick={handleNext}
            className="mt-4 w-full rounded-xl border border-slate-700 py-3 text-sm text-slate-300 hover:bg-slate-800"
          >
            Skip → Next
          </button>
        </div>
      ) : (
        <p className="text-slate-400">No exercises available.</p>
      )}
    </div>
  )
}
