import React, { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { OrderConfirmation } from '../data/packs';
import { TelegramIcon, TELEGRAM_CHANNEL_URL } from './FloatingTelegram';

interface PaymentSuccessScreenProps {
  orderConfirmation: OrderConfirmation;
  onStartNewOrder: () => void;
}

export function PaymentSuccessScreen({
  orderConfirmation,
  onStartNewOrder,
}: PaymentSuccessScreenProps) {
  const [copiedOrderId, setCopiedOrderId] = useState(false);

  const {
    orderId,
    account,
    pack,
    paymentDetail,
    amountPaidInr,
    createdAt,
  } = orderConfirmation;

  const handleCopyOrderId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(orderId).catch(() => {});
    }
    setCopiedOrderId(true);
    setTimeout(() => setCopiedOrderId(false), 2000);
  };

  return (
    <section
      aria-label="Order Placed Successfully"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0A1628] via-[#0D223D] to-[#0A1628] text-white p-5 sm:p-8 border border-[#1A3A6A] shadow-2xl"
    >
      {/* Background accents */}
      <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-md mx-auto space-y-6">
        {/* Success header */}
        <div className="text-center space-y-2 pt-2">
          {/* Animated checkmark icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white shadow-lg shadow-emerald-500/30 mb-2 animate-[scaleIn_0.4s_ease-out]">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            PAYMENT CONFIRMED · VERIFIED
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Order Placed Successfully!
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Followers will start delivering to your account shortly.
          </p>
        </div>

        {/* Order ID */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">
              Order
            </span>
            <code className="text-xs font-mono text-slate-300 truncate">
              {orderId}
            </code>
          </div>
          <button
            type="button"
            onClick={handleCopyOrderId}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-400 hover:text-white text-[11px] font-medium cursor-pointer transition-colors shrink-0 active:scale-95"
          >
            {copiedOrderId ? (
              <>
                <Check className="w-3 h-3 text-green-400" />
                <span className="text-green-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Account card */}
        <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          {/* Avatar */}
          <div className="shrink-0">
            {account.profilePicUrl ? (
              <img
                src={account.profilePicUrl}
                alt={account.username}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-500/40"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                  (e.currentTarget.nextElementSibling as HTMLElement | null)?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div
              className={`w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center font-bold text-sm text-white uppercase ring-2 ring-blue-500/40 ${account.profilePicUrl ? 'hidden' : ''}`}
            >
              {account.username.slice(0, 2)}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">
              @{account.username}
            </p>
            {account.fullName && (
              <p className="text-xs text-slate-400 truncate">{account.fullName}</p>
            )}
          </div>
        </div>

        {/* Followers count — prominent */}
        <div className="text-center py-5 px-4 rounded-xl bg-gradient-to-b from-blue-600/10 to-transparent border border-blue-500/20">
          <p className="text-4xl sm:text-5xl font-black tabular-nums text-white tracking-tight">
            +{pack.quantity.toLocaleString('en-IN')}
          </p>
          <p className="text-sm font-semibold text-blue-400 uppercase tracking-wider mt-1">
            Followers
          </p>
          <p className="text-xs text-slate-500 mt-1.5">
            {pack.name} · {pack.deliveryInfo || 'Starts in 5–15 min'}
          </p>
        </div>

        {/* Receipt details */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] divide-y divide-white/[0.06] text-sm">
          <div className="flex justify-between items-center px-4 py-2.5">
            <span className="text-slate-500">Paid</span>
            <span className="font-semibold text-white tabular-nums">
              ₹{amountPaidInr.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between items-center px-4 py-2.5">
            <span className="text-slate-500">Guarantee</span>
            <span className="text-emerald-400 font-medium text-xs">
              100% Lifetime Non-Drop &amp; Money-Back
            </span>
          </div>
          <div className="flex justify-between items-center px-4 py-2.5">
            <span className="text-slate-500">Via</span>
            <span className="text-slate-300">
              {paymentDetail || 'Pay0 UPI Gateway'}
            </span>
          </div>
          <div className="flex justify-between items-center px-4 py-2.5">
            <span className="text-slate-500">Time</span>
            <span className="text-slate-300">{createdAt || 'Just now'}</span>
          </div>
        </div>

        {/* Telegram CTA */}
        <a
          href={TELEGRAM_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl bg-[#229ED9] hover:bg-[#1b8fc4] active:scale-[0.99] text-white font-semibold text-sm transition-all cursor-pointer shadow-lg shadow-[#229ED9]/25"
        >
          <TelegramIcon className="w-5 h-5" />
          <span>Track on Telegram</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
        </a>

        {/* New order */}
        <button
          type="button"
          onClick={onStartNewOrder}
          className="w-full py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] active:scale-[0.99] text-slate-400 hover:text-white font-medium text-sm border border-white/[0.06] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Place Another Order</span>
        </button>
      </div>

      {/* Keyframe for the check icon entrance */}
      <style>{`
        @keyframes scaleIn {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </section>
  );
}
