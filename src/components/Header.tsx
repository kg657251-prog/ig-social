import { TelegramIcon, TELEGRAM_CHANNEL_URL } from './FloatingTelegram';

export const BRAND_LOGO_URL =
  '/assets/aistudio/Blue_and_Cobalt_Modern_Professional_Social_Media_Agency_Logo_5c5050fa.png';

export function Header({
  telegramUrl = TELEGRAM_CHANNEL_URL,
}: {
  telegramUrl?: string;
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#DCE8F8]">
      <div className="max-w-xl mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        <a
          href="#top"
          className="flex items-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0068FF] rounded-lg"
          aria-label="IG Social Home"
        >
          <img
            src={BRAND_LOGO_URL}
            alt="IG Social"
            referrerPolicy="no-referrer"
            className="h-8 sm:h-10 w-auto object-contain"
          />
        </a>

        {/* Telegram icon in header (UPI Live & Get Followers removed) */}
        <div className="flex items-center">
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Telegram Channel"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F0F8FF] hover:bg-[#E1F0FD] border border-[#CDE5FC] text-[#0088CC] transition-all active:scale-95 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2AABEE]"
          >
            <TelegramIcon className="w-5 h-5 shrink-0" />
            <span className="text-xs font-bold text-[#007AB8]">Telegram</span>
          </a>
        </div>
      </div>
    </header>
  );
}
