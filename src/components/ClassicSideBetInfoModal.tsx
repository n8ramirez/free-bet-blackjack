import { useState } from 'react'
import { LADY_LUCK_PAYOUTS, BUSTER_BLACKJACK_PAYOUTS } from '../hooks/useClassicGameState'
import { LadyLuckIcon, BusterBlackjackIcon } from './ClassicSideBetPanel'

type Props = { onClose: () => void }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-stone-500 text-[9px] uppercase tracking-widest">{title}</div>
      {children}
    </div>
  )
}

function Rule({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-stone-400 text-xs leading-relaxed">
      <span className="text-stone-600 mt-0.5">›</span>
      <span>{children}</span>
    </div>
  )
}

export function ClassicSideBetInfoModal({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'lady-luck' | 'buster-blackjack'>('lady-luck')

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

        {/* Tab bar */}
        <div className="flex border-b border-stone-700">
          <button
            onClick={() => setActiveTab('lady-luck')}
            className={`flex-1 py-2.5 text-center text-[10px] uppercase tracking-widest font-extrabold transition-colors
              ${activeTab === 'lady-luck'
                ? 'text-pink-400 border-b-2 border-pink-400 -mb-px'
                : 'text-stone-500 hover:text-stone-300'}`}
          >
            Lady Luck
          </button>
          <button
            onClick={() => setActiveTab('buster-blackjack')}
            className={`flex-1 py-2.5 text-center text-[10px] uppercase tracking-widest font-extrabold transition-colors
              ${activeTab === 'buster-blackjack'
                ? 'text-blue-400 border-b-2 border-blue-400 -mb-px'
                : 'text-stone-500 hover:text-stone-300'}`}
          >
            Buster BJ
          </button>
        </div>

        {/* Lady Luck content */}
        {activeTab === 'lady-luck' && (
          <div className="flex flex-col gap-4 text-sm p-5">
            <div className="flex items-center gap-2">
              <LadyLuckIcon className="w-8 h-8 flex-shrink-0" />
              <p className="text-stone-300">
                Based on your first two cards. Wins pay on any total of{' '}
                <span className="text-pink-400 font-semibold">20</span>, with bonuses for
                Queens of Hearts and suited/matched hands.
              </p>
            </div>

            <Section title="Payout table">
              <div className="mt-1 rounded-xl overflow-hidden border border-stone-700">
                <div className="grid grid-cols-2 bg-stone-800 px-3 py-1.5">
                  <span className="text-stone-500 text-[9px] uppercase tracking-widest">Hand</span>
                  <span className="text-stone-500 text-[9px] uppercase tracking-widest text-right">Pays</span>
                </div>
                {LADY_LUCK_PAYOUTS.map(([name, mult], i) => (
                  <div key={name} className={`grid grid-cols-2 px-3 py-2 ${i % 2 === 0 ? 'bg-stone-900' : 'bg-stone-800/50'}`}>
                    <span className="text-pink-400 font-bold text-xs">{name}</span>
                    <span className="text-stone-200 font-semibold text-right">{mult} : 1</span>
                  </div>
                ))}
                <div className={`grid grid-cols-2 px-3 py-2 ${LADY_LUCK_PAYOUTS.length % 2 === 0 ? 'bg-stone-900' : 'bg-stone-800/50'}`}>
                  <span className="text-stone-400 font-bold text-xs">All others</span>
                  <span className="text-stone-400 font-semibold text-right">Lose</span>
                </div>
              </div>
            </Section>

            <Section title="How it works">
              <Rule>Resolved immediately after the deal — before you act on your hand.</Rule>
              <Rule><span className="text-pink-400 font-semibold">Matched 20</span> = same rank <em>and</em> same suit (e.g. Q♠ Q♠).</Rule>
              <Rule><span className="text-pink-400 font-semibold">Suited 20</span> = same suit, any ranks totalling 20.</Rule>
              <Rule>The <span className="text-pink-400 font-semibold">1000:1</span> bonus requires both Queens of Hearts <em>and</em> dealer blackjack.</Rule>
              <Rule>Pays out even if you bust or the dealer wins the main hand.</Rule>
            </Section>
          </div>
        )}

        {/* Buster Blackjack content */}
        {activeTab === 'buster-blackjack' && (
          <div className="flex flex-col gap-4 text-sm p-5">
            <div className="flex items-center gap-2">
              <BusterBlackjackIcon className="w-8 h-8 flex-shrink-0" />
              <p className="text-stone-300">
                Wins when the <span className="text-blue-400 font-semibold">dealer busts</span>.
                The more cards the dealer takes to bust, the bigger the payout.
              </p>
            </div>

            <Section title="Payout table">
              <div className="mt-1 rounded-xl overflow-hidden border border-stone-700">
                <div className="grid grid-cols-2 bg-stone-800 px-3 py-1.5">
                  <span className="text-stone-500 text-[9px] uppercase tracking-widest">Dealer Bust</span>
                  <span className="text-stone-500 text-[9px] uppercase tracking-widest text-right">Pays</span>
                </div>
                {BUSTER_BLACKJACK_PAYOUTS.map(([name, mult], i) => (
                  <div key={name} className={`grid grid-cols-2 px-3 py-2 ${i % 2 === 0 ? 'bg-stone-900' : 'bg-stone-800/50'}`}>
                    <span className="text-blue-400 font-bold text-xs">{name}</span>
                    <span className="text-stone-200 font-semibold text-right">{mult} : 1</span>
                  </div>
                ))}
                <div className={`grid grid-cols-2 px-3 py-2 ${BUSTER_BLACKJACK_PAYOUTS.length % 2 === 0 ? 'bg-stone-900' : 'bg-stone-800/50'}`}>
                  <span className="text-stone-400 font-bold text-xs">Dealer doesn't bust</span>
                  <span className="text-stone-400 font-semibold text-right">Lose</span>
                </div>
              </div>
            </Section>

            <Section title="How it works">
              <Rule>The dealer always plays out their hand — even if all players bust.</Rule>
              <Rule>Wins whenever the dealer goes over 21, regardless of your hand result.</Rule>
              <Rule><span className="text-blue-400 font-semibold">Player Blackjack</span> bonus tiers apply only if your original hand is blackjack.</Rule>
              <Rule>Dealer busting with more cards = bigger payout.</Rule>
            </Section>
          </div>
        )}
      </div>
    </div>
  )
}
