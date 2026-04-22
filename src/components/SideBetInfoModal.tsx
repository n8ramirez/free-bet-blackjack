import { useState } from 'react'
import { POG_PAYOUTS, PUSH22_PAYOUT, HELLRAISER_PAYOUTS } from '../hooks/useGameState'
import { PotOfGoldIcon, Push22Icon, HellraiserIcon } from './SideBetPanel'

type Tab = 'pot-of-gold' | 'push-22' | 'hellraiser'

type Props = { onClose: () => void }

export function SideBetInfoModal({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('pot-of-gold')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="bg-stone-900/75 backdrop-blur-sm rounded-2xl w-full max-w-sm max-h-[80dvh] overflow-y-auto
          border border-stone-700 shadow-[0_8px_32px_rgba(0,0,0,0.8)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-700">
          <div>
            <div className="text-white text-[9px] uppercase tracking-widest">Side Bets</div>
            <div className="text-amber-400 font-bold text-base">Rules &amp; Payouts</div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white text-xl leading-none px-2"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-700">
          <button
            onClick={() => setTab('pot-of-gold')}
            className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors
              ${tab === 'pot-of-gold'
                ? 'text-amber-400 border-b-2 border-amber-400 -mb-px'
                : 'text-stone-500 hover:text-stone-300'}`}
          >
            Pot of Gold
          </button>
          <button
            onClick={() => setTab('push-22')}
            className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors
              ${tab === 'push-22'
                ? 'text-sky-400 border-b-2 border-sky-400 -mb-px'
                : 'text-stone-500 hover:text-stone-300'}`}
          >
            Push 22
          </button>
          <button
            onClick={() => setTab('hellraiser')}
            className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors
              ${tab === 'hellraiser'
                ? 'text-orange-400 border-b-2 border-orange-400 -mb-px'
                : 'text-stone-500 hover:text-stone-300'}`}
          >
            Hellraiser
          </button>
        </div>

        {/* Content — height locked to PotOfGold via invisible spacer */}
        <div className="relative">
          <div className="invisible pointer-events-none px-5 py-4" aria-hidden>
            <PotOfGoldInfo />
          </div>
          <div className="absolute inset-0 px-5 py-4">
            {tab === 'pot-of-gold' && <PotOfGoldInfo />}
            {tab === 'push-22'     && <Push22Info />}
            {tab === 'hellraiser'  && <HellraiserInfo />}
          </div>
        </div>
      </div>
    </div>
  )
}

function PotOfGoldInfo() {
  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="flex items-center gap-2">
        <PotOfGoldIcon className="w-8 h-8 flex-shrink-0" />
        <p className="text-stone-300">
          Earn <span className="text-amber-400 font-semibold">gold lammers</span> by triggering free bets during the hand.
          The more lammers you collect, the bigger the payout.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-amber-400 border-2 border-yellow-200
          shadow-[0_2px_6px_rgba(0,0,0,0.5)] flex items-center justify-center flex-shrink-0">
          <span className="text-[8px] font-black text-amber-950 leading-none tracking-wide">FREE</span>
        </div>
        <p className="text-stone-300">
          A lammer appears on your hand each time a free bet is triggered. Collect as many as possible!
        </p>
      </div>

      <Section title="How to earn lammers">
        <Rule>Each <span className="text-amber-400 font-semibold">Free Split</span> taken awards 1 lammer.</Rule>
        <Rule>Each <span className="text-amber-400 font-semibold">Free Double</span> taken awards 1 lammer.</Rule>
        <Rule>Gold lammers accumulate across all hands in the round.</Rule>
      </Section>

      <Section title="Payout table">
        <div className="mt-1 rounded-xl overflow-hidden border border-stone-700">
          <div className="grid grid-cols-2 bg-stone-800 px-3 py-1.5">
            <span className="text-stone-500 text-[9px] uppercase tracking-widest">Lammers</span>
            <span className="text-stone-500 text-[9px] uppercase tracking-widest text-right">Pays</span>
          </div>
          {Object.entries(POG_PAYOUTS).map(([pucks, mult], i) => (
            <div key={pucks} className={`grid grid-cols-2 px-3 py-2 ${i % 2 === 0 ? 'bg-stone-900' : 'bg-stone-800/50'}`}>
              <span className="text-amber-400 font-bold">{pucks}</span>
              <span className="text-stone-200 font-semibold text-right">{mult} : 1</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Losing conditions">
        <Rule>No gold lammers collected — wager is lost.</Rule>
        <Rule>Dealer blackjack — All Pot of Gold wagers lose to a dealer blackjack.</Rule>
      </Section>
    </div>
  )
}

function Push22Info() {
  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="flex items-center gap-2">
        <Push22Icon className="w-8 h-8 flex-shrink-0" />
        <p className="text-stone-300">
          Bet on the dealer busting with exactly <span className="text-sky-400 font-semibold">22</span>.
          If the dealer's final total is 22, you win — regardless of your main hand result.
        </p>
      </div>

      <Section title="Payout table">
        <div className="mt-1 rounded-xl overflow-hidden border border-stone-700">
          <div className="grid grid-cols-2 bg-stone-800 px-3 py-1.5">
            <span className="text-stone-500 text-[9px] uppercase tracking-widest">Dealer Total</span>
            <span className="text-stone-500 text-[9px] uppercase tracking-widest text-right">Pays</span>
          </div>
          <div className="grid grid-cols-2 px-3 py-2 bg-stone-900">
            <span className="text-sky-400 font-bold">22</span>
            <span className="text-stone-200 font-semibold text-right">{PUSH22_PAYOUT} : 1</span>
          </div>
          <div className="grid grid-cols-2 px-3 py-2 bg-stone-800/50">
            <span className="text-stone-400 font-bold">All others</span>
            <span className="text-stone-400 font-semibold text-right">Lose</span>
          </div>
        </div>
      </Section>

      <Section title="Winning conditions">
        <Rule>Dealer's final total is exactly <span className="text-sky-400 font-semibold">22</span> — side bet pays {PUSH22_PAYOUT} to 1.</Rule>
        <Rule>Pays out even if your main hand busted and dealer finishes with 22.</Rule>
        <Rule>Pays out even if your main hand is blackjack and dealer finishes with 22.</Rule>
      </Section>

      <Section title="Losing conditions">
        <Rule>Dealer finishes with any total other than exactly <span className="text-sky-400 font-semibold">22</span>.</Rule>
        <Rule>Dealer blackjack (21) — side bet loses.</Rule>
        <Rule>Dealer busts with 23 or more — side bet loses.</Rule>
      </Section>
    </div>
  )
}

function HellraiserInfo() {
  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="flex items-center gap-2">
        <HellraiserIcon className="w-8 h-8 flex-shrink-0" />
        <p className="text-stone-300">
          Based on your first two cards and the dealer's <span className="text-orange-400 font-semibold">face-up card</span>.
          The best 3-card combination wins — result is revealed immediately after the deal.
        </p>
      </div>

      <Section title="Payout table">
        <div className="mt-1 rounded-xl overflow-hidden border border-stone-700">
          <div className="grid grid-cols-2 bg-stone-800 px-3 py-1.5">
            <span className="text-stone-500 text-[9px] uppercase tracking-widest">Hand</span>
            <span className="text-stone-500 text-[9px] uppercase tracking-widest text-right">Pays</span>
          </div>
          {HELLRAISER_PAYOUTS.map(([name, mult], i) => (
            <div key={name} className={`grid grid-cols-2 px-3 py-2 ${i % 2 === 0 ? 'bg-stone-900' : 'bg-stone-800/50'}`}>
              <span className="text-orange-400 font-bold text-xs">{name}</span>
              <span className="text-stone-200 font-semibold text-right">{mult} : 1</span>
            </div>
          ))}
          <div className={`grid grid-cols-2 px-3 py-2 ${HELLRAISER_PAYOUTS.length % 2 === 0 ? 'bg-stone-900' : 'bg-stone-800/50'}`}>
            <span className="text-stone-400 font-bold text-xs">All others</span>
            <span className="text-stone-400 font-semibold text-right">Lose</span>
          </div>
        </div>
      </Section>

      <Section title="How it works">
        <Rule>Only the <span className="text-orange-400 font-semibold">best qualifying hand</span> pays — e.g. Three of a Kind Suited pays instead of Three of a Kind.</Rule>
        <Rule>Ace counts both <span className="text-orange-400 font-semibold">high and low</span> for straights (A-K-Q and A-2-3).</Rule>
        <Rule>Result is shown immediately after the deal, before you act.</Rule>
        <Rule>Pays out even if the dealer has blackjack.</Rule>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-stone-400 text-[10px] uppercase tracking-widest mb-1.5">{title}</div>
      <ul className="flex flex-col gap-1">{children}</ul>
    </div>
  )
}

function Rule({ children }: { children: React.ReactNode }) {
  return (
    <li className="text-stone-300 flex gap-2">
      <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>
      <span>{children}</span>
    </li>
  )
}
