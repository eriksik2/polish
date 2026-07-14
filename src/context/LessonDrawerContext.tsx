import { createContext, useContext, useState, type ReactNode } from 'react'

interface KnowledgeDrawerState {
  open: boolean
  moduleId: string
  letterIds: string[]
  wordIds: string[]
  showGeneral: boolean
}

interface KnowledgeDrawerContextValue {
  state: KnowledgeDrawerState
  openLesson: (moduleId: string, letterIds: string[], showGeneral?: boolean) => void
  openWord: (moduleId: string, wordId: string) => void
  openGeneralLesson: (moduleId: string) => void
  closeLesson: () => void
}

const KnowledgeDrawerContext = createContext<KnowledgeDrawerContextValue | null>(null)

const closedState: KnowledgeDrawerState = {
  open: false,
  moduleId: 'alphabet',
  letterIds: [],
  wordIds: [],
  showGeneral: false,
}

export function LessonDrawerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<KnowledgeDrawerState>(closedState)

  const openLesson = (moduleId: string, letterIds: string[], showGeneral = false) => {
    setState({ open: true, moduleId, letterIds, wordIds: [], showGeneral })
  }

  const openWord = (moduleId: string, wordId: string) => {
    setState({ open: true, moduleId, letterIds: [], wordIds: [wordId], showGeneral: false })
  }

  const openGeneralLesson = (moduleId: string) => {
    setState({ open: true, moduleId, letterIds: [], wordIds: [], showGeneral: true })
  }

  const closeLesson = () => {
    setState(closedState)
  }

  return (
    <KnowledgeDrawerContext.Provider value={{ state, openLesson, openWord, openGeneralLesson, closeLesson }}>
      {children}
    </KnowledgeDrawerContext.Provider>
  )
}

export function useLessonDrawer() {
  const ctx = useContext(KnowledgeDrawerContext)
  if (!ctx) throw new Error('useLessonDrawer must be used within LessonDrawerProvider')
  return ctx
}
