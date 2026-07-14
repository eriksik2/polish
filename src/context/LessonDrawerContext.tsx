import { createContext, useContext, useState, type ReactNode } from 'react'

interface LessonDrawerState {
  open: boolean
  moduleId: string
  letterIds: string[]
  showGeneral: boolean
}

interface LessonDrawerContextValue {
  state: LessonDrawerState
  openLesson: (moduleId: string, letterIds: string[], showGeneral?: boolean) => void
  openGeneralLesson: (moduleId: string) => void
  closeLesson: () => void
}

const LessonDrawerContext = createContext<LessonDrawerContextValue | null>(null)

export function LessonDrawerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LessonDrawerState>({
    open: false,
    moduleId: 'alphabet',
    letterIds: [],
    showGeneral: false,
  })

  const openLesson = (moduleId: string, letterIds: string[], showGeneral = false) => {
    setState({ open: true, moduleId, letterIds, showGeneral })
  }

  const openGeneralLesson = (moduleId: string) => {
    setState({ open: true, moduleId, letterIds: [], showGeneral: true })
  }

  const closeLesson = () => {
    setState({ open: false, moduleId: 'alphabet', letterIds: [], showGeneral: false })
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
