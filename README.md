# IG Social — Buy Instagram Followers with Instant UPI Checkout

A modern, high-conversion Instagram followers store optimized for mobile (9:16 layout) with live Instagram handle verification, customer proof slideshow, real-time live purchase notifications, and instant UPI checkout powered by **DivinePay** (`divinepay.us.cc`).

---

## ⚡ Features

- **Direct Instagram Profile Lookup**: Automatically fetches avatar, verified badge, follower count, and bio using public crawler scrapers.
- **DivinePay UPI Payment Gateway**: Direct pay-in integration (`https://divinepay.us.cc/api/payin/payin/create`) with instant checkout redirection and webhook callbacks.
- **Authentic Customer Proof Slideshow**: Smooth before-and-after proof gallery showing real accounts transformed with IG Social.
- **Dynamic Live Purchases & Orders**: Floating toast notifications and real-time auto-updating live order stream.
- **Direct Telegram Channel CTA**: One-tap support buttons linking directly to your Telegram channel.
- **100% Vercel Ready**: Preconfigured with `vercel.json` rewrites and Serverless API functions in `api/index.ts`.

---

## 🚀 One-Click Deploy to Vercel

1. Import this repository into [Vercel](https://vercel.com).
2. Set the following **Environment Variables** in Vercel Project Settings:
   - `DIVINEPAY_API_KEY`: Your DivinePay secret key (e.g. `sk_live_...`)
3. Click **Deploy**. Vercel will build the frontend (`dist`) and serve the Express backend via Serverless Functions (`api/index.ts`).

---

## 💻 Local Development

1. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Configure environment**:
   Copy `.env.example` to `.env` and ensure your `DIVINEPAY_API_KEY` is set:
   ```bash
   cp .env.example .env
   ```

3. **Start local dev server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend / Serverless**: Express.js, Node.js
- **Build Tool**: Vite
- **Payment Gateway**: DivinePay (`https://divinepay.us.cc`)
- **Hosting**: Vercel (Edge CDN + Serverless Functions)
