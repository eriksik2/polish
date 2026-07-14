import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ExerciseCard } from '../components/ExerciseCard'
import { generateExercise } from '../lib/exercises'
import type { Exercise } from '../lib/exercises'
import { buildSessionQueue } from '../lib/sessionQueue'
import { qualityFromAttempt } from '../lib/scheduler'
import { recordAttempt, updateMemoryAfterAttempt } from '../lib/tracking'
import { EXERCISE_FORMATS } from '../data/modules'
import {
  clearSessionConfig,
  loadSessionConfig,
  type PracticeSessionConfig,
  type SessionQueueItem,
} from '../types/practiceSession'

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function loadNextExercise(
  queue: SessionQueueItem[],
  from: number,
): { exercise: Exercise | null; nextIndex: number } {
  for (let i = from; i < queue.length; i++) {
    const item = queue[i]
    const ex = generateExercise(item.moduleId, item.letterId, item.format)
    if (ex) return { exercise: ex, nextIndex: i + 1 }
  }
  return { exercise: null, nextIndex: queue.length }
}

export function PracticeSessionPage() {
  const navigate = useNavigate()
  const [config, setConfig] = useState<PracticeSessionConfig | null>(null)
  const [queue, setQueue] = useState<SessionQueueItem[]>([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [stats, setStats] = useState({ done: 0, correct: 0 })
  const [awaitingContinue, setAwaitingContinue] = useState(false)
  const [finished, setFinished] = useState(false)
  const [totalRemaining, setTotalRemaining] = useState<number | null>(null)
  const sessionStart = useRef(Date.now())
  const quickAdvanceRef = useRef<() => void>(() => {})

  useEffect(() => {
    const c = loadSessionConfig()
    if (!c || c.formats.length === 0) {
      navigate('/practice', { replace: true })
      return
    }
    const q = buildSessionQueue(c)
    if (q.length === 0) {
      navigate('/practice', { replace: true })
      return
    }
    setConfig(c)
    setQueue(q)
    if (c.totalTimeLimitSec) setTotalRemaining(c.totalTimeLimitSec)
    const { exercise: ex, nextIndex } = loadNextExercise(q, 0)
    setQueueIndex(nextIndex)
    setExercise(ex)
  }, [navigate])

  useEffect(() => {
    if (totalRemaining === null || finished) return
    if (totalRemaining <= 0) {
      setFinished(true)
      clearSessionConfig()
      return
    }
    const t = setInterval(() => setTotalRemaining((r) => (r === null ? null : r - 1)), 1000)
    return () => clearInterval(t)
  }, [totalRemaining, finished])

  const goNext = useCallback(() => {
    if (!config) return
    setAwaitingContinue(false)

    if (stats.done >= config.exerciseCount || queueIndex >= queue.length) {
      setFinished(true)
      clearSessionConfig()
      setExercise(null)
      return
    }

    const { exercise: ex, nextIndex } = loadNextExercise(queue, queueIndex)
    setQueueIndex(nextIndex)
    if (!ex) {
      setFinished(true)
      clearSessionConfig()
      setExercise(null)
      return
    }
    setExercise(ex)
  }, [config, stats.done, queue, queueIndex])

  quickAdvanceRef.current = goNext

  const handleAnswer = async (
    correct: boolean,
    responseTimeMs: number,
    meta?: Record<string, unknown>,
  ) => {
    if (!exercise || !config) return

    await recordAttempt({
      moduleId: exercise.moduleId,
      letterId: exercise.letterId,
      format: exercise.format,
      correct,
      responseTimeMs,
      userAnswer: meta?.transcript as string | undefined,
      expectedAnswer: exercise.correctAnswer,
      confidence: meta?.confidence as number | undefined,
    })

    const quality = qualityFromAttempt(correct, responseTimeMs)
    await updateMemoryAfterAttempt(
      exercise.moduleId,
      exercise.letterId,
      exercise.format,
      correct,
      quality,
    )

    const newDone = stats.done + 1
    setStats((s) => ({
      done: newDone,
      correct: s.correct + (correct ? 1 : 0),
    }))

    if (config.quickMode) {
      setTimeout(() => {
        if (newDone >= config.exerciseCount) {
          setFinished(true)
          clearSessionConfig()
          setExercise(null)
        } else {
          quickAdvanceRef.current()
        }
      }, 750)
    } else {
      setAwaitingContinue(true)
      if (newDone >= config.exerciseCount) {
        // last exercise — still show review until continue
      }
    }
  }

  const handleNext = () => {
    if (!config) return
    if (stats.done >= config.exerciseCount) {
      setFinished(true)
      clearSessionConfig()
      setExercise(null)
      return
    }
    goNext()
  }

  if (!config) {
    return <div className="p-4 text-slate-400">Loading session…</div>
  }

  if (finished) {
    const accuracy = stats.done ? Math.round((stats.correct / stats.done) * 100) : 0
    const elapsed = Math.round((Date.now() - sessionStart.current) / 1000)
    return (
      <div className="p-4 space-y-6">
        <header>
          <h1 className="text-xl font-bold">Session complete</h1>
          <p className="text-sm text-slate-400">Time: {formatTime(elapsed)}</p>
        </header>
        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 text-center space-y-2">
          <p className="text-4xl font-bold text-red-400">{accuracy}%</p>
          <p className="text-slate-300">
            {stats.correct} / {stats.done} correct
          </p>
        </div>
        <Link
          to="/practice"
          className="block w-full rounded-xl bg-red-600 py-3.5 text-center font-semibold"
        >
          New session
        </Link>
        <Link to="/" className="block text-center text-sm text-slate-500">
          Back to home
        </Link>
      </div>
    )
  }

  const formatLabel = exercise
    ? EXERCISE_FORMATS.find((f) => f.id === exercise.format)?.shortLabel
    : ''

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Practice session</h1>
          <p className="text-xs text-slate-500">
            {stats.done + (awaitingContinue ? 0 : 1)} / {config.exerciseCount}
            {config.quickMode && ' · quick'}
            {config.noHelp && ' · no help'}
          </p>
        </div>
        <div className="text-right text-sm">
          {totalRemaining !== null && (
            <p className={totalRemaining < 60 ? 'text-amber-400' : 'text-slate-400'}>
              ⏱ {formatTime(totalRemaining)}
            </p>
          )}
          <p className="text-slate-400">
            {stats.correct}/{stats.done}
          </p>
          {exercise && <p className="text-xs text-red-400/80">Format {formatLabel}</p>}
        </div>
      </header>

      <button
        type="button"
        onClick={() => {
          clearSessionConfig()
          navigate('/practice')
        }}
        className="text-xs text-slate-600 hover:text-slate-400"
      >
        End session
      </button>

      {exercise ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onAnswer={handleAnswer}
            onContinue={handleNext}
            noHelp={config.noHelp}
            quickMode={config.quickMode}
            itemTimeLimitSec={config.itemTimeLimitSec}
          />
        </div>
      ) : (
        <p className="text-slate-400">Preparing…</p>
      )}

      {exercise && !awaitingContinue && !config.quickMode && (
        <button
          type="button"
          onClick={handleNext}
          className="w-full text-center text-[11px] text-slate-600 hover:text-slate-400"
        >
          skip
        </button>
      )}
    </div>
  )
}
