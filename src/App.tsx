import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { LessonDrawer } from './components/LessonDrawer'
import { LessonDrawerProvider } from './context/LessonDrawerContext'
import { HomePage } from './pages/HomePage'
import { PracticePage } from './pages/PracticePage'
import { PracticeSessionPage } from './pages/PracticeSessionPage'
import { LearnPage, LessonPage } from './pages/LearnPage'
import { LessonsPage } from './pages/LessonsPage'
import { StatsPage } from './pages/StatsPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}>
      <LessonDrawerProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/practice/run" element={<PracticeSessionPage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/learn/:lessonId" element={<LessonPage />} />
            <Route path="/knowledge" element={<LessonsPage />} />
            <Route path="/lessons" element={<Navigate to="/learn" replace />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
        <LessonDrawer />
      </LessonDrawerProvider>
    </BrowserRouter>
  )
}
