import { getModuleUnits, getUnit, getGeneralLesson } from '../data/moduleRegistry'
import { useLessonDrawer } from '../context/LessonDrawerContext'
import { useSettings } from '../hooks/useSettings'

export function LessonDrawer() {
  const { state, closeLesson } = useLessonDrawer()
  const { settings } = useSettings()

  if (!state.open) return null

  const generalLesson = state.showGeneral ? getGeneralLesson(state.moduleId) : null
  const letters = state.showGeneral
    ? []
    : state.letterIds.map((id) => getUnit(state.moduleId, id)).filter(Boolean)

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        onClick={closeLesson}
        aria-label="Close lesson"
      />
      <div className="relative max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-slate-900 border-t border-slate-700 p-4 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Lesson</h2>
          <button
            type="button"
            onClick={closeLesson}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-300"
          >
            Close
          </button>
        </div>

        {generalLesson && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-red-400">{generalLesson.title}</h3>
            {generalLesson.sections.map((s) => (
              <div key={s.heading}>
                <h4 className="font-semibold text-slate-200">{s.heading}</h4>
                <p className="mt-1 text-sm text-slate-400 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        )}

        {letters.map((letter) => letter && (
          <div key={letter.id} className="mb-6 space-y-3 border-b border-slate-800 pb-6 last:border-0">
            <div className="flex items-center gap-4">
              <span className="text-5xl font-serif text-red-400">{letter.upper}</span>
              <div>
                <p className="text-sm text-slate-400">{letter.polishName} · {letter.category}</p>
                {settings?.showIpaInLessons && (
                  <p className="font-mono text-sm text-slate-500">{letter.ipa}</p>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-slate-800/60 p-3">
              <p className="text-sm font-medium text-slate-300">Sound</p>
              <p className="text-slate-100">{letter.englishApprox}</p>
            </div>

            {letter.tips.length > 0 && (
              <ul className="space-y-1 text-sm text-amber-200/80">
                {letter.tips.map((tip) => (
                  <li key={tip}>• {tip}</li>
                ))}
              </ul>
            )}

            <div>
              <p className="mb-2 text-sm font-medium text-slate-400">Examples</p>
              <div className="flex flex-wrap gap-2">
                {letter.examples.map((ex) => (
                  <span
                    key={ex.word}
                    className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm"
                    title={ex.meaning}
                  >
                    <span className="text-red-400 font-medium">
                      {ex.word.replace(
                        new RegExp(`(${ex.highlight})`, 'i'),
                        '[$1]',
                      )}
                    </span>
                    <span className="text-slate-500 ml-1">({ex.meaning})</span>
                  </span>
                ))}
              </div>
            </div>

            {letter.confusedWith && (
              <p className="text-xs text-slate-500">
                Often confused with:{' '}
                {letter.confusedWith
                  .map((id) => getUnit(state.moduleId, id)?.upper ?? id)
                  .join(', ')}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function UnitGrid({
  moduleId,
  onSelect,
}: {
  moduleId: string
  onSelect: (id: string) => void
}) {
  const units = getModuleUnits(moduleId)
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {units.map((u) => (
        <button
          key={u.id}
          type="button"
          onClick={() => onSelect(u.id)}
          className="aspect-square rounded-xl bg-slate-800/80 text-xl font-serif hover:bg-slate-700 active:scale-95 transition-transform px-1"
        >
          {u.upper}
        </button>
      ))}
    </div>
  )
}
