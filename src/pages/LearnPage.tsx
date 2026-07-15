import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getLesson, sectionForUnit, STRUCTURED_LESSONS } from '../data/lessons'
import { LessonContent } from '../components/lesson/LessonContent'
import { LessonSectionPractice } from '../components/lesson/LessonSectionPractice'
import {
  computeLessonProgressPercent,
  getLessonProgress,
  markLessonComplete,
  markSectionComplete,
  markSectionRead,
  sectionProgressState,
} from '../lib/lessonProgress'
import type { LessonProgress } from '../types/lesson'

type Phase = 'read' | 'practice' | 'final' | 'remediation' | 'complete'

function SectionProgressDot({ state }: { state: 'unstarted' | 'in-progress' | 'complete' }) {
  if (state === 'complete') {
    return <span className="ml-1 text-green-400">✓</span>
  }
  if (state === 'in-progress') {
    return <span className="ml-1 text-amber-400">◐</span>
  }
  return null
}

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const lesson = lessonId ? getLesson(lessonId) : undefined
  const [sectionIndex, setSectionIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('read')
  const [progress, setProgress] = useState<LessonProgress | undefined>()
  const [remediationSections, setRemediationSections] = useState<string[]>([])
  const [weakMessage, setWeakMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!lessonId) return
    getLessonProgress(lessonId).then(setProgress)
  }, [lessonId])

  const section = lesson?.sections[sectionIndex]
  const isFinalSection =
    lesson && section
      ? sectionIndex === lesson.sections.length - 1 && section.kind === 'recap'
      : false

  useEffect(() => {
    if (!lessonId || !section || phase !== 'read') return
    markSectionRead(lessonId, section.id).then(() => {
      getLessonProgress(lessonId).then(setProgress)
    })
  }, [lessonId, section?.id, phase])

  if (!lesson || !section) {
    return (
      <div className="p-4">
        <p className="text-slate-400">Lesson not found.</p>
        <Link to="/learn" className="text-red-400 text-sm">
          Back to courses
        </Link>
      </div>
    )
  }

  const progressPercent = computeLessonProgressPercent(lesson, progress)

  const goToSection = (idx: number) => {
    setSectionIndex(idx)
    setPhase('read')
    setWeakMessage(null)
  }

  const handlePracticeComplete = async (passed: boolean, wrongUnitIds: string[]) => {
    if (!lessonId) return

    if (phase === 'final') {
      if (passed) {
        await markLessonComplete(lessonId, [])
        setProgress(await getLessonProgress(lessonId))
        setPhase('complete')
      } else {
        const weak = [
          ...new Set(
            wrongUnitIds
              .map((u) => sectionForUnit(lesson, u))
              .filter((s): s is string => Boolean(s && s !== 'intro')),
          ),
        ]
        await markLessonComplete(lessonId, weak)
        setRemediationSections(
          weak.length
            ? weak
            : [lesson.sections.find((s) => s.kind === 'teach')?.id ?? lesson.sections[1]?.id].filter(
                Boolean,
              ) as string[],
        )
        setWeakMessage(
          weak.length
            ? 'Review the highlighted sections below, then retry the final quiz.'
            : 'Keep practising — retry the final quiz when ready.',
        )
        setPhase('remediation')
      }
      setProgress(await getLessonProgress(lessonId))
      return
    }

    if (passed) {
      await markSectionComplete(lessonId, section.id)
      setProgress(await getLessonProgress(lessonId))
      if (isFinalSection) {
        setPhase('final')
      } else if (sectionIndex < lesson.sections.length - 1) {
        goToSection(sectionIndex + 1)
      } else {
        setPhase('final')
      }
    } else {
      setWeakMessage('Score below the pass threshold — reread the section and try again.')
      setPhase('read')
    }
  }

  const startPractice = () => {
    if (isFinalSection || phase === 'final') {
      setPhase('final')
    } else {
      setPhase('practice')
    }
    setWeakMessage(null)
  }

  const completed = progress?.finalQuizPassed

  return (
    <div className="p-4 space-y-5 pb-10">
      <header>
        <button
          type="button"
          onClick={() => navigate('/learn')}
          className="text-xs text-slate-500 mb-2"
        >
          ← Courses
        </button>
        <h1 className="text-xl font-bold">{lesson.title}</h1>
        <p className="text-sm text-slate-400">{lesson.subtitle}</p>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-red-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-slate-400 shrink-0">{progressPercent}%</span>
        </div>
        <p className="text-xs text-slate-600 mt-1">
          Section {sectionIndex + 1} of {lesson.sections.length}
          {completed && ' · ✓ Completed'}
        </p>
      </header>

      {phase === 'complete' && (
        <div className="rounded-2xl border border-green-500/40 bg-green-500/10 p-6 text-center space-y-3">
          <p className="text-2xl">🎉</p>
          <p className="font-semibold text-green-300">Lesson complete!</p>
          <Link to="/learn" className="inline-block text-sm text-red-400">
            Back to courses
          </Link>
        </div>
      )}

      {phase === 'remediation' && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
          <p className="text-sm text-amber-100">{weakMessage}</p>
          <div className="flex flex-wrap gap-2">
            {remediationSections.map((sid) => {
              const s = lesson.sections.find((x) => x.id === sid)
              return (
                <button
                  key={sid}
                  type="button"
                  onClick={() => {
                    const idx = lesson.sections.findIndex((x) => x.id === sid)
                    if (idx >= 0) goToSection(idx)
                  }}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-red-300"
                >
                  {s?.title ?? sid}
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => setPhase('final')}
            className="w-full rounded-xl bg-red-600 py-3 font-semibold text-sm"
          >
            Retry final quiz
          </button>
        </div>
      )}

      {(phase === 'read' || phase === 'remediation') && (
        <>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <h2 className="text-lg font-semibold text-red-400 mb-4">{section.title}</h2>
            <LessonContent blocks={section.blocks} />
          </div>

          {weakMessage && phase === 'read' && (
            <p className="text-sm text-amber-300">{weakMessage}</p>
          )}

          {section.kind === 'intro' ? (
            <button
              type="button"
              onClick={() => goToSection(sectionIndex + 1)}
              className="w-full rounded-xl bg-red-600 py-3.5 font-semibold"
            >
              Continue to first lesson section
            </button>
          ) : section.practice ? (
            <button
              type="button"
              onClick={startPractice}
              className="w-full rounded-xl bg-red-600 py-3.5 font-semibold"
            >
              Practice this section
            </button>
          ) : isFinalSection ? (
            <button
              type="button"
              onClick={() => setPhase('final')}
              className="w-full rounded-xl bg-red-600 py-3.5 font-semibold"
            >
              Start final quiz
            </button>
          ) : (
            <button
              type="button"
              onClick={() => goToSection(Math.min(sectionIndex + 1, lesson.sections.length - 1))}
              className="w-full rounded-xl bg-slate-700 py-3.5 font-semibold"
            >
              Next section
            </button>
          )}
        </>
      )}

      {phase === 'practice' && section.practice && (
        <LessonSectionPractice
          moduleId={lesson.moduleId}
          preset={section.practice}
          popQuestions={section.popQuestions}
          title={`Practice: ${section.title}`}
          onComplete={handlePracticeComplete}
          onCancel={() => setPhase('read')}
        />
      )}

      {phase === 'final' && (
        <LessonSectionPractice
          moduleId={lesson.moduleId}
          preset={lesson.finalQuiz}
          title="Final quiz"
          onComplete={handlePracticeComplete}
          onCancel={() => setPhase('read')}
        />
      )}

      <div className="flex gap-2 overflow-x-auto pt-2">
        {lesson.sections.map((s, i) => {
          const state = sectionProgressState(s, progress)
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => goToSection(i)}
              className={`shrink-0 rounded-lg px-2 py-1 text-[10px] flex items-center ${
                i === sectionIndex
                  ? 'bg-red-600'
                  : state === 'complete'
                    ? 'bg-green-900/50 text-green-300'
                    : state === 'in-progress'
                      ? 'bg-amber-900/40 text-amber-200'
                      : 'bg-slate-800 text-slate-500'
              }`}
            >
              {s.kind === 'intro' ? 'Intro' : s.title.slice(0, 12)}
              <SectionProgressDot state={state} />
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setPhase('final')}
          className={`shrink-0 rounded-lg px-2 py-1 text-[10px] ${
            phase === 'final'
              ? 'bg-red-600'
              : progress?.finalQuizPassed
                ? 'bg-green-900/50 text-green-300'
                : 'bg-slate-800 text-slate-500'
          }`}
        >
          Final{progress?.finalQuizPassed && <span className="ml-1 text-green-400">✓</span>}
        </button>
      </div>
    </div>
  )
}

function CourseCard({
  lesson,
  progress,
}: {
  lesson: (typeof STRUCTURED_LESSONS)[number]
  progress?: LessonProgress
}) {
  const percent = computeLessonProgressPercent(lesson, progress)

  return (
    <Link
      to={`/learn/${lesson.id}`}
      className="block rounded-2xl border border-slate-700 bg-slate-800/50 p-4 hover:border-red-500/40 transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-red-400/80 uppercase tracking-wide">
          {lesson.moduleId} · ~{lesson.estimatedMinutes} min
        </p>
        <span className="text-xs text-slate-400">{percent}%</span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-red-500/80 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <h2 className="font-semibold text-lg mt-2">{lesson.title}</h2>
      <p className="text-sm text-slate-400 mt-1">{lesson.subtitle}</p>
    </Link>
  )
}

export function LearnPage() {
  const [tab, setTab] = useState<'courses' | 'reference'>('courses')
  const [progressMap, setProgressMap] = useState<Record<string, LessonProgress>>({})

  useEffect(() => {
    Promise.all(STRUCTURED_LESSONS.map((l) => getLessonProgress(l.id))).then((rows) => {
      const map: Record<string, LessonProgress> = {}
      for (const row of rows) {
        if (row) map[row.lessonId] = row
      }
      setProgressMap(map)
    })
  }, [])

  return (
    <div className="p-4 space-y-5">
      <header>
        <h1 className="text-xl font-bold">Learn</h1>
        <p className="text-sm text-slate-400">Structured courses and reference material</p>
      </header>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('courses')}
          className={`flex-1 rounded-xl py-2.5 text-sm font-medium ${
            tab === 'courses' ? 'bg-red-600' : 'bg-slate-800 text-slate-400'
          }`}
        >
          Courses
        </button>
        <button
          type="button"
          onClick={() => setTab('reference')}
          className={`flex-1 rounded-xl py-2.5 text-sm font-medium ${
            tab === 'reference' ? 'bg-red-600' : 'bg-slate-800 text-slate-400'
          }`}
        >
          Reference
        </button>
      </div>

      {tab === 'courses' && (
        <section className="space-y-3">
          {STRUCTURED_LESSONS.map((lesson) => (
            <CourseCard key={lesson.id} lesson={lesson} progress={progressMap[lesson.id]} />
          ))}
        </section>
      )}

      {tab === 'reference' && (
        <section className="space-y-3">
          <p className="text-sm text-slate-400">
            Browse every letter, digraph, and word in the knowledge base.
          </p>
          <Link
            to="/knowledge?module=alphabet"
            className="block rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm"
          >
            Alphabet reference →
          </Link>
          <Link
            to="/knowledge?module=digraphs"
            className="block rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm"
          >
            Digraphs reference →
          </Link>
        </section>
      )}
    </div>
  )
}
