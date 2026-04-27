import { useState } from 'react'

const KEY = 'fbbj_settings'

type Settings = {
  soundEffects: boolean
  music:        boolean
}

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { soundEffects: true, music: false, ...JSON.parse(raw) }
  } catch {}
  return { soundEffects: true, music: false }
}

function save(settings: Settings) {
  try { localStorage.setItem(KEY, JSON.stringify(settings)) } catch {}
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load)

  const setSoundEffects = (v: boolean) => {
    setSettings(prev => {
      const next = { ...prev, soundEffects: v }
      save(next)
      return next
    })
  }

  const setMusic = (v: boolean) => {
    setSettings(prev => {
      const next = { ...prev, music: v }
      save(next)
      return next
    })
  }

  return { ...settings, setSoundEffects, setMusic }
}
