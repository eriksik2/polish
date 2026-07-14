import { useCallback, useEffect, useState } from 'react'
import { getSettings, saveSettings, type AppSettings } from '../lib/db'

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s)
      setLoading(false)
    })
  }, [])

  const update = useCallback(async (partial: Partial<AppSettings>) => {
    const current = await getSettings()
    const next = { ...current, ...partial }
    await saveSettings(next)
    setSettings(next)
    return next
  }, [])

  return { settings, loading, update }
}
