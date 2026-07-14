import { Link } from 'react-router-dom'
import { MODULES } from '../data/modules'
import { useEffect, useState } from 'react'
import { getStatsSummary } from '../lib/tracking'

export function HomePage() {
  const [todayStats, setTodayStats] = useState({ attempts: 0, accuracy: 0 })

  useEffect(() => {
    getStatsSummary({ timeframe: 'today', moduleId: 'alphabet' }).then((s) => {
      setTodayStats({ attempts: s.attempts, accuracy: s.accuracy })
    })
  }, [])

  return (
    <div className="p-4 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Polish Learn</h1>
        <p className="text-slate-400 text-sm mt-1">Practice Polish, one module at a time</p>
      </header>

      {todayStats.attempts > 0 && (
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-4">
          <p className="text-sm text-slate-400">Today</p>
          <p className="text-xl font-semibold">
            {todayStats.attempts} exercises · {todayStats.accuracy}% accuracy
          </p>
        </div>
      )}

      <section>
        <h2 className="text-sm font-medium text-slate-400 mb-3">Modules</h2>
        <div className="space-y-3">
          {MODULES.map((mod) => (
            <Link
              key={mod.id}
              to={mod.available ? `/practice?module=${mod.id}` : '#'}
              className={`block rounded-2xl border p-4 transition-colors ${
                mod.available
                  ? 'border-slate-700 bg-slate-800/60 hover:border-red-500/50'
                  : 'border-slate-800 bg-slate-900 opacity-50 pointer-events-none'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl font-serif text-red-400">{mod.icon}</span>
                <div>
                  <h3 className="font-semibold">{mod.title}</h3>
                  <p className="text-sm text-slate-400">{mod.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Link
        to="/practice?module=alphabet"
        className="block w-full rounded-2xl bg-red-600 py-4 text-center text-lg font-semibold active:scale-[0.98] transition-transform"
      >
        Start practicing
      </Link>
    </div>
  )
}
