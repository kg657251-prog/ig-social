import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface PurchaseNotification {
  username: string;
  followers: string;
}

const NOTIFICATIONS: PurchaseNotification[] = [
  { username: '@ro***47', followers: '3,000' },
  { username: '@an***sh', followers: '5,000' },
  { username: '@vi***89', followers: '1,500' },
  { username: '@pr***tik', followers: '10,000' },
  { username: '@ka***ya', followers: '3,000' },
  { username: '@am***01', followers: '5,000' },
  { username: '@sa***92', followers: '1,500' },
  { username: '@ar***77', followers: '20,000' },
  { username: '@ni***08', followers: '3,000' },
  { username: '@sh***12', followers: '5,000' },
  { username: '@de***45', followers: '50,000' },
  { username: '@me***19', followers: '10,000' },
];

export function RecentPurchasePopup() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isDismissed) return;
    const t = setTimeout(() => setIsVisible(true), 2500);
    return () => clearTimeout(t);
  }, [isDismissed]);

  useEffect(() => {
    if (isDismissed) return;
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % NOTIFICATIONS.length);
        setIsVisible(true);
      }, 2000);
    }, 6000);
    return () => clearInterval(interval);
  }, [isDismissed]);

  if (isDismissed) return null;

  const current = NOTIFICATIONS[currentIndex];

  return (
    <div
      aria-live="polite"
      className={`fixed bottom-4 left-3 z-40 transition-all duration-400 ease-out transform ${
        isVisible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-3 opacity-0 pointer-events-none'
      }`}
    >
      <div className="relative flex items-center gap-2 px-3 py-2 bg-white/95 backdrop-blur-md border border-[#DCE8F8] rounded-xl shadow-lg text-xs">
        <p className="text-[#062A61] font-medium pr-4">
          <span className="font-bold font-num text-[#0058D6]">{current.username}</span>{' '}
          bought <span className="font-bold">{current.followers}</span> followers ✅
        </p>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          aria-label="Close"
          className="absolute top-1 right-1 text-[#9BB5D6] hover:text-[#062A61] p-0.5 cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
