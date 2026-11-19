import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Loader2,
  QrCode,
  ShieldCheck,
  Smartphone,
  Zap,
} from 'lucide-react';
import {
  FOLLOWER_PACKS,
  GrowthPack,
  OrderConfirmation,
  PaymentMethodId,
  VerifiedAccount,
} from '../data/packs';
import { PaymentSuccessScreen } from './PaymentSuccessScreen';

interface StepPaymentCardProps {
  verifiedAccount: VerifiedAccount | null;
  selectedPack: GrowthPack | null;
  onFocusVerify: () => void;
  onOrderComplete: (confirmation: OrderConfirmation) => void;
  orderConfirmation: OrderConfirmation | null;
  onStartNewOrder: () => void;
}

const UPI_APPS = ['PhonePe', 'Google Pay', 'Paytm', 'BHIM / Any UPI'] as const;

function UpiQrMatrix() {
  const cells = [
    1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1,
    1,0,0,0,0,0,1,0,0,1,0,1,1,0,0,0,0,0,1,
    1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1,
    1,0,1,1,1,0,1,0,1,0,0,1,1,0,1,1,1,0,1,
    1,0,1,1,1,0,1,0,0,1,1,0,1,0,1,1,1,0,1,
    1,0,0,0,0,0,1,0,1,0,1,1,1,0,0,0,0,0,1,
    1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1,
    0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,
    1,1,0,1,1,0,1,1,0,1,1,0,1,0,1,1,0,1,1,
    0,1,1,0,0,1,0,1,1,0,0,1,0,1,0,0,1,0,1,
    1,0,1,1,0,1,1,0,1,1,0,1,1,1,0,1,1,1,0,
    0,0,0,0,0,0,0,0,1,0,1,0,1,0,1,0,0,1,1,
    1,1,1,1,1,1,1,0,0,1,1,1,0,1,1,0,1,0,1,
    1,0,0,0,0,0,1,0,1,0,0,1,1,0,0,1,0,1,0,
    1,0,1,1,1,0,1,0,1,1,0,0,1,1,0,1,1,0,1,
    1,0,1,1,1,0,1,0,0,1,1,1,0,0,1,0,1,1,0,
    1,0,1,1,1,0,1,0,1,0,0,1,1,1,0,1,0,0,1,
    1,0,0,0,0,0,1,0,1,1,0,0,0,1,1,0,1,1,0,
    1,1,1,1,1,1,1,0,0,1,1,0,1,0,1,1,0,1,1,
  ];
  return (
    <svg
      viewBox="0 0 19 19"
      className="w-28 h-28 text-[#062A61]"
      aria-label="UPI Payment QR"
      role="img"
    >
      <rect width="19" height="19" fill="#FFFFFF" />
      {cells.map((filled, idx) => {
        if (!filled) return null;
        return (
          <rect
            key={idx}
            x={idx % 19}
            y={Math.floor(idx / 19)}
            width="0.92"
            height="0.92"
            rx="0.12"
            fill="currentColor"
          />
        );
      })}
    </svg>
  );
}

