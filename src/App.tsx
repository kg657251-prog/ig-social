import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { FloatingTelegram } from './components/FloatingTelegram';
import { RecentPurchasePopup } from './components/RecentPurchasePopup';
import { ProofSlideshow } from './components/ProofSlideshow';
import { StepVerifyCard } from './components/StepVerifyCard';
import { StepPackCard } from './components/StepPackCard';
import { StepPaymentCard } from './components/StepPaymentCard';
import { RecentTransactions } from './components/RecentTransactions';
import {
  GrowthPack,
  OrderConfirmation,
  VerifiedAccount,
} from './data/packs';

export default function App() {
  const [verifiedAccount, setVerifiedAccount] = useState<VerifiedAccount | null>(
    null
  );
  const [selectedPack, setSelectedPack] = useState<GrowthPack | null>(null);
  const [orderConfirmation, setOrderConfirmation] =
    useState<OrderConfirmation | null>(null);

  useEffect(() => {
    if (orderConfirmation) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [orderConfirmation]);

  const handleFocusVerify = () => {
    const el = document.getElementById('step-1');
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleStartNewOrder = () => {
    setOrderConfirmation(null);
    setVerifiedAccount(null);
    setSelectedPack(null);
    handleFocusVerify();
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F5F9FF] text-[#062A61] antialiased">
      <Header />

      <main className="flex-1">
        {/* Mobile 9:16 optimized container — max-w-xl (~576px) centers beautifully on mobile & desktop */}
        <div className="max-w-xl mx-auto px-3.5 sm:px-5 pt-4 sm:pt-7 pb-12 space-y-4 sm:space-y-5">
          {/* Header Title (shown during checkout) */}
          {!orderConfirmation && (
            <div className="text-center pb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5F0FF] border border-[#C8DEFC] text-[#0058D6] text-xs font-bold uppercase tracking-wider mb-2">
                ⚡ Instant Followers Delivery
              </span>
              <h1
                className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#062A61]"
                style={{ textWrap: 'balance' }}
              >
                Buy Instagram Followers
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-[#46638C]">
                Verify your public Instagram handle, select your follower pack, and checkout via UPI in seconds.
              </p>
            </div>
          )}

          {/* Social Proof: Work Showcase & Before/After Slideshow */}
          {!orderConfirmation && <ProofSlideshow />}

          {/* Step 1: Enter Username & Verify */}
          {!orderConfirmation && (
            <StepVerifyCard
              verifiedAccount={verifiedAccount}
              onVerifySuccess={(account) => {
                setVerifiedAccount(account);
                setOrderConfirmation(null);
              }}
              onResetVerification={() => {
                setVerifiedAccount(null);
                setOrderConfirmation(null);
              }}
            />
          )}

          {/* Step 2: Select Followers Pack (Only Followers) */}
          {!orderConfirmation && (
            <StepPackCard
              selectedPack={selectedPack}
              onSelectPack={(pack) => {
                setSelectedPack(pack);
                setOrderConfirmation(null);
              }}
            />
          )}

          {/* Step 3: Payment Options or Blue Success Screen */}
          <StepPaymentCard
            verifiedAccount={verifiedAccount}
            selectedPack={selectedPack}
            onFocusVerify={handleFocusVerify}
            onOrderComplete={setOrderConfirmation}
            orderConfirmation={orderConfirmation}
            onStartNewOrder={handleStartNewOrder}
          />

          {/* Recent Live Orders */}
          <RecentTransactions />
        </div>
      </main>

      <Footer />

      {/* Live purchase popup in bottom left corner */}
      <RecentPurchasePopup />

      {/* Floating Telegram Logo in bottom right corner */}
      <FloatingTelegram />
    </div>
  );
}
