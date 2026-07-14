import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EXERCISE_FORMATS, MODULES, type ExerciseFormat } from '../data/modules'
import { getModuleUnits } from '../data/moduleRegistry'
import { useSettings } from '../hooks/useSettings'
import {
  DEFAULT_PRACTICE_SESSION,
  saveSessionConfig,
  type PracticeSessionConfig,
} from '../types/practiceSession'

type Step = 'basics' | 'modules' | 'formats' | 'advanced'

const TIME_PRESETS = [
  { label: 'No limit', value: null },
  { label: '5 min', value: 300 },
  { label: '10 min', value: 600 },
  { label: '15 min', value: 900 },
  { label: '20 min', value: 1200 },
]

const ITEM_TIME_PRESETS = [
  { label: 'No limit', value: null },
  { label: '15 sec', value: 15 },
  { label: '30 sec', value: 30 },
  { label: '45 sec', value: 45 },
  { label: '60 sec', value: 60 },
]

const COUNT_PRESETS = [10, 15, 20, 30, 50]

export function PracticeSetupPage() {
  const navigate = useNavigate()
  const { settings, loading } = useSettings()
  const [step, setStep] = useState<Step>('basics')
  const [config, setConfig] = useState<PracticeSessionConfig>(DEFAULT_PRACTICE_SESSION)

  useEffect(() => {
    if (!settings) return
    const enabled = EXERCISE_FORMATS.filter((f) => settings.enabledFormats[f.id]).map((f) => f.id)
    setConfig((c) => ({ ...c, formats: enabled }))
  }, [settings])

  const toggleModule = (id: string) => {
    setConfig((c) => {
      const has = c.moduleIds.includes(id)
      const moduleIds = has ? c.moduleIds.filter((m) => m !== id) : [...c.moduleIds, id]
      return { ...c, moduleIds: moduleIds.length ? moduleIds : [id] }
    })
  }

  const toggleFormat = (id: ExerciseFormat) => {
    setConfig((c) => {
      const has = c.formats.includes(id)
      const formats = has ? c.formats.filter((f) => f !== id) : [...c.formats, id]
      return { ...c, formats }
    })
  }

  const toggleUnit = (unitId: string) => {
    setConfig((c) => {
      const current = c.unitIds ?? []
      const has = current.includes(unitId)
      const next = has ? current.filter((u) => u !== unitId) : [...current, unitId]
      return { ...c, unitIds: next.length ? next : null }
    })
  }

  const canStart =
    config.moduleIds.length > 0 && config.formats.length > 0 && config.exerciseCount > 0

  const startSession = () => {
    if (!canStart) return
    saveSessionConfig(config)
    navigate('/practice/run')
  }

  if (loading || !settings) {
    return <div className="p-4 text-slate-400">Loading…</div>
  }

  const steps: { id: Step; label: string }[] = [
    { id: 'basics', label: '1. Session' },
    { id: 'modules', label: '2. Modules' },
    { id: 'formats', label: '3. Formats' },
    { id: 'advanced', label: '4. Items' },
  ]

  return (
    <div className="p-4 space-y-5 pb-8">
      <header>
        <h1 className="text-xl font-bold">Free practice</h1>
        <p className="text-sm text-slate-400 mt-1">Configure a session, then start when ready</p>
      </header>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {steps.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(s.id)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              step === s.id ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {step === 'basics' && (
        <section className="space-y-4">
          <label className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3">
            <div>
              <p className="font-medium text-sm">No help mode</p>
              <p className="text-xs text-slate-500">Hide info buttons during exercises</p>
            </div>
            <input
              type="checkbox"
              checked={config.noHelp}
              onChange={(e) => setConfig({ ...config, noHelp: e.target.checked })}
              className="h-5 w-5 accent-red-600"
            />
          </label>

          <label className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3">
            <div>
              <p className="font-medium text-sm">Quick mode</p>
              <p className="text-xs text-slate-500">Brief feedback, auto-advance — no breakdown</p>
            </div>
            <input
              type="checkbox"
              checked={config.quickMode}
              onChange={(e) => setConfig({ ...config, quickMode: e.target.checked })}
              className="h-5 w-5 accent-red-600"
            />
          </label>

          <div>
            <p className="text-sm font-medium text-slate-300 mb-2">Exercises</p>
            <div className="flex flex-wrap gap-2">
              {COUNT_PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setConfig({ ...config, exerciseCount: n })}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    config.exerciseCount === n ? 'bg-red-600' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-300 mb-2">Total time limit</p>
            <div className="flex flex-wrap gap-2">
              {TIME_PRESETS.map((p) => (
                <button
                  key={String(p.value)}
                  type="button"
                  onClick={() => setConfig({ ...config, totalTimeLimitSec: p.value })}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    config.totalTimeLimitSec === p.value ? 'bg-red-600' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-300 mb-2">Per-exercise time limit</p>
            <div className="flex flex-wrap gap-2">
              {ITEM_TIME_PRESETS.map((p) => (
                <button
                  key={String(p.value)}
                  type="button"
                  onClick={() => setConfig({ ...config, itemTimeLimitSec: p.value })}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    config.itemTimeLimitSec === p.value ? 'bg-red-600' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {step === 'modules' && (
        <section className="space-y-3">
          <p className="text-sm text-slate-400">Choose one or more modules to mix in this session.</p>
          {MODULES.filter((m) => m.available).map((mod) => {
            const selected = config.moduleIds.includes(mod.id)
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => toggleModule(mod.id)}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${
                  selected ? 'border-red-500 bg-red-500/10' : 'border-slate-700 bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-serif text-red-400">{mod.icon}</span>
                  <div>
                    <p className="font-semibold">{mod.title}</p>
                    <p className="text-xs text-slate-500">{mod.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </section>
      )}

      {step === 'formats' && (
        <section className="space-y-3">
          <p className="text-sm text-slate-400">
            Formats enabled in Settings are pre-selected. Tap to include or exclude for this session.
          </p>
          {EXERCISE_FORMATS.map((f) => {
            const globallyEnabled = settings.enabledFormats[f.id]
            const selected = config.formats.includes(f.id)
            return (
              <button
                key={f.id}
                type="button"
                disabled={!globallyEnabled}
                onClick={() => toggleFormat(f.id)}
                className={`w-full rounded-xl border p-4 text-left transition-colors disabled:opacity-40 ${
                  selected ? 'border-red-500/60 bg-red-500/5' : 'border-slate-700 bg-slate-800/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">
                      <span className="text-red-400/80 mr-2">{f.shortLabel}</span>
                      {f.label}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{f.detail}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-2 py-0.5 text-xs ${
                      selected ? 'bg-red-600' : 'bg-slate-700 text-slate-500'
                    }`}
                  >
                    {selected ? 'On' : 'Off'}
                  </span>
                </div>
              </button>
            )
          })}
        </section>
      )}

      {step === 'advanced' && (
        <section className="space-y-3">
          <p className="text-sm text-slate-400">
            Optionally limit practice to specific letters or digraphs. Leave all selected for the full module.
          </p>
          <button
            type="button"
            onClick={() => setConfig({ ...config, unitIds: null })}
            className="text-xs text-red-400 underline"
          >
            Select all items
          </button>
          {config.moduleIds.map((moduleId) => {
            const mod = MODULES.find((m) => m.id === moduleId)
            const units = getModuleUnits(moduleId)
            return (
              <div key={moduleId}>
                <p className="text-sm font-medium text-slate-300 mb-2">{mod?.title}</p>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {units.map((u) => {
                    const on =
                      !config.unitIds || config.unitIds.includes(u.id)
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleUnit(u.id)}
                        className={`aspect-square rounded-xl text-lg font-serif transition-colors ${
                          on ? 'bg-red-600/20 border border-red-500/40 text-red-300' : 'bg-slate-800 text-slate-600'
                        }`}
                      >
                        {u.upper}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </section>
      )}

      <div className="flex gap-2 pt-2">
        {step !== 'basics' && (
          <button
            type="button"
            onClick={() => {
              const order: Step[] = ['basics', 'modules', 'formats', 'advanced']
              const i = order.indexOf(step)
              if (i > 0) setStep(order[i - 1])
            }}
            className="flex-1 rounded-xl border border-slate-700 py-3 text-sm text-slate-300"
          >
            Back
          </button>
        )}
        {step !== 'advanced' ? (
          <button
            type="button"
            onClick={() => {
              const order: Step[] = ['basics', 'modules', 'formats', 'advanced']
              const i = order.indexOf(step)
              if (i < order.length - 1) setStep(order[i + 1])
            }}
            className="flex-[2] rounded-xl bg-slate-700 py-3 font-semibold"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            disabled={!canStart}
            onClick={startSession}
            className="flex-[2] rounded-xl bg-red-600 py-3 font-semibold disabled:opacity-40"
          >
            Start session
          </button>
        )}
      </div>

      {step !== 'advanced' && (
        <button
          type="button"
          disabled={!canStart}
          onClick={startSession}
          className="w-full rounded-xl border border-red-500/40 py-3 text-sm text-red-400 disabled:opacity-40"
        >
          Start now with current settings
        </button>
      )}
    </div>
  )
}
