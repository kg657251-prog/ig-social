import React, { useState } from 'react';
import {
  AlertCircle,
  AtSign,
  BadgeCheck,
  CheckCircle2,
  Info,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { VerifiedAccount } from '../data/packs';

interface StepVerifyCardProps {
  verifiedAccount: VerifiedAccount | null;
  onVerifySuccess: (account: VerifiedAccount) => void;
  onResetVerification: () => void;
}

function normalizeHandle(raw: string): string {
  return raw
    .trim()
    .replace(/^@+/, '')
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .split(/[/?#]/)[0]
    .trim();
}

export function StepVerifyCard({
  verifiedAccount,
  onVerifySuccess,
  onResetVerification,
}: StepVerifyCardProps) {
  const [usernameInput, setUsernameInput] = useState(
    verifiedAccount ? verifiedAccount.username : ''
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  const handleUsernameChange = (value: string) => {
    let clean = value.trim();
    const urlMatch = clean.match(
      /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]{1,30})/i
    );
    if (urlMatch) {
      clean = urlMatch[1];
    } else {
      clean = clean.replace(/^@+/, '');
    }
    setUsernameInput(clean);
    setErrorMessage(null);
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setAvatarLoadError(false);

    const cleanHandle = normalizeHandle(usernameInput);
    const isNumericId = /^\d{3,20}$/.test(cleanHandle);
    const validHandleRegex = /^[a-zA-Z0-9._]{2,30}$/;

    if (!cleanHandle) {
      setErrorMessage(
        'Enter your Instagram username (e.g. virat.kohli or cristiano).'
      );
      return;
    }

    if (!isNumericId && !validHandleRegex.test(cleanHandle)) {
      setErrorMessage(
        'Username may only contain letters, numbers, periods, and underscores.'
      );
      return;
    }

    setIsVerifying(true);
    try {
      let data: {
        ok?: boolean;
        mode?: 'live' | 'unauthenticated_fallback';
        notice?: string;
        error?: string;
        profile?: {
          id: string | null;
          username: string;
          profileUrl: string;
          fullName: string | null;
          bio: string | null;
          profilePicUrl: string | null;
          followersCount: number | null;
          followingCount: number | null;
          postsCount: number | null;
          isPrivate: boolean;
          isVerified: boolean;
          externalUrl: string | null;
          categoryName: string | null;
        };
      } | null = null;
      let lastErrorMessage = '';
      const MAX_ATTEMPTS = 3;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const res = await fetch(
            `/api/ig/profile/${encodeURIComponent(cleanHandle)}`
          );
          const parsed = await res.json();
          if (res.ok && parsed.ok && parsed.profile && parsed.profile.profilePicUrl) {
            data = parsed;
            break;
          }
          if (parsed?.error) {
            lastErrorMessage = parsed.error;
          }
        } catch {
          // network or transient hiccup during attempt
        }

        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, 350 * attempt));
        }
      }

      if (!data || !data.ok || !data.profile || !data.profile.profilePicUrl) {
        setErrorMessage(
          lastErrorMessage ||
            'Instagram profile or profile picture could not be verified. Only valid public accounts with a verified profile picture can proceed.'
        );
        setIsVerifying(false);
        return;
      }

      if (data.profile.isPrivate) {
        setErrorMessage(
          'This account is set to Private. Please change your account to Public in Instagram settings before ordering followers.'
        );
        setIsVerifying(false);
        return;
      }

      const p = data.profile;
      setUsernameInput(p.username);

      onVerifySuccess({
        ...p,
        lookupMode: data.mode ?? 'live',
        notice: data.notice,
        verifiedAt: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    } catch (err) {
      setErrorMessage(
        'Network error while verifying Instagram profile. Please check your connection and try again.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <section
      id="step-1"
      aria-labelledby="step-1-heading"
      className="rounded-3xl bg-white border border-[#D4E4FA] shadow-[0_12px_32px_-20px_rgba(6,42,97,0.16)] p-5 sm:p-7"
    >
      {/* Step Header */}
      <div className="flex items-center gap-3.5 mb-5">
        <span className="h-8 w-8 rounded-full bg-[#0058D6] text-white text-sm font-bold font-num flex items-center justify-center shrink-0">
          1
        </span>
        <h2
          id="step-1-heading"
          className="text-base sm:text-lg font-extrabold tracking-tight text-[#062A61] uppercase"
        >
          Enter Instagram Username &amp; Verify
        </h2>
      </div>

      <form onSubmit={handleVerifySubmit} className="space-y-4" noValidate>
        {/* Username + Verify Input Row */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
          <div className="flex-1 relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#4D73AA]">
              <AtSign className="w-4 h-4" />
            </span>
            <input
              type="text"
              aria-label="Instagram Username"
              value={usernameInput}
              onChange={(e) => handleUsernameChange(e.target.value)}
              disabled={Boolean(verifiedAccount) || isVerifying}
              placeholder="Enter Instagram username (e.g. virat.kohli)"
              autoComplete="off"
              className="w-full h-12 pl-10 pr-4 text-sm font-num bg-[#F6FAFF] border border-[#C9DCF5] rounded-2xl text-[#062A61] placeholder:text-[#7E9CC7] focus:outline-none focus:bg-white focus:border-[#0068FF] focus:ring-3 focus:ring-[#0068FF]/15 disabled:opacity-75 disabled:bg-[#EEF4FF] transition-all"
            />
          </div>
          <div className="sm:w-36">
            {!verifiedAccount ? (
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full h-12 px-6 rounded-2xl bg-[#0058D6] hover:bg-[#0044AB] disabled:opacity-70 text-white text-sm font-bold tracking-wide uppercase transition-colors cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0068FF]"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  'Verify'
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onResetVerification();
                  setUsernameInput('');
                  setErrorMessage(null);
                  setAvatarLoadError(false);
                }}
                className="w-full h-12 px-4 rounded-2xl bg-[#EFF5FF] hover:bg-[#E1EDFF] border border-[#C9DCF5] text-[#062A61] text-xs font-bold tracking-wide uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Change
              </button>
            )}
          </div>
        </div>

        {/* ── Verified Profile Card ── */}
        {verifiedAccount && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A1628] via-[#0D2847] to-[#0A1628] text-white p-5 sm:p-6 border border-[#1A3A6A]">
            {/* Subtle decorative glow */}
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[#0068FF]/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-[#60A5FA]/8 blur-3xl pointer-events-none" />

            <div className="relative flex flex-col items-center text-center gap-4">
              {/* Avatar */}
              <div className="h-20 w-20 rounded-full p-[3px] bg-gradient-to-tr from-[#833AB4] via-[#FD1D1D] to-[#FCB045] shadow-lg shadow-[#0068FF]/20">
                {verifiedAccount.profilePicUrl && !avatarLoadError ? (
                  <img
                    src={verifiedAccount.profilePicUrl}
                    alt={`${verifiedAccount.username}`}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarLoadError(true)}
                    className="h-full w-full rounded-full object-cover bg-[#0D2847] ring-2 ring-[#0A1628]"
                  />
                ) : (
                  <div className="h-full w-full rounded-full bg-[#0D2847] ring-2 ring-[#0A1628] flex items-center justify-center text-xl font-extrabold text-white/80">
                    {verifiedAccount.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Username + Verified */}
              <div className="space-y-1">
                {verifiedAccount.fullName && (
                  <p className="text-base sm:text-lg font-bold text-white leading-tight">
                    {verifiedAccount.fullName}
                  </p>
                )}
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-sm font-num text-[#93C5FD]">
                    @{verifiedAccount.username}
                  </span>
                  {verifiedAccount.isVerified && (
                    <BadgeCheck
                      className="w-4 h-4 text-[#3B82F6]"
                      aria-label="Verified"
                    />
                  )}
                  <CheckCircle2
                    className="w-3.5 h-3.5 text-emerald-400"
                    aria-label="Profile Verified"
                  />
                </div>
              </div>

              {/* Private account warning */}
              {verifiedAccount.isPrivate && (
                <div className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Private account — switch to Public before ordering</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs sm:text-sm"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Helper Info Box */}
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-[#F5F9FF] border border-[#DCE8F8] text-xs sm:text-sm text-[#35537E] leading-relaxed">
          <Info className="w-4 h-4 text-[#0058D6] mt-0.5 shrink-0" />
          <p>
            Enter your Instagram username and click{' '}
            <strong className="font-semibold text-[#062A61]">Verify</strong> to
            instantly fetch your profile. Make sure your account is set to{' '}
            <strong className="font-semibold text-[#062A61]">Public</strong>.
          </p>
        </div>
      </form>
    </section>
  );
}