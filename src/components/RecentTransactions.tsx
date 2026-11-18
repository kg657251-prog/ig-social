import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Clock, RefreshCw } from 'lucide-react';

/* ── Random transaction generator ── */

const HANDLE_PREFIXES = [
  'rohan', 'ananya', 'kiran', 'studio', 'priya', 'arjun', 'neha', 'rahul',
  'sakshi', 'dev', 'riya', 'harsh', 'sneha', 'amit', 'pooja', 'vikram',
  'simran', 'aditya', 'divya', 'manish', 'nisha', 'kunal', 'tanvi', 'varun',
  'megha', 'aarav', 'ishita', 'mohit', 'kavya', 'gaurav', 'zara', 'yash',
];

const PACK_OPTIONS = [
  { followers: '1,500', price: 129 },
  { followers: '3,000', price: 249 },
  { followers: '5,000', price: 399 },
  { followers: '10,000', price: 749 },
  { followers: '20,000', price: 1449 },
  { followers: '50,000', price: 3299 },
];

const PAYMENT_LABELS = ['UPI', 'PhonePe', 'Google Pay', 'Paytm', 'BHIM UPI'];

interface LiveTransaction {
  id: string;
  maskedHandle: string;
  packFollowers: string;
  amountInr: number;
  paymentLabel: string;
  timeAgo: string;
  status: 'Completed' | 'Delivering';
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function maskHandle(name: string): string {
  const suffix = String(randomInt(1, 99)).padStart(2, '0');
  const full = name + suffix;
  if (full.length <= 4) return `@${full}***`;
  const show = full.slice(0, 3);
  const tail = full.slice(-1);
  return `@${show}***${tail}`;
}

function generateTransaction(): LiveTransaction {
  const handle = HANDLE_PREFIXES[randomInt(0, HANDLE_PREFIXES.length - 1)];
  const pack = PACK_OPTIONS[randomInt(0, PACK_OPTIONS.length - 1)];
  const payment = PAYMENT_LABELS[randomInt(0, PAYMENT_LABELS.length - 1)];
  const mins = randomInt(1, 45);
  const status: LiveTransaction['status'] = mins <= 5 ? 'Delivering' : 'Completed';

  return {
    id: `IGS-${randomInt(100000, 999999)}`,
    maskedHandle: maskHandle(handle),
    packFollowers: pack.followers,
    amountInr: pack.price,
    paymentLabel: payment,
    timeAgo: `${mins}m ago`,
    status,
  };
}

function generateBatch(count: number): LiveTransaction[] {
  const seen = new Set<string>();
  const batch: LiveTransaction[] = [];
  while (batch.length < count) {
    const tx = generateTransaction();
    if (!seen.has(tx.maskedHandle)) {
      seen.add(tx.maskedHandle);
      batch.push(tx);
    }
  }
  return batch;
}

/* ── Component ── */

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<LiveTransaction[]>(() =>
    generateBatch(4)
  );
  const [fade, setFade] = useState(false);

  const refresh = useCallback(() => {
    setFade(true);
    setTimeout(() => {
      setTransactions(generateBatch(4));
      setFade(false);
    }, 300);
  }, []);

  // Auto-refresh every 8 seconds
  useEffect(() => {
    const interval = setInterval(refresh, 8000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <section
      id="transactions"
      aria-labelledby="transactions-heading"
      className="rounded-3xl bg-white border border-[#D4E4FA] shadow-[0_12px_32px_-20px_rgba(6,42,97,0.12)] p-4 sm:p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            id="transactions-heading"
            className="text-sm sm:text-base font-extrabold tracking-tight text-[#062A61] uppercase"
          >
            Live <span className="text-[#0058D6]">Orders</span>
          </h2>
          <p className="text-[10px] sm:text-xs text-[#5B78A3] mt-0.5">
            Real-time follower deliveries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Live</span>
        </div>
      </div>

      {/* Transaction Cards */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 transition-opacity duration-300 ${
          fade ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[#F7FAFF] border border-[#E2ECFA] hover:border-[#C0D6F5] transition-colors"
          >
            <div className="min-w-0">
              <p className="text-sm font-bold font-num text-[#062A61] truncate">
                {tx.maskedHandle}
              </p>
              <p className="text-[10px] sm:text-xs text-[#5B78A3] mt-0.5 truncate">
                {tx.packFollowers} Followers · {tx.paymentLabel} · {tx.timeAgo}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-sm font-extrabold font-num text-[#062A61] tabular-nums">
                ₹{tx.amountInr.toLocaleString('en-IN')}
              </p>
              <p
                className={`inline-flex items-center gap-1 text-[10px] font-bold mt-0.5 ${
                  tx.status === 'Completed'
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }`}
              >
                {tx.status === 'Completed' ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
                {tx.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
