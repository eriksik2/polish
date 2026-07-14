import { useEffect, useState } from 'react'
import {
  getStatsSummary,
  getStatsByLetter,
  getStatsByFormat,
  type Timeframe,
  type DimensionStats,
  type StatsSummary,
} from '../lib/tracking'
import { EXERCISE_FORMATS } from '../data/modules'
import { POLISH_ALPHABET } from '../data/alphabet'

const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
  { id: 'all', label: 'All time' },
]

function StatBar({ summary }: { summary: StatsSummary }) {
  if (summary.attempts === 0) {
    return <span className="text-xs text-slate-600">—</span>
  }
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-red-500 transition-all"
          style={{ width: `${summary.accuracy}%` }}
        />
      </div>
      <span className="text-xs text-slate-400 w-16 text-right">
        {summary.accuracy}% ({summary.attempts})
      </span>
    </div>
  )
}

export function StatsPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>('7d')
  const [overall, setOverall] = useState<StatsSummary | null>(null)
  const [byLetter, setByLetter] = useState<DimensionStats[]>([])
  const [byFormat, setByFormat] = useState<DimensionStats[]>([])

  useEffect(() => {
    const moduleId = 'alphabet'
    Promise.all([
      getStatsSummary({ timeframe, moduleId }),
      getStatsByLetter(moduleId, timeframe),
      getStatsByFormat(moduleId, timeframe),
    ]).then(([o, letters, formats]) => {
      setOverall(o)
      setByLetter(letters)
      setByFormat(formats)
    })
  }, [timeframe])

  const letterMap = new Map(byLetter.map((l) => [l.key, l.summary]))
  const formatMap = new Map(byFormat.map((f) => [f.key, f.summary]))

  return (
    <div className="p-4 space-y-6">
      <header>
        <h1 className="text-xl font-bold">Statistics</h1>
        <p className="text-sm text-slate-400">Track your progress across letters and formats</p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.id}
            type="button"
            onClick={() => setTimeframe(tf.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm ${
              timeframe === tf.id
                ? 'bg-red-600 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {overall && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-800/60 p-3">
            <p className="text-xs text-slate-500">Attempts</p>
            <p className="text-2xl font-bold">{overall.attempts}</p>
          </div>
          <div className="rounded-xl bg-slate-800/60 p-3">
            <p className="text-xs text-slate-500">Accuracy</p>
            <p className="text-2xl font-bold">{overall.accuracy}%</p>
          </div>
          <div className="rounded-xl bg-slate-800/60 p-3">
            <p className="text-xs text-slate-500">Avg time</p>
            <p className="text-2xl font-bold">{(overall.avgResponseTimeMs / 1000).toFixed(1)}s</p>
          </div>
          <div className="rounded-xl bg-slate-800/60 p-3">
            <p className="text-xs text-slate-500">Best streak</p>
            <p className="text-2xl font-bold">{overall.bestStreak}</p>
          </div>
        </div>
      )}

      <section>
        <h2 className="text-sm font-medium text-slate-400 mb-3">By exercise format</h2>
        <div className="space-y-3">
          {EXERCISE_FORMATS.map((f) => {
            const s = formatMap.get(f.id) ?? {
              attempts: 0, correct: 0, accuracy: 0, avgResponseTimeMs: 0, currentStreak: 0, bestStreak: 0,
            }
            return (
              <div key={f.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{f.shortLabel}. {f.label}</span>
                </div>
                <StatBar summary={s} />
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-slate-400 mb-3">By letter</h2>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {POLISH_ALPHABET.map((l) => {
            const s = letterMap.get(l.id) ?? {
              attempts: 0, correct: 0, accuracy: 0, avgResponseTimeMs: 0, currentStreak: 0, bestStreak: 0,
            }
            return (
              <div key={l.id} className="flex items-center gap-3">
                <span className="w-8 text-center font-serif text-lg text-red-400">{l.upper}</span>
                <div className="flex-1">
                  <StatBar summary={s} />
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
