import { useState } from 'react'

const KEY = 'fbbj_settings'

export type CardBackColor = 'purple' | 'red' | 'blue' | 'green' | 'black' | 'gold'
export type TableTheme    = 'green' | 'blue' | 'red' | 'purple' | 'charcoal'

export const TABLE_PALETTES: Record<TableTheme, { felt: string; light: string; dark: string; border: string }> = {
  green:   { felt: '#1a3a27', light: '#1f4a31', dark: '#102416', border: '#0d1f12' },
  blue:    { felt: '#1a2a3a', light: '#1f3a4a', dark: '#101e2a', border: '#0d1520' },
  red:     { felt: '#3a1a1a', light: '#4a1f1f', dark: '#241010', border: '#1a0a0a' },
  purple:  { felt: '#2a1a3a', light: '#3a1f4a', dark: '#1a1024', border: '#120a1a' },
  charcoal:{ felt: '#222428', light: '#2c3036', dark: '#161820', border: '#10121a' },
}

type Settings = {
  soundEffects:  boolean
  music:         boolean
  classicMode:   boolean
  cardBackColor: CardBackColor
  tableTheme:    TableTheme
}

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { soundEffects: true, music: false, classicMode: false, cardBackColor: 'purple', tableTheme: 'green', ...JSON.parse(raw) }
  } catch {}
  return { soundEffects: true, music: false, classicMode: false, cardBackColor: 'purple', tableTheme: 'green' }
}

function save(settings: Settings) {
  try { localStorage.setItem(KEY, JSON.stringify(settings)) } catch {}
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load)

  const setSoundEffects = (v: boolean) => {
    setSettings(prev => { const next = { ...prev, soundEffects: v }; save(next); return next })
  }

  const setMusic = (v: boolean) => {
    setSettings(prev => { const next = { ...prev, music: v }; save(next); return next })
  }

  const setClassicMode = (v: boolean) => {
    setSettings(prev => { const next = { ...prev, classicMode: v }; save(next); return next })
  }

  const setCardBackColor = (v: CardBackColor) => {
    setSettings(prev => { const next = { ...prev, cardBackColor: v }; save(next); return next })
  }

  const setTableTheme = (v: TableTheme) => {
    setSettings(prev => { const next = { ...prev, tableTheme: v }; save(next); return next })
  }

  return { ...settings, setSoundEffects, setMusic, setClassicMode, setCardBackColor, setTableTheme }
}
