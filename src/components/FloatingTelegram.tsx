export function TelegramIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z" />
    </svg>
  );
}

export const TELEGRAM_CHANNEL_URL = 'https://t.me/+tIsLon2lWJQyYjA9';

export function FloatingTelegram({
  telegramUrl = TELEGRAM_CHANNEL_URL,
}: {
  telegramUrl?: string;
}) {
  return (
    <aside
      aria-label="Telegram support"
      className="fixed bottom-5 right-5 z-50 flex items-center group"
    >
      {/* Tooltip on hover for desktop */}
      <span className="hidden sm:inline-block mr-2 px-3 py-1.5 rounded-full bg-[#062A61] text-white text-xs font-semibold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        Join on Telegram
      </span>

      {/* Floating Button */}
      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact us on Telegram"
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-[#229ED9] to-[#2AABEE] text-white shadow-[0_8px_24px_rgba(42,171,238,0.45)] hover:shadow-[0_12px_28px_rgba(42,171,238,0.6)] hover:scale-108 active:scale-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2AABEE]/40"
      >
        {/* Subtle glowing ring animation */}
        <span className="absolute inset-0 rounded-full bg-[#2AABEE] opacity-30 animate-ping -z-10" />

        <TelegramIcon className="w-8 h-8 drop-shadow-sm" />
      </a>
    </aside>
  );
}
