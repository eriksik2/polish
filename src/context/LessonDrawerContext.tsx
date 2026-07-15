import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

export interface KnowledgeDrawerState {
  open: boolean
  moduleId: string
  letterIds: string[]
  wordIds: string[]
  showGeneral: boolean
}

interface KnowledgeDrawerContextValue {
  state: KnowledgeDrawerState
  canGoBack: boolean
  openLesson: (moduleId: string, letterIds: string[], showGeneral?: boolean) => void
  openWord: (moduleId: string, wordId: string) => void
  openGeneralLesson: (moduleId: string) => void
  navigateLesson: (moduleId: string, letterIds: string[], showGeneral?: boolean) => void
  navigateWord: (moduleId: string, wordId: string) => void
  goBack: () => void
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
  const [history, setHistory] = useState<KnowledgeDrawerState[]>([])

  const pushCurrent = useCallback((next: KnowledgeDrawerState) => {
    setState((current) => {
      if (current.open) {
        setHistory((h) => [...h, current])
      }
      return next
    })
  }, [])

  const openLesson = (moduleId: string, letterIds: string[], showGeneral = false) => {
    setHistory([])
    setState({ open: true, moduleId, letterIds, wordIds: [], showGeneral })
  }

  const openWord = (moduleId: string, wordId: string) => {
    setHistory([])
    setState({ open: true, moduleId, letterIds: [], wordIds: [wordId], showGeneral: false })
  }

  const openGeneralLesson = (moduleId: string) => {
    setHistory([])
    setState({ open: true, moduleId, letterIds: [], wordIds: [], showGeneral: true })
  }

  const navigateLesson = (moduleId: string, letterIds: string[], showGeneral = false) => {
    pushCurrent({ open: true, moduleId, letterIds, wordIds: [], showGeneral })
  }

  const navigateWord = (moduleId: string, wordId: string) => {
    pushCurrent({ open: true, moduleId, letterIds: [], wordIds: [wordId], showGeneral: false })
  }

  const goBack = () => {
    setHistory((h) => {
      if (!h.length) return h
      const prev = h[h.length - 1]
      setState(prev)
      return h.slice(0, -1)
    })
  }

  const closeLesson = () => {
    setHistory([])
    setState(closedState)
  }

  return (
    <KnowledgeDrawerContext.Provider
      value={{
        state,
        canGoBack: history.length > 0,
        openLesson,
        openWord,
        openGeneralLesson,
        navigateLesson,
        navigateWord,
        goBack,
        closeLesson,
      }}
    >
      {children}
    </KnowledgeDrawerContext.Provider>
  )
}

export function useLessonDrawer() {
  const ctx = useContext(KnowledgeDrawerContext)
  if (!ctx) throw new Error('useLessonDrawer must be used within LessonDrawerProvider')
  return ctx
}
