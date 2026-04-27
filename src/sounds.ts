import { Howl } from 'howler'
import spriteUrl from './assets/sounds/sprite.mp3'
import spriteData from './assets/sounds/sprite.json'

export type SoundName = keyof typeof spriteData.sprite

let howl: Howl | null = null
let soundEnabled = false

export function initSounds(): void {
  if (howl) return
  howl = new Howl({
    src: [spriteUrl],
    sprite: spriteData.sprite as unknown as Record<string, [number, number]>,
  })
}

export function setSoundEnabled(v: boolean): void {
  soundEnabled = v
}

export function playSound(name: SoundName): void {
  if (!soundEnabled || !howl) return
  howl.play(name)
}
