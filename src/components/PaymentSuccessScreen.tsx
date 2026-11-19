import React, { useState, useEffect } from 'react';
import { Check, Copy, ExternalLink, RotateCcw } from 'lucide-react';
import { OrderConfirmation } from '../data/packs';
import { TELEGRAM_CHANNEL_URL, TelegramIcon } from './FloatingTelegram';

interface PaymentSuccessScreenProps {
  orderConfirmation: OrderConfirmation;
  onStartNewOrder: () => void;
}

export function PaymentSuccessScreen({
  orderConfirmation,
  onStartNewOrder,
}: PaymentSuccessScreenProps) {
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [showContent, setShowContent] = useState(false);

  const { orderId, account, pack, amountPaidInr, createdAt, paymentDetail } =
    orderConfirmation;

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 400);
    return () => clearTimeout(t);
  }, []);

  const handleCopyOrderId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(orderId).catch(() => {});
    }
    setCopiedOrderId(true);
    setTimeout(() => setCopiedOrderId(false), 2000);
  };

  return (
    <section
      id="order-success-screen"
      aria-labelledby="order-success-heading"
      className="relative overflow-hidden rounded-2xl bg-[#0A1628] text-white"
    >
      {/* Top gradient accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600" />

      {/* Checkmark hero */}
      <div className="flex flex-col items-center pt-8 pb-5 px-5">
        {/* Animated check circle */}
        <div
          className="relative w-[72px] h-[72px] mb-5"
          style={{
            animation: 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
          }}
        >
          {/* Soft glow behind */}
          <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl" />
          {/* Circle */}
          <div className="relative w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Check className="w-8 h-8 text-white stroke-[3]" />
          </div>
        </div>

        <h2
          id="order-success-heading"
          className="text-xl sm:text-2xl font-bold tracking-tight text-center"
        >
          Order Confirmed
        </h2>
        <p className="text-sm text-slate-400 mt-1 text-center">
          Your followers will start delivering shortly.
        </p>
      </div>

      {/* Main content area */}
      <div
        className="px-5 pb-6 space-y-4"
        style={{
          opacity: showContent ? 1 : 0,
          transform: showContent ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 0.4s ease-out',
        }}
      >
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
