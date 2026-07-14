import { createContext, useContext, useState, type ReactNode } from 'react'
import type { PolishLetter } from '../data/alphabet'
import { GENERAL_ALPHABET_LESSON } from '../data/alphabet'

interface LessonDrawerState {
  open: boolean
  letterIds: string[]
  showGeneral: boolean
}

interface LessonDrawerContextValue {
  state: LessonDrawerState
  openLesson: (letterIds: string[], showGeneral?: boolean) => void
  openGeneralLesson: () => void
  closeLesson: () => void
}

const LessonDrawerContext = createContext<LessonDrawerContextValue | null>(null)

export function LessonDrawerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LessonDrawerState>({
    open: false,
    letterIds: [],
    showGeneral: false,
  })

  const openLesson = (letterIds: string[], showGeneral = false) => {
    setState({ open: true, letterIds, showGeneral })
  }

  const openGeneralLesson = () => {
    setState({ open: true, letterIds: [], showGeneral: true })
  }

  const closeLesson = () => {
    setState({ open: false, letterIds: [], showGeneral: false })
  }

  return (
    <LessonDrawerContext.Provider value={{ state, openLesson, openGeneralLesson, closeLesson }}>
      {children}
    </LessonDrawerContext.Provider>
  )
}

export function useLessonDrawer() {
  const ctx = useContext(LessonDrawerContext)
  if (!ctx) throw new Error('useLessonDrawer must be used within LessonDrawerProvider')
  return ctx
}

export { GENERAL_ALPHABET_LESSON }
export type { PolishLetter }