export function StepPaymentCard({
  verifiedAccount,
  selectedPack,
  onFocusVerify,
  onOrderComplete,
  orderConfirmation,
  onStartNewOrder,
}: StepPaymentCardProps) {
  const selectedMethod: PaymentMethodId = 'upi';
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  const [selectedUpiApp, setSelectedUpiApp] = useState<string>(UPI_APPS[0]);
  const [upiMode, setUpiMode] = useState<'qr' | 'id'>('qr');
  const [utrInput, setUtrInput] = useState('');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const merchantUpiId = 'igsocial@okaxis';

  // Helper: given an orderId and optional stored data, check status and trigger success
  const resolveOrderSuccess = React.useCallback(
    (checkOrderId: string, storedOrder: any, orderData: any) => {
      const matchedPack =
        storedOrder?.pack ||
        FOLLOWER_PACKS.find(
          (p) =>
            p.id === orderData.packId ||
            p.quantity === orderData.quantity
        ) || {
          id: orderData.packId || 'fol-custom',
          name: `${(orderData.quantity || 1500).toLocaleString('en-IN')} Followers`,
          quantity: orderData.quantity || 1500,
          unitLabel: 'FOLLOWERS',
          priceInr:
            orderData.amountPaid || orderData.amount || 129,
          deliveryInfo: 'Starts in 10 mins · 30-day refill',
        };

      const resolvedAccount: VerifiedAccount =
        storedOrder?.account || {
          id: null,
          username: orderData.username || 'instagram_user',
          fullName:
            orderData.fullName ||
            orderData.username ||
            'Instagram Customer',
          profileUrl: `https://www.instagram.com/${orderData.username || 'user'}/`,
          profilePicUrl: orderData.profilePicUrl || null,
          bio: null,
          followersCount: null,
          followingCount: null,
          postsCount: null,
          isPrivate: false,
          isVerified: true,
          externalUrl: null,
          categoryName: null,
          lookupMode: 'live' as const,
          verifiedAt: 'Just now',
        };

      onOrderComplete({
        orderId: checkOrderId,
        account: resolvedAccount,
        pack: matchedPack,
        paymentMethod: 'upi',
        paymentDetail: `Pay0 UPI Gateway (${orderData.utr || orderData.gatewayTransactionId || 'Auto-Verified'})${orderData.smmOrderId ? ` · SMM #${orderData.smmOrderId}` : ''}`,
        amountPaidInr:
          orderData.amountPaid ||
          orderData.amount ||
          storedOrder?.amountPaidInr ||
          matchedPack.priceInr,
        createdAt: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });

      sessionStorage.removeItem('last_pay0_order');
      sessionStorage.removeItem('last_divinepay_order');
      sessionStorage.removeItem('last_payment_order');
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    },
    [onOrderComplete]
  );

  // Check if returning from Pay0 payment callback or URL param — with polling
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlOrderId =
      searchParams.get('order_id') ||
      searchParams.get('orderId') ||
      searchParams.get('order_no');

    const storedOrderRaw =
      sessionStorage.getItem('last_pay0_order') ||
      sessionStorage.getItem('last_divinepay_order') ||
      sessionStorage.getItem('last_payment_order');

    let storedOrder: any = null;
    try {
      storedOrder = storedOrderRaw ? JSON.parse(storedOrderRaw) : null;
    } catch {}

    const checkOrderId = urlOrderId || storedOrder?.orderId;
    if (!checkOrderId) return;

    let cancelled = false;
    let pollCount = 0;
    const MAX_POLLS = 30; // poll for up to ~60 seconds

    const pollStatus = () => {
      if (cancelled || pollCount >= MAX_POLLS) return;
      pollCount++;

      fetch(`/api/order-status/${encodeURIComponent(checkOrderId)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (cancelled) return;
          if (data?.ok && data.order) {
            const status = String(data.order.status || '').toLowerCase();
            if (['paid', 'completed', 'success', '1'].includes(status)) {
              resolveOrderSuccess(checkOrderId, storedOrder, data.order);
              return; // stop polling
            }
          }
          // Still pending — poll again in 2 seconds
          if (!cancelled && pollCount < MAX_POLLS) {
            setTimeout(pollStatus, 2000);
          }
        })
        .catch(() => {
          // Network error — retry in 3 seconds
          if (!cancelled && pollCount < MAX_POLLS) {
            setTimeout(pollStatus, 3000);
          }
        });
    };

    // Start first check immediately
    pollStatus();

    return () => {
      cancelled = true;
    };
  }, [onOrderComplete, resolveOrderSuccess]);

  // Poll while user is on Pay0 page (isCreatingPayment=true means we redirected)
  useEffect(() => {
    if (!isCreatingPayment) return;

    const storedOrderRaw = sessionStorage.getItem('last_pay0_order');
    let storedOrder: any = null;
    try {
      storedOrder = storedOrderRaw ? JSON.parse(storedOrderRaw) : null;
    } catch {}

    const orderId = storedOrder?.orderId;
    if (!orderId) return;

    let cancelled = false;
    let pollCount = 0;
    const MAX_POLLS = 90; // poll for up to ~3 minutes while user pays

    const pollWhileAway = () => {
      if (cancelled || pollCount >= MAX_POLLS) return;
      pollCount++;

      fetch(`/api/order-status/${encodeURIComponent(orderId)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (cancelled) return;
          if (data?.ok && data.order) {
            const status = String(data.order.status || '').toLowerCase();
            if (['paid', 'completed', 'success', '1'].includes(status)) {
              setIsCreatingPayment(false);
              resolveOrderSuccess(orderId, storedOrder, data.order);
              return;
            }
          }
          if (!cancelled && pollCount < MAX_POLLS) {
            setTimeout(pollWhileAway, 2000);
          }
        })
        .catch(() => {
          if (!cancelled && pollCount < MAX_POLLS) {
            setTimeout(pollWhileAway, 3000);
          }
        });
    };

    // Wait 5s before first poll (give user time to pay)
    const startTimer = setTimeout(pollWhileAway, 5000);

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
    };
  }, [isCreatingPayment, onOrderComplete, resolveOrderSuccess]);

  const handleCopyUpi = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(merchantUpiId).catch(() => {});
    }
    setCopiedUpi(true);
    window.setTimeout(() => setCopiedUpi(false), 1800);
  };

  const handleContinueClick = async () => {
    setErrorMessage(null);
    if (!verifiedAccount || !verifiedAccount.profilePicUrl) {
      setErrorMessage(
        'Please enter and verify a valid Instagram username with a profile picture in Step 1 first.'
      );
      onFocusVerify();
      return;
    }
    if (verifiedAccount.isPrivate) {
      setErrorMessage(
        'Your Instagram account is Private. Followers can only be delivered to Public accounts. Please switch your account to Public in Instagram first.'
      );
      onFocusVerify();
      return;
    }
    if (!selectedPack) {
      setErrorMessage('Please select a followers pack in Step 2.');
      return;
    }

    try {
      setIsCreatingPayment(true);

      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedPack.priceInr,
          username: verifiedAccount.username,
          fullName:
            verifiedAccount.fullName || verifiedAccount.username || '',
          profilePicUrl: verifiedAccount.profilePicUrl || null,
          pack_id: selectedPack.id,
          quantity: selectedPack.quantity,
          customer_name:
            verifiedAccount.fullName ||
            verifiedAccount.username ||
            'Instagram Customer',
          customer_phone: '9999999999',
          metadata: {
            username: verifiedAccount.username,
            followers: selectedPack.quantity,
            pack: selectedPack.name,
          },
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success && data?.paymentUrl) {
        // Save pending order info to sessionStorage
        try {
          sessionStorage.setItem(
            'last_pay0_order',
            JSON.stringify({
              orderId: data.orderId,
              account: verifiedAccount,
              pack: selectedPack,
              amountPaidInr: selectedPack.priceInr,
              createdAt: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
            })
          );
        } catch {}

        // Redirect directly to Pay0 Checkout URL
        window.location.href = data.paymentUrl;
      } else {
        setIsCreatingPayment(false);
        setErrorMessage(
          data?.error ||
            'Pay0 payment gateway connection failed. Please try again or use manual QR.'
        );
      }
    } catch (err: any) {
      setIsCreatingPayment(false);
      setErrorMessage(
        err?.message ||
          'Network error while contacting payment gateway. Please try again.'
      );
    }
  };

  const handleCompletePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!verifiedAccount || !verifiedAccount.profilePicUrl || !selectedPack) {
      setErrorMessage('Complete Step 1 with a verified profile picture and Step 2 before placing the order.');
      return;
    }
    if (verifiedAccount.isPrivate) {
      setErrorMessage(
        'Your Instagram account is Private. Followers can only be delivered to Public accounts. Please switch to Public first.'
      );
      return;
    }

    let detail = '';
    if (upiMode === 'qr') {
      if (utrInput.trim().length < 8) {
        setErrorMessage(
          'Enter the 12-digit UTR / Transaction ID from your UPI app.'
        );
        return;
      }
      detail = `${selectedUpiApp} QR · UTR ${utrInput.trim()}`;
    } else {
      if (!/^[\w.-]+@[\w.-]+$/.test(upiIdInput.trim())) {
        setErrorMessage('Enter a valid UPI ID (e.g., name@okaxis).');
        return;
      }
      detail = `${selectedUpiApp} (${upiIdInput.trim()})`;
    }

    const orderNum = Math.floor(100000 + Math.random() * 900000);
    onOrderComplete({
      orderId: `IGS-${orderNum}`,
      account: verifiedAccount,
      pack: selectedPack,
      paymentMethod: selectedMethod,
      paymentDetail: detail,
      amountPaidInr: selectedPack.priceInr,
      createdAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
  };

  if (orderConfirmation) {
    return (
      <PaymentSuccessScreen
        orderConfirmation={orderConfirmation}
        onStartNewOrder={() => {
          setShowCheckoutForm(false);
          setUtrInput('');
          setUpiIdInput('');
          onStartNewOrder();
        }}
      />
    );
  }

  return (
    <section
      id="step-3"
      aria-labelledby="step-3-heading"
      className="rounded-3xl bg-white border border-[#D4E4FA] shadow-[0_12px_32px_-20px_rgba(6,42,97,0.16)] p-4 sm:p-7 space-y-5"
    >
      {/* Step Header */}
      <div className="flex items-center gap-3">
        <span className="h-8 w-8 rounded-full bg-[#0058D6] text-white text-sm font-bold font-num flex items-center justify-center shrink-0">
          3
        </span>
        <div>
          <h2
            id="step-3-heading"
            className="text-base sm:text-lg font-extrabold tracking-tight text-[#062A61] uppercase leading-tight"
          >
            Select Payment Option
          </h2>
          <p className="text-xs text-[#5B78A3] hidden sm:block mt-0.5">
            Fast, zero-fee direct payment via UPI
          </p>
        </div>
      </div>

      {/* Single Payment Option: UPI PAYMENT GATEWAY */}
      <div>
        <div className="relative w-full p-4 sm:p-5 rounded-2xl border-2 border-[#0058D6] bg-gradient-to-r from-[#F4F8FF] to-[#ECF3FF] shadow-sm ring-2 ring-[#0058D6]/15 flex items-center justify-between gap-3">
          {/* Left: Official UPI Logo + Text */}
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Crisp UPI Logo Box */}
            <div className="h-12 w-14 sm:w-16 p-1 rounded-xl bg-white border border-[#CDE0FD] shadow-xs flex items-center justify-center shrink-0">
              <img
                src="/assets/payment/upi_gateway.png"
                alt="UPI Payment Gateway"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm sm:text-base font-extrabold text-[#062A61] uppercase tracking-tight">
                  UPI Payment Gateway
                </p>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wider">
                  0% Fee · Instant
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#46638C] mt-0.5 truncate">
                Pay using PhonePe, Google Pay, Paytm, BHIM or any UPI App
              </p>
            </div>
          </div>

          {/* Active Radio Indicator */}
          <div className="shrink-0 flex items-center justify-center">
            <span className="h-5 w-5 rounded-full border-2 border-[#0058D6] bg-[#0058D6] flex items-center justify-center shadow-xs">
              <span className="h-2 w-2 rounded-full bg-white" />
            </span>
          </div>
        </div>
      </div>

      <hr className="border-[#E6EFFB]" />

      {/* Subtotal Box + Primary CTA + Payment App Circle Icons */}
      <div className="rounded-2xl bg-[#F6FAFF] border border-[#DCE8F8] p-5 sm:p-6 space-y-4">
        {/* Subtotal Amount and Summary */}
        <div className="text-center space-y-1">
          <p className="text-xs font-bold tracking-widest text-[#4D73AA] uppercase">
            Subtotal
          </p>
          <p className="text-3xl sm:text-4xl font-extrabold font-num text-[#062A61] tabular-nums">
            {selectedPack
              ? `INR ${selectedPack.priceInr.toLocaleString('en-IN')}`
              : '—'}
          </p>
          {selectedPack && (
            <p className="text-xs font-medium text-[#46638C]">
              {selectedPack.quantity.toLocaleString('en-IN')}{' '}
              {selectedPack.unitLabel}
              {verifiedAccount ? ` · @${verifiedAccount.username}` : ''}
            </p>
          )}
        </div>

        {/* Continue to Pay Button / Checkout Form */}
        {!showCheckoutForm ? (
          <div className="space-y-4">
            <button
              type="button"
              disabled={isCreatingPayment}
              onClick={handleContinueClick}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#0058D6] via-[#0060EA] to-[#0068FF] hover:from-[#0048B3] hover:to-[#0058D6] active:scale-[0.99] text-white font-extrabold text-base tracking-wide uppercase transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-[#0058D6]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0068FF] disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isCreatingPayment ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connecting to UPI Gateway...</span>
                </>
              ) : (
                <>
                  <span>Continue to Pay</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Circular PNG Icons for PhonePe, GPay, Paytm, UPI right below continue button */}
            <div className="pt-2 text-center">
              <p className="text-[11px] font-bold text-[#5B78A3] uppercase tracking-wider mb-2.5">
                Instant Auto-Approval on all UPI Apps
              </p>
              <div className="flex items-center justify-center gap-4 sm:gap-6">
                {/* 1st: PhonePe */}
                <div className="flex flex-col items-center gap-1 group">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden shadow-sm transition-transform group-hover:scale-110">
                    <img
                      src="/assets/payment/phonepe.png"
                      alt="PhonePe"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-[#46638C]">PhonePe</span>
                </div>

                {/* 2nd: Google Pay */}
                <div className="flex flex-col items-center gap-1 group">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white border border-[#DCE8F8] shadow-sm flex items-center justify-center p-2 transition-transform group-hover:scale-110">
                    <img
                      src="/assets/payment/gpay.png"
                      alt="Google Pay"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-[#46638C]">Google Pay</span>
                </div>

                {/* 3rd: Paytm */}
                <div className="flex flex-col items-center gap-1 group">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden shadow-sm transition-transform group-hover:scale-110">
                    <img
                      src="/assets/payment/paytm.png"
                      alt="Paytm"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-[#46638C]">Paytm</span>
                </div>

                {/* 4th: UPI */}
                <div className="flex flex-col items-center gap-1 group">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white border border-[#DCE8F8] shadow-sm flex items-center justify-center p-2.5 transition-transform group-hover:scale-110">
                    <img
                      src="/assets/payment/upi.png"
                      alt="UPI"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-[#46638C]">Any UPI</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleCompletePayment}
            className="space-y-4 pt-3 border-t border-[#DCE8F8]"
            noValidate
          >
            {/* Header with back button */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowCheckoutForm(false)}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#0058D6] hover:text-[#003C9E] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Selection</span>
              </button>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Direct UPI Transfer
              </span>
            </div>

            {/* UPI App Quick Selector */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#062A61] uppercase tracking-wide">
                Select Your Payment App:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {UPI_APPS.map((app) => (
                  <button
                    key={app}
                    type="button"
                    onClick={() => setSelectedUpiApp(app)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                      selectedUpiApp === app
                        ? 'bg-[#062A61] text-white border-[#062A61] shadow-xs'
                        : 'bg-white text-[#284B7E] border-[#C9DCF5] hover:bg-[#F0F5FF]'
                    }`}
                  >
                    <span>{app}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* QR Code or UPI ID Tab Mode */}
            <div className="inline-flex p-1 bg-white border border-[#D4E4FA] rounded-xl w-full">
              <button
                type="button"
                onClick={() => setUpiMode('qr')}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                  upiMode === 'qr'
                    ? 'bg-[#0058D6] text-white shadow-xs'
                    : 'text-[#35537E] hover:text-[#062A61]'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                Scan QR Code
              </button>
              <button
                type="button"
                onClick={() => setUpiMode('id')}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                  upiMode === 'id'
                    ? 'bg-[#0058D6] text-white shadow-xs'
                    : 'text-[#35537E] hover:text-[#062A61]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Pay via UPI ID
              </button>
            </div>

            {/* QR Mode Details */}
            {upiMode === 'qr' ? (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-white rounded-2xl border border-[#DCE8F8] p-4">
                <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 rounded-xl bg-[#F5F9FF] border border-[#E3EDFA]">
                  <UpiQrMatrix />
                  <span className="text-[10px] font-bold text-[#0058D6] mt-1.5 uppercase tracking-wider">
                    Scan with any UPI App
                  </span>
                </div>
                <div className="sm:col-span-7 space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#5B78A3] uppercase tracking-wider block mb-1">
                      UPI ID (Copy &amp; Pay):
                    </label>
                    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#F5F9FF] border border-[#D4E4FA]">
                      <span className="text-xs sm:text-sm font-num font-bold text-[#062A61] truncate">
                        {merchantUpiId}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0058D6] hover:text-[#0040A8] cursor-pointer shrink-0"
                      >
                        {copiedUpi ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#5B78A3] uppercase tracking-wider block mb-1">
                      12-Digit UTR / Transaction No.:
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={utrInput}
                      onChange={(e) => {
                        setUtrInput(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder="e.g. 431289562143"
                      className="w-full px-3.5 py-2.5 text-sm font-num bg-[#F7FAFF] border border-[#C9DCF5] rounded-xl text-[#062A61] placeholder:text-[#90A8CA] focus:outline-none focus:bg-white focus:border-[#0068FF] focus:ring-2 focus:ring-[#0068FF]/15"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#DCE8F8] p-4 space-y-3">
                <label className="text-xs font-bold text-[#062A61] uppercase tracking-wide block">
                  Enter Your {selectedUpiApp} UPI ID:
                </label>
                <input
                  type="text"
                  value={upiIdInput}
                  onChange={(e) => {
                    setUpiIdInput(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="e.g. yourname@okaxis or yourname@ibl"
                  className="w-full px-3.5 py-3 text-sm font-num bg-[#F7FAFF] border border-[#C9DCF5] rounded-xl text-[#062A61] placeholder:text-[#90A8CA] focus:outline-none focus:bg-white focus:border-[#0068FF]"
                />
              </div>
            )}

            {/* Confirm Payment Button */}
            <button
              type="submit"
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#062A61] to-[#0A367A] hover:from-[#041D44] hover:to-[#062A61] active:scale-[0.99] text-white font-extrabold text-sm sm:text-base tracking-wide uppercase transition-all cursor-pointer shadow-md"
            >
              Confirm &amp; Pay INR {selectedPack?.priceInr.toLocaleString('en-IN')}
            </button>

            {/* Circular App Icons in checkout mode too */}
            <div className="flex items-center justify-center gap-3.5 pt-1">
              <img
                src="/assets/payment/phonepe.png"
                alt="PhonePe"
                className="w-7 h-7 rounded-full shadow-xs object-cover"
              />
              <div className="w-7 h-7 rounded-full bg-white border border-[#DCE8F8] shadow-xs flex items-center justify-center p-1">
                <img
                  src="/assets/payment/gpay.png"
                  alt="Google Pay"
                  className="w-full h-full object-contain"
                />
              </div>
              <img
                src="/assets/payment/paytm.png"
                alt="Paytm"
                className="w-7 h-7 rounded-full shadow-xs object-cover"
              />
              <div className="w-7 h-7 rounded-full bg-white border border-[#DCE8F8] shadow-xs flex items-center justify-center p-1.5">
                <img
                  src="/assets/payment/upi.png"
                  alt="UPI"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </form>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs sm:text-sm"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Bottom Trust Line */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-semibold tracking-wide text-[#35537E] uppercase">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#0058D6]" />
          Secure 256-Bit UPI Gateway
        </span>
        <span aria-hidden="true" className="text-[#B6CEE8]">
          ·
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-[#0058D6]" />
          Instant Delivery Activation
        </span>
      </div>
    </section>
  );
}
