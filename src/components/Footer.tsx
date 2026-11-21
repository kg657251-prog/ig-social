import { Heart, MessageCircle, Send, ShieldCheck, Zap } from 'lucide-react';
import { BRAND_LOGO_URL } from './Header';
import { TelegramIcon, TELEGRAM_CHANNEL_URL } from './FloatingTelegram';

export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-[#062A61] to-[#041B3F] text-white">
      <div className="max-w-xl mx-auto px-4 pt-10 pb-6 sm:pt-12 sm:pb-8">
        {/* Brand + Tagline */}
        <div className="flex flex-col items-center text-center space-y-3 pb-7 border-b border-white/10">
          <a
            href="#top"
            className="inline-flex items-center bg-white rounded-2xl px-4 py-2.5 shadow-lg shadow-white/10 hover:shadow-white/20 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="IG Social Top"
          >
            <img
              src={BRAND_LOGO_URL}
              alt="IG Social"
              referrerPolicy="no-referrer"
              className="h-9 sm:h-10 w-auto object-contain"
            />
          </a>
          <p className="text-sm text-[#A5C5F2] leading-relaxed max-w-sm">
            India's most trusted Instagram followers service. Instant delivery, real results, zero risk.
          </p>

          {/* Quick Telegram CTA */}
          <a
            href={TELEGRAM_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0088CC] hover:bg-[#0099DD] text-white text-xs font-bold shadow-md shadow-[#0088CC]/30 transition-all active:scale-95"
          >
            <TelegramIcon className="w-4 h-4" />
            Contact Us on Telegram
            <Send className="w-3 h-3" />
          </a>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-3 gap-3 py-6 border-b border-white/10">
          <div className="text-center space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <p className="text-[11px] font-bold text-white">No Password</p>
            <p className="text-[10px] text-[#8BAAD0]">100% Safe & Secure</p>
          </div>
          <div className="text-center space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/20 flex items-center justify-center mx-auto">
              <Zap className="w-4.5 h-4.5 text-amber-400" />
            </div>
            <p className="text-[11px] font-bold text-white">Instant Start</p>
            <p className="text-[10px] text-[#8BAAD0]">Within 5-10 Mins</p>
          </div>
          <div className="text-center space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center mx-auto">
              <Heart className="w-4.5 h-4.5 text-blue-400" />
            </div>
            <p className="text-[11px] font-bold text-white">Non-Drop</p>
            <p className="text-[10px] text-[#8BAAD0]">100% Lifetime Guarantee</p>
          </div>
        </div>

        {/* Payment + Guarantee Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-5 border-b border-white/10">
          <div className="text-center sm:left">
            <p className="text-xs font-bold text-white">Accepted Payments</p>
            <p className="text-[10px] text-[#8BAAD0] mt-0.5">
              PhonePe · Google Pay · Paytm · BHIM UPI
            </p>
          </div>
          {/* Payment icons row */}
          <div className="flex items-center gap-2.5">
            {[
              { src: '/assets/payment/phonepe.png', alt: 'PhonePe' },
              { src: '/assets/payment/gpay.png', alt: 'GPay' },
              { src: '/assets/payment/paytm.png', alt: 'Paytm' },
              { src: '/assets/payment/upi.png', alt: 'UPI' },
            ].map((icon) => (
              <div
                key={icon.alt}
                className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center p-1.5"
              >
                <img
                  src={icon.src}
                  alt={icon.alt}
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-5 flex flex-col items-center gap-1.5 text-center">
          <p className="text-[11px] text-[#7A9FC9]">
            &copy; {new Date().getFullYear()} IG Social. All rights reserved.
          </p>
          <p className="text-[10px] text-[#5F86AD]">
            Not affiliated with Instagram or Meta.
          </p>
        </div>
      </div>
    </footer>
  );
}
