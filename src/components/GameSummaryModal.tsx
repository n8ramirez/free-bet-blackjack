import React from 'react'
import type { SessionStats } from '../hooks/useGameState'
import { PotOfGoldIcon, Push22Icon, HellraiserIcon } from './SideBetPanel'
import { LadyLuckIcon, BusterBlackjackIcon, Wild7sIcon } from './ClassicSideBetPanel'

type Props = {
  stats:              SessionStats
  peakBankrollCents:  number
  isClassic:          boolean
  onClose:            () => void
}

function fmt(cents: number): string {
  const d = cents / 100
  return '$' + (d % 1 === 0 ? d.toLocaleString() : d.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
}

const FREE_BET_ICONS: Record<string, React.ReactNode> = {
  'Pot of Gold': <PotOfGoldIcon className="w-5 h-5" />,
  'Push 22':     <Push22Icon    className="w-5 h-5" />,
  'Hellraiser':  <HellraiserIcon className="w-5 h-5" />,
}

const CLASSIC_ICONS: Record<string, React.ReactNode> = {
  'Lady Luck':         <LadyLuckIcon         className="w-5 h-5" />,
  'Buster Blackjack':  <BusterBlackjackIcon  className="w-5 h-5" />,
  'Wild 7s':           <Wild7sIcon           className="w-5 h-5" />,
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-stone-800 last:border-0">
      <span className="text-stone-400 text-xs">{label}</span>
      <span className="text-white text-sm font-bold">{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div className="text-[9px] uppercase tracking-widest font-extrabold text-stone-500 px-5 pt-4 pb-1">{title}</div>
      <div className="px-5">{children}</div>
    </div>
  )
}

export function GameSummaryModal({ stats, peakBankrollCents, isClassic, onClose }: Props) {
  const iconMap = isClassic ? CLASSIC_ICONS : FREE_BET_ICONS

  const entries = Object.entries(stats.sideBetRounds)
  const favValue = entries.length > 0 ? Math.max(...entries.map(([, v]) => v)) : 0
  const favNames = entries.filter(([, v]) => v === favValue).map(([k]) => k)

  const favDisplay: React.ReactNode = favNames.length === 0
    ? 'None'
    : (
      <div className="flex items-center gap-1.5">
        {favNames.map(name => (
          <span key={name}>{iconMap[name] ?? name}</span>
        ))}
      </div>
    )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[6dvh] pb-4 overflow-y-auto">
      <div
        className="bg-stone-900/75 backdrop-blur-sm rounded-2xl w-full max-w-sm
          border border-stone-700 shadow-[0_8px_32px_rgba(0,0,0,0.8)]"
      >
        {/* Header */}
        <div className="relative px-5 pt-6 pb-5 border-b border-stone-700 text-center">
          <div className="text-white text-[9px] uppercase tracking-widest mb-1">
            {isClassic ? 'Classic' : 'Free Bet Pro'}
          </div>
          <div className="text-amber-400 font-bold text-xl">Game Summary</div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center
              rounded-full text-stone-400 hover:text-white hover:bg-stone-700
              transition-colors text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <Section title="Bankroll">
          <Row label="Peak Bankroll" value={fmt(peakBankrollCents)} />
        </Section>

        <Section title="Performance">
          <Row label="Hands Played" value={stats.handsPlayed} />
          <Row label="Hands Won"    value={stats.handsWon} />
          <Row label="Hands Lost"   value={stats.handsLost} />
          <Row label="Hands Pushed" value={stats.handsPushed} />
        </Section>

        <Section title="Notable Moments">
          <Row label="Player Blackjacks" value={stats.playerBlackjacks} />
          <Row label="Dealer Blackjacks" value={stats.dealerBlackjacks} />
          <Row label="Busts"             value={stats.busts} />
          {!isClassic && <Row label="Free Splits"  value={stats.freeSplits} />}
          {!isClassic && <Row label="Free Doubles" value={stats.freeDoubles} />}
        </Section>

        <Section title="Top Round">
          <Row label="Biggest Win"  value={stats.biggestWinCents  > 0 ? fmt(stats.biggestWinCents)  : '—'} />
          <Row label="Biggest Loss" value={stats.biggestLossCents > 0 ? fmt(stats.biggestLossCents) : '—'} />
        </Section>

        <Section title="Side Bets">
          <Row label="Favorite Side Bet" value={favDisplay} />
        </Section>

        <div className="pb-5" />
      </div>
    </div>
  )
}
