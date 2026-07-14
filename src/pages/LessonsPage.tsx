import { useSearchParams } from 'react-router-dom'
import { getModuleUnits, getUnit, getGeneralLesson } from '../data/moduleRegistry'
import { UnitGrid } from '../components/LessonDrawer'
import { useLessonDrawer } from '../context/LessonDrawerContext'
import { useSettings } from '../hooks/useSettings'
import { useState } from 'react'
import { getModuleInfo } from '../data/moduleRegistry'

export function LessonsPage() {
  const [params] = useSearchParams()
  const moduleId = params.get('module') ?? 'alphabet'
  const moduleInfo = getModuleInfo(moduleId)
  const { openLesson, openGeneralLesson } = useLessonDrawer()
  const { settings } = useSettings()
  const [selected, setSelected] = useState<string | null>(null)

  const units = getModuleUnits(moduleId)
  const generalLesson = getGeneralLesson(moduleId)
  const unit = selected ? getUnit(moduleId, selected) : null

  return (
    <div className="p-4 space-y-6">
      <header>
        <h1 className="text-xl font-bold">Lessons</h1>
        <p className="text-sm text-slate-400">
          {moduleInfo?.title ?? moduleId} — {units.length} items
        </p>
      </header>

      {generalLesson && (
        <button
          type="button"
          onClick={() => openGeneralLesson(moduleId)}
          className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-left"
        >
          <h2 className="font-semibold text-red-400">{generalLesson.title}</h2>
          <p className="text-sm text-slate-400 mt-1">Overview and how to use this module</p>
        </button>
      )}

      <section>
        <h2 className="text-sm font-medium text-slate-400 mb-3">All items</h2>
        <UnitGrid
          moduleId={moduleId}
          onSelect={(id) => {
            setSelected(id)
            openLesson(moduleId, [id])
          }}
        />
      </section>

      {unit && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl font-serif text-red-400">{unit.upper}</span>
            <div>
              <p className="font-medium">{unit.polishName}</p>
              {settings?.showIpaInLessons && (
                <p className="font-mono text-sm text-slate-500">{unit.ipa}</p>
              )}
            </div>
          </div>
          <p className="text-slate-300">{unit.englishApprox}</p>
          <div className="flex flex-wrap gap-2">
            {unit.examples.map((ex) => (
              <span key={ex.word} className="rounded-lg bg-slate-800 px-2 py-1 text-sm">
                {ex.word} <span className="text-slate-500">({ex.meaning})</span>
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
