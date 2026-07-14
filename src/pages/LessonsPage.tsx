import { useState } from 'react'
import { LETTER_MAP, POLISH_ALPHABET, GENERAL_ALPHABET_LESSON } from '../data/alphabet'
import { LetterGrid } from '../components/LessonDrawer'
import { useLessonDrawer } from '../context/LessonDrawerContext'
import { useSettings } from '../hooks/useSettings'

export function LessonsPage() {
  const { openLesson, openGeneralLesson } = useLessonDrawer()
  const { settings } = useSettings()
  const [selected, setSelected] = useState<string | null>(null)

  const letter = selected ? LETTER_MAP.get(selected) : null

  return (
    <div className="p-4 space-y-6">
      <header>
        <h1 className="text-xl font-bold">Lessons</h1>
        <p className="text-sm text-slate-400">Alphabet module — 32 letters</p>
      </header>

      <button
        type="button"
        onClick={openGeneralLesson}
        className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-left"
      >
        <h2 className="font-semibold text-red-400">{GENERAL_ALPHABET_LESSON.title}</h2>
        <p className="text-sm text-slate-400 mt-1">Overview, traps, and how to use this module</p>
      </button>

      <section>
        <h2 className="text-sm font-medium text-slate-400 mb-3">All letters</h2>
        <LetterGrid
          onSelect={(id) => {
            setSelected(id)
            openLesson([id])
          }}
        />
      </section>

      {letter && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl font-serif text-red-400">{letter.upper}</span>
            <div>
              <p className="font-medium">{letter.polishName}</p>
              {settings?.showIpaInLessons && (
                <p className="font-mono text-sm text-slate-500">{letter.ipa}</p>
              )}
            </div>
          </div>
          <p className="text-slate-300">{letter.englishApprox}</p>
          <div className="flex flex-wrap gap-2">
            {letter.examples.map((ex) => (
              <span key={ex.word} className="rounded-lg bg-slate-800 px-2 py-1 text-sm">
                {ex.word} <span className="text-slate-500">({ex.meaning})</span>
              </span>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium text-slate-400 mb-2">Vowels</h2>
        <div className="flex flex-wrap gap-2">
          {POLISH_ALPHABET.filter((l) => l.category === 'vowel').map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => { setSelected(l.id); openLesson([l.id]) }}
              className="rounded-lg bg-slate-800 px-3 py-2 font-serif text-lg"
            >
              {l.upper}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-slate-400 mb-2">Consonants</h2>
        <div className="flex flex-wrap gap-2">
          {POLISH_ALPHABET.filter((l) => l.category === 'consonant').map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => { setSelected(l.id); openLesson([l.id]) }}
              className="rounded-lg bg-slate-800 px-3 py-2 font-serif text-lg"
            >
              {l.upper}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
