import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { LessonDrawer } from './components/LessonDrawer'
import { LessonDrawerProvider } from './context/LessonDrawerContext'
import { HomePage } from './pages/HomePage'
import { PracticePage } from './pages/PracticePage'
import { LessonsPage } from './pages/LessonsPage'
import { StatsPage } from './pages/StatsPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <LessonDrawerProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/lessons" element={<LessonsPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
        <LessonDrawer />
      </LessonDrawerProvider>
    </BrowserRouter>
  )
}
