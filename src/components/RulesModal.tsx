
type Props = { onClose: () => void }

export function RulesModal({ onClose }: Props) {
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
            <div className="text-white text-[9px] uppercase tracking-widest">How to play</div>
            <div className="text-amber-400 font-bold text-base">Free Bet Blackjack</div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white text-xl leading-none px-2"
          >
            ✕
          </button>
        </div>

        {/* Rules */}
        <div className="px-5 py-4 flex flex-col gap-4 text-sm">

          <Section title="The Basics">
            <Rule>Standard blackjack — get closer to 21 than the dealer without going over.</Rule>
            <Rule>Dealer hits on soft 17.</Rule>
            <Rule>6-deck shoe.</Rule>
          </Section>

          <Section title="Free Bets">
            <Rule>
              <span className="text-amber-400 font-semibold">Free Double</span> — doubling on a hard
              9, 10, or 11 costs you nothing. The extra wager is on the house.
            </Rule>
            <Rule>
              <span className="text-amber-400 font-semibold">Free Split</span> — splitting any pair
              except 10-value cards (10, J, Q, K) is free. Splitting 10-value pairs costs the
              original bet.
            </Rule>
            <Rule>Split aces receive one card each and cannot be resplit.</Rule>
          </Section>

          <Section title="Dealer 22 Rule">
            <Rule>
              If the dealer busts with exactly 22, all non-busted player hands push — except a
              player blackjack, which still wins.
            </Rule>
          </Section>

          <Section title="Payouts">
            <Rule>Blackjack pays <span className="text-amber-400 font-semibold">3 to 2</span>.</Rule>
            <Rule>Player blackjack always wins, even if the dealer also has blackjack.</Rule>
            <Rule>Blackjack on a split hand pays <span className="text-amber-400 font-semibold">1 to 1</span>.</Rule>
            <Rule>All other wins pay 1 to 1.</Rule>
          </Section>

          <Section title="No Surrender / No Insurance" />

        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children?: React.ReactNode }) {
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
