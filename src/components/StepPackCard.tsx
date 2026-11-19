import { CheckCircle2, Crown, ShieldCheck, Users, Zap } from 'lucide-react';
import { FOLLOWER_PACKS, GrowthPack } from '../data/packs';

interface StepPackCardProps {
  selectedPack: GrowthPack | null;
  onSelectPack: (pack: GrowthPack) => void;
}

export function StepPackCard({
  selectedPack,
  onSelectPack,
}: StepPackCardProps) {
  return (
    <section
      id="step-2"
      aria-labelledby="step-2-heading"
      className="rounded-3xl bg-white border border-[#D4E4FA] shadow-[0_12px_32px_-20px_rgba(6,42,97,0.16)] p-4 sm:p-7"
    >
      {/* Step Header */}
      <div className="flex items-center gap-3 mb-4 sm:mb-5">
        <span className="h-8 w-8 rounded-full bg-[#0058D6] text-white text-sm font-bold font-num flex items-center justify-center shrink-0">
          2
        </span>
        <div>
          <h2
            id="step-2-heading"
            className="text-base sm:text-lg font-extrabold tracking-tight text-[#062A61] uppercase leading-tight"
          >
            Select Followers Pack
          </h2>
          <p className="text-xs text-[#5B78A3] hidden sm:block mt-0.5">
            Instant start · Non-drop guarantee · Safe delivery
          </p>
        </div>
      </div>

      {/* Pack Tiles Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1">
        {FOLLOWER_PACKS.map((pack) => {
          const isSelected = selectedPack?.id === pack.id;
          return (
            <button
              key={pack.id}
              type="button"
              onClick={() => onSelectPack(pack)}
              aria-pressed={isSelected}
              className={`relative text-center rounded-2xl p-3.5 sm:p-4 transition-all cursor-pointer border-2 flex flex-col items-center gap-2.5 min-h-[150px] sm:min-h-[170px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0068FF] group ${
                isSelected
                  ? 'bg-gradient-to-b from-[#0058D6] to-[#003DA0] text-white border-[#3B8BFF] shadow-lg shadow-[#0058D6]/25 -translate-y-0.5 scale-[1.02]'
                  : 'bg-white text-[#062A61] border-[#E2ECFA] hover:border-[#80B4F8] hover:shadow-md active:scale-[0.98]'
              }`}
            >
              {/* Popular Badge */}
              {pack.popular && (
                <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase whitespace-nowrap shadow-md flex items-center gap-1 ${
                  isSelected
                    ? 'bg-amber-400 text-amber-950'
                    : 'bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950'
                }`}>
                  <Crown className="w-3 h-3" />
                  Best Value
                </span>
              )}

              {/* Selected Checkmark */}
              {isSelected && (
                <div className="absolute top-2.5 right-2.5">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-300" />
                </div>
              )}

              {/* Follower Count — big prominent number */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <p className={`text-2xl sm:text-3xl font-black font-num tabular-nums leading-none tracking-tight ${
                  isSelected ? 'text-white' : 'text-[#062A61]'
                }`}>
                  {pack.quantity >= 1000
                    ? `${(pack.quantity / 1000).toLocaleString('en-IN')}K`
                    : pack.quantity.toLocaleString('en-IN')}
                </p>
                <p className={`text-[10px] sm:text-[11px] font-bold tracking-[0.15em] uppercase mt-1 ${
                  isSelected ? 'text-blue-200' : 'text-[#6B8BB4]'
                }`}>
                  Followers
                </p>
              </div>

              {/* Price */}
              <div className={`w-full rounded-xl py-1.5 ${
                isSelected
                  ? 'bg-white/15'
                  : 'bg-[#F0F6FF]'
              }`}>
                <p className={`text-lg sm:text-xl font-extrabold font-num tabular-nums leading-tight ${
                  isSelected ? 'text-white' : 'text-[#062A61]'
                }`}>
                  ₹{pack.priceInr.toLocaleString('en-IN')}
                </p>
                <p className={`text-[9px] sm:text-[10px] leading-tight mt-0.5 ${
                  isSelected ? 'text-blue-200' : 'text-[#7D9DC5]'
                }`}>
                  {pack.deliveryInfo.split('·')[0].trim()}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Trust Guarantee */}
      <div className="mt-4 pt-3.5 border-t border-[#E8F1FC] flex items-center justify-center gap-4 text-xs text-[#4A6E9E] flex-wrap">
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          100% Safe (No Password)
        </span>
        <span className="text-[#CBDCF5]">·</span>
        <span className="inline-flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          Refill Guarantee
        </span>
      </div>
    </section>
  );
}
