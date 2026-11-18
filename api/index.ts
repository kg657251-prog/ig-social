import 'dotenv/config';
import express from 'express';
import crypto from 'node:crypto';

const IG_APP_ID = '936619743392459';
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const CRAWLER_USER_AGENTS = [
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'WhatsApp/2.21.12.21 A',
  'Twitterbot/1.0',
  'TelegramBot (like TwitterBot)',
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
];

interface IgProfilePayload {
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
}

// In-memory cache for fast lookups & Instagram rate-limit protection (15 mins TTL)
const profileCache = new Map<string, { profile: IgProfilePayload; timestamp: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000;

function buildCookieHeader(): string {
  const fullCookie = (process.env.IG_SESSION_COOKIE || '').trim();
  if (fullCookie) return fullCookie;
  const sessionId = (process.env.IG_SESSION_ID || '').trim();
  if (sessionId) return `sessionid=${sessionId}`;
  return '';
}

function buildAvatarProxyUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const cleanUrl = rawUrl.replace(/&amp;/g, '&');
  return `/api/ig/avatar?url=${encodeURIComponent(cleanUrl)}`;
}

function isAllowedAvatarHost(hostname: string): boolean {
  return (
    hostname.endsWith('.cdninstagram.com') ||
    hostname.endsWith('.fbcdn.net') ||
    hostname.endsWith('.instagram.com')
  );
}

function parseAbbreviatedCount(str: string): number | null {
  if (!str) return null;
  const cleaned = str.replace(/,/g, '').trim().toUpperCase();
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;

  if (cleaned.endsWith('B')) return Math.round(num * 1_000_000_000);
  if (cleaned.endsWith('M')) return Math.round(num * 1_000_000);
  if (cleaned.endsWith('K')) return Math.round(num * 1_000);
  return Math.round(num);
}

function decodeHtmlEntities(raw: string): string {
  if (!raw) return raw;
  return raw
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      try {
        return String.fromCodePoint(parseInt(hex, 16));
      } catch {
        return '';
      }
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCodePoint(parseInt(dec, 10));
      } catch {
        return '';
      }
    })
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…');
}

// Matches meta tags whether property comes before content or content comes before property
function getMetaContent(html: string, namePattern: string): string | null {
  const r1 = new RegExp(
    `<meta\\s+[^>]*?(?:property|name)=["']${namePattern}["'][^>]*?content=["']([^"']+)["']`,
    'i'
  );
  const m1 = html.match(r1);
  if (m1) return decodeHtmlEntities(m1[1]);

  const r2 = new RegExp(
    `<meta\\s+[^>]*?content=["']([^"']+)["'][^>]*?(?:property|name)=["']${namePattern}["']`,
    'i'
  );
  const m2 = html.match(r2);
  if (m2) return decodeHtmlEntities(m2[1]);

  return null;
}

function extractProfileFromHtml(
  username: string,
  userId: string | null,
  html: string
): IgProfilePayload | null {
  if (!html) return null;

  let fullName: string | null = null;

  // 1. Try og:title first
  const ogTitleContent = getMetaContent(html, '(?:og:title|title)');
  if (ogTitleContent) {
    const m = ogTitleContent.match(/^([^(•\n]+?)\s*(?:\(@|•|-)/);
    if (m && m[1].trim()) {
      fullName = m[1].trim();
    }
  }

  // 2. Fallback to <title>
  if (!fullName) {
    const titleMatch = html.match(
      /<title>\s*([^<]+?)\s*(?:\(@[a-zA-Z0-9._]+\)|•|-|\()/i
    );
    if (titleMatch && titleMatch[1].trim() && !titleMatch[1].toLowerCase().includes('instagram')) {
      fullName = decodeHtmlEntities(titleMatch[1].trim());
    }
  }

  // 3. Stats from og:description or description
  const descContent =
    getMetaContent(html, '(?:og:description|description)') || '';

  let followersCount: number | null = null;
  let followingCount: number | null = null;
  let postsCount: number | null = null;
  let bioFromDesc: string | null = null;

  if (descContent) {
    const followersMatch = descContent.match(/([0-9.,KMkmBb]+)\s+Followers?/i);
    const followingMatch = descContent.match(/([0-9.,KMkmBb]+)\s+Following/i);
    const postsMatch = descContent.match(/([0-9.,KMkmBb]+)\s+Posts?/i);

    if (followersMatch) followersCount = parseAbbreviatedCount(followersMatch[1]);
    if (followingMatch) followingCount = parseAbbreviatedCount(followingMatch[1]);
    if (postsMatch) postsCount = parseAbbreviatedCount(postsMatch[1]);

    const bioMatch = descContent.match(
      /(?:See Instagram photos and videos from|from)\s*[^•-]+[•-]\s*(.*)$/i
    );
    if (bioMatch && bioMatch[1].trim()) {
      bioFromDesc = bioMatch[1].trim();
    }
  }

  // 4. Avatar from og:image
  const rawOgImage = getMetaContent(html, 'og:image');

  // 5. Canonical URL
  const canonicalUrl =
    getMetaContent(html, 'og:url') || `https://www.instagram.com/${username}/`;

  // 6. JSON-LD fallback
  let jsonUser: any = null;
  const jsonMatches = html.matchAll(
    /<script\s+type=["']application\/ld\+json["']>([^<]+)<\/script>/gi
  );
  for (const match of jsonMatches) {
    try {
      const parsed = JSON.parse(match[1]);
      if (
        parsed['@type'] === 'ProfilePage' ||
        parsed.mainEntity?.['@type'] === 'Person'
      ) {
        jsonUser = parsed.mainEntity || parsed;
        break;
      }
    } catch {}
  }

  const resolvedFullName =
    fullName || (jsonUser?.name ? decodeHtmlEntities(jsonUser.name) : null);
  const resolvedBio =
    (jsonUser?.description ? decodeHtmlEntities(jsonUser.description) : null) ||
    bioFromDesc;
  const resolvedAvatar = buildAvatarProxyUrl(
    rawOgImage || jsonUser?.image || null
  );

  return {
    id: userId,
    username,
    profileUrl: canonicalUrl,
    fullName: resolvedFullName,
    bio: resolvedBio,
    profilePicUrl: resolvedAvatar,
    followersCount,
    followingCount,
    postsCount,
    isPrivate: false,
    isVerified: html.includes('"is_verified":true'),
    externalUrl: null,
    categoryName: null,
  };
}

async function fetchViaWebProfileInfo(
  username: string,
  cookieHeader: string
): Promise<{ status: number; profile: IgProfilePayload | null }> {
  try {
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(
      username
    )}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6500);

    const headers: Record<string, string> = {
      'User-Agent': BROWSER_UA,
      'x-ig-app-id': IG_APP_ID,
      Accept: '*/*',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'cors',
      Referer: `https://www.instagram.com/${username}/`,
    };
    if (cookieHeader) headers.cookie = cookieHeader;

    const response = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timer);

    if (response.status === 404) return { status: 404, profile: null };
    if (!response.ok) return { status: response.status, profile: null };

    const data = (await response.json()) as any;
    const user = data?.data?.user;
    if (!user) return { status: 200, profile: null };

    return {
      status: 200,
      profile: {
        id: user.id || null,
        username: user.username,
        profileUrl: `https://www.instagram.com/${user.username}/`,
        fullName: decodeHtmlEntities(user.full_name || ''),
        bio: decodeHtmlEntities(user.biography || ''),
        profilePicUrl: buildAvatarProxyUrl(
          user.profile_pic_url_hd || user.profile_pic_url
        ),
        followersCount: user.edge_followed_by?.count ?? null,
        followingCount: user.edge_follow?.count ?? null,
        postsCount: user.edge_owner_to_timeline_media?.count ?? null,
        isPrivate: Boolean(user.is_private),
        isVerified: Boolean(user.is_verified),
        externalUrl: user.external_url || null,
        categoryName: user.category_name || null,
      },
    };
  } catch {
    return { status: 0, profile: null };
  }
}

async function findInstagramIdByUsername(
  username: string,
  cookieHeader: string
): Promise<{ userId: string | null; rawHtml: string | null }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const headers: Record<string, string> = {
      'User-Agent': BROWSER_UA,
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    };
    if (cookieHeader) headers.cookie = cookieHeader;

    const res = await fetch(`https://www.instagram.com/${username}/`, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.status === 404) return { userId: null, rawHtml: null };
    const html = await res.text();

    const patterns = [
      /"profilePage_([0-9]{3,20})"/,
      /"owner":\s*\{\s*"id":\s*"([0-9]{3,20})"/,
      /"user_id":\s*"([0-9]{3,20})"/,
      /"id":\s*"([0-9]{3,20})",\s*"username":\s*"[^"]*"/,
      /"user":\s*\{[^}]*"id":\s*"([0-9]{3,20})"/,
    ];

    for (const pat of patterns) {
      const match = html.match(pat);
      if (match && match[1]) {
        return { userId: match[1], rawHtml: html };
      }
    }
    return { userId: null, rawHtml: html };
  } catch {
    return { userId: null, rawHtml: null };
  }
}

async function findInstagramProfileById(
  userId: string,
  cookieHeader: string
): Promise<{ status: number; profile: IgProfilePayload | null }> {
  try {
    const url = `https://i.instagram.com/api/v1/users/${encodeURIComponent(
      userId
    )}/info/`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6500);

    const headers: Record<string, string> = {
      'User-Agent':
        'Instagram 275.0.0.27.98 Android (33/13; 420dpi; 1080x2400; Xiaomi; M2012K11AG; alioth; qcom; en_US; 455383561)',
      'x-ig-app-id': IG_APP_ID,
      Accept: '*/*',
    };
    if (cookieHeader) headers.cookie = cookieHeader;

    const response = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timer);

    if (response.status === 404) return { status: 404, profile: null };
    if (!response.ok) return { status: response.status, profile: null };

    const data = (await response.json()) as any;
    const user = data?.user;
    if (!user) return { status: 200, profile: null };

    return {
      status: 200,
      profile: {
        id: String(user.pk || userId),
        username: user.username,
        profileUrl: `https://www.instagram.com/${user.username}/`,
        fullName: decodeHtmlEntities(user.full_name || ''),
        bio: decodeHtmlEntities(user.biography || ''),
        profilePicUrl: buildAvatarProxyUrl(
          user.hd_profile_pic_url_info?.url || user.profile_pic_url
        ),
        followersCount: user.follower_count ?? null,
        followingCount: user.following_count ?? null,
        postsCount: user.media_count ?? null,
        isPrivate: Boolean(user.is_private),
        isVerified: Boolean(user.is_verified),
        externalUrl: user.external_url || null,
        categoryName: user.category || null,
      },
    };
  } catch {
    return { status: 0, profile: null };
  }
}

async function fetchViaCrawler(
  username: string
): Promise<IgProfilePayload | null> {
  for (const ua of CRAWLER_USER_AGENTS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4500);

      const response = await fetch(`https://www.instagram.com/${username}/`, {
        headers: {
          'User-Agent': ua,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (response.status === 404) return null;

      if (response.ok) {
        const html = await response.text();
        const profile = extractProfileFromHtml(username, null, html);
        if (
          profile &&
          (profile.profilePicUrl ||
            profile.followersCount !== null ||
            profile.fullName)
        ) {
          return profile;
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

// ── DivinePay Gateway Integration ──

interface PaymentOrderRecord {
  orderId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  gatewayId?: string;
  checkoutUrl?: string;
  username?: string;
  packId?: string;
  quantity?: number;
  utr?: string;
  gatewayTransactionId?: string;
  amountPaid?: number;
  createdAt: string;
  updatedAt?: string;
}

const orderStore = new Map<string, PaymentOrderRecord>();

export const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Normalize URL for Vercel edge rewrites
app.use((req, _res, next) => {
  const matchedPath = req.headers['x-matched-path'] as string;
  const originalUrl = req.headers['x-original-url'] as string;
  const invokePath = req.headers['x-invoke-path'] as string;

  if (req.url === '/api' || req.url === '/' || req.url === '') {
    if (matchedPath && matchedPath !== '/api' && matchedPath !== '/') {
      req.url = matchedPath;
    } else if (originalUrl && originalUrl !== '/api' && originalUrl !== '/') {
      req.url = originalUrl;
    } else if (invokePath && invokePath !== '/api' && invokePath !== '/') {
      req.url = invokePath;
    }
  }
  next();
});

const router = express.Router();

// Root / Health check
router.get('/', (_req, res) => {
  res.json({ ok: true, status: 'IG Social API active', timestamp: new Date().toISOString() });
});

// Instagram Lookup
router.get('/ig/profile/:identifier', async (req, res) => {
  const raw = String(req.params.identifier || '').trim().replace(/^@+/, '');
  const isNumericId = /^\d{3,20}$/.test(raw);
  const isValidUsername = /^[a-zA-Z0-9._]{2,30}$/.test(raw);

  if (!isNumericId && !isValidUsername) {
    res.status(400).json({
      ok: false,
      error: 'Enter a valid Instagram username (2–30 chars) or numeric User ID.',
    });
    return;
  }

  // Check in-memory cache first
  const cacheKey = raw.toLowerCase();
  const cached = profileCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    res.json({ ok: true, mode: 'live', profile: cached.profile });
    return;
  }

  const buildFallbackProfile = (username: string): IgProfilePayload => ({
    id: null,
    username,
    profileUrl: `https://www.instagram.com/${username}/`,
    fullName: null,
    bio: null,
    profilePicUrl: null,
    followersCount: null,
    followingCount: null,
    postsCount: null,
    isPrivate: false,
    isVerified: false,
    externalUrl: null,
    categoryName: null,
  });

  const cookieHeader = buildCookieHeader();

  try {
    if (isNumericId) {
      const byIdResult = await findInstagramProfileById(raw, cookieHeader);
      if (byIdResult.profile) {
        res.json({ ok: true, mode: 'live', profile: byIdResult.profile });
        return;
      }
      if (byIdResult.status === 404) {
        res.status(404).json({
          ok: false,
          error: `Instagram User ID ${raw} was not found.`,
        });
        return;
      }
      res.json({
        ok: true,
        mode: 'unauthenticated_fallback',
        notice: 'Could not fetch full profile details. Username accepted.',
        profile: buildFallbackProfile(raw),
      });
      return;
    }

    // Primary: fetch via mobile/crawler user agents
    const crawlerProfile = await fetchViaCrawler(raw);
    if (crawlerProfile) {
      profileCache.set(cacheKey, { profile: crawlerProfile, timestamp: Date.now() });
      res.json({ ok: true, mode: 'live', profile: crawlerProfile });
      return;
    }

    // Secondary: fetch via web profile info API
    if (cookieHeader) {
      const webResult = await fetchViaWebProfileInfo(raw, cookieHeader);
      if (webResult.profile) {
        profileCache.set(cacheKey, { profile: webResult.profile, timestamp: Date.now() });
        res.json({ ok: true, mode: 'live', profile: webResult.profile });
        return;
      }
      if (webResult.status === 404) {
        res.status(404).json({
          ok: false,
          error: `Instagram profile @${raw} was not found.`,
        });
        return;
      }

      const pageLookup = await findInstagramIdByUsername(raw, cookieHeader);
      if (pageLookup.userId) {
        const infoResult = await findInstagramProfileById(
          pageLookup.userId,
          cookieHeader
        );
        if (infoResult.profile) {
          res.json({ ok: true, mode: 'live', profile: infoResult.profile });
          return;
        }
      }
    }

    // Fallback: accept username
    res.json({
      ok: true,
      mode: 'unauthenticated_fallback',
      notice:
        'Instagram profile details could not be loaded right now, but your username has been accepted.',
      profile: buildFallbackProfile(raw),
    });
  } catch (err) {
    console.error('[IG Lookup Error]', err);
    if (isValidUsername) {
      res.json({
        ok: true,
        mode: 'unauthenticated_fallback',
        notice:
          'Instagram verification is temporarily unavailable. Your username has been accepted.',
        profile: buildFallbackProfile(raw),
      });
    } else {
      res.status(502).json({
        ok: false,
        error:
          err instanceof Error
            ? `Failed to reach Instagram lookup service: ${err.message}`
            : 'Failed to verify Instagram profile.',
      });
    }
  }
});

// Avatar Proxy
router.get('/ig/avatar', async (req, res) => {
  let target = String(req.query.url || '').trim();
  if (!target) {
    res.status(400).send('Missing url');
    return;
  }
  target = target.replace(/&amp;/g, '&');

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    res.status(400).send('Invalid url');
    return;
  }

  if (parsed.protocol !== 'https:' || !isAllowedAvatarHost(parsed.hostname)) {
    res.status(403).send('Disallowed avatar host');
    return;
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: {
        'user-agent': BROWSER_UA,
        referer: 'https://www.instagram.com/',
      },
    });
    if (!upstream.ok) {
      res.status(upstream.status).send('Failed to fetch avatar');
      return;
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const arrayBuf = await upstream.arrayBuffer();
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(arrayBuf));
  } catch {
    res.status(502).send('Avatar proxy error');
  }
});

// DivinePay: Create Pay-In
router.post('/create-payment', async (req, res) => {
  try {
    const apiKey = (process.env.DIVINEPAY_API_KEY || '').trim();

    if (!apiKey) {
      res.status(500).json({
        success: false,
        error:
          'DivinePay payment credentials are not configured in server environment.',
      });
      return;
    }

    const { amount, order_id, username, pack_id, quantity } = req.body || {};

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      res.status(400).json({
        success: false,
        error: 'A valid numeric payment amount is required.',
      });
      return;
    }

    const safeUsername = String(username || '').trim().replace(/^@+/, '');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let upstreamRes: Response;
    try {
      upstreamRes = await fetch(
        'https://divinepay.us.cc/api/payin/payin/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            amount: numericAmount,
          }),
          signal: controller.signal,
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    const data = (await upstreamRes.json().catch(() => null)) as any;

    const checkoutUrl =
      data?.data?.paymentUrl ||
      data?.paymentUrl ||
      data?.checkout_url ||
      data?.data?.checkout_url;

    const orderId =
      data?.data?.order_id || data?.order_id || order_id || `ORD_${Date.now()}`;

    if (
      (upstreamRes.status === 200 || upstreamRes.status === 201) &&
      data?.success &&
      checkoutUrl
    ) {
      orderStore.set(orderId, {
        orderId,
        amount: numericAmount,
        currency: 'INR',
        status: 'pending',
        gatewayId: orderId,
        checkoutUrl,
        username: safeUsername,
        packId: pack_id,
        quantity,
        createdAt: new Date().toISOString(),
      });

      res.status(200).json({
        success: true,
        paymentUrl: checkoutUrl,
        orderId,
        data,
      });
    } else {
      const errorMsg =
        data?.message ||
        data?.error ||
        `DivinePay payment creation failed (HTTP ${upstreamRes.status})`;
      res.status(upstreamRes.status >= 400 ? upstreamRes.status : 502).json({
        success: false,
        error: errorMsg,
        details: data,
      });
    }
  } catch (err: any) {
    const isTimeout = err?.name === 'AbortError';
    res.status(504).json({
      success: false,
      error: isTimeout
        ? 'DivinePay gateway timed out after 10 seconds. Please try again.'
        : `Payment creation failed: ${err?.message || 'Unknown error'}`,
    });
  }
});

// DivinePay: Payment Callback Webhook
const handlePaymentCallback = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const payload: Record<string, any> = {
      ...(req.query || {}),
      ...(typeof req.body === 'object' && req.body !== null ? req.body : {}),
    };

    console.log('[DivinePay Webhook] Received:', {
      method: req.method,
      query: req.query,
      body: req.body,
    });

    const orderId = String(
      payload.order_id ||
        payload.orderId ||
        payload.platOrderNum ||
        payload.merchant_order_id ||
        ''
    ).trim();

    const status = String(payload.status || '').toLowerCase();
    const amount =
      Number(payload.realAmount || payload.orderAmount || payload.amount) || 0;
    const utr = String(payload.utr || '').trim();

    const isSuccessful = [
      'success',
      'paid',
      'completed',
      'trade_success',
      '1',
    ].includes(status);

    if (orderId && orderStore.has(orderId)) {
      const existing = orderStore.get(orderId)!;
      orderStore.set(orderId, {
        ...existing,
        status: isSuccessful ? 'paid' : (status as any) || existing.status,
        utr: utr || existing.utr,
        gatewayTransactionId: utr || existing.gatewayTransactionId,
        amountPaid: amount || existing.amount,
        updatedAt: new Date().toISOString(),
      });
    }

    res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('[DivinePay Webhook] Error:', err);
    res.status(500).json({ success: false, error: 'Internal webhook error' });
  }
};

router.post('/payment-callback', handlePaymentCallback);
router.get('/payment-callback', handlePaymentCallback);
router.post('/callback/notify', handlePaymentCallback);

// DivinePay: Check Order Status
router.get('/order-status/:orderId', async (req, res) => {
  const id = String(req.params.orderId || '').trim();
  let order = orderStore.get(id);

  if (order && order.status === 'pending') {
    const apiKey = (process.env.DIVINEPAY_API_KEY || '').trim();
    if (apiKey) {
      try {
        const statusRes = await fetch(
          'https://divinepay.us.cc/api/payin/status',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
            },
            body: JSON.stringify({ order_id: id }),
          }
        );
        if (statusRes.ok) {
          const statusData = (await statusRes.json().catch(() => null)) as any;
          const remoteStatus = String(
            statusData?.data?.status || statusData?.status || ''
          ).toLowerCase();

          if (['success', 'paid', 'completed'].includes(remoteStatus)) {
            order = {
              ...order,
              status: 'paid',
              amountPaid: statusData?.data?.amount || order.amount,
              updatedAt: new Date().toISOString(),
            };
            orderStore.set(id, order);
          }
        }
      } catch {}
    }
  }

  if (!order) {
    res.status(404).json({ ok: false, error: 'Order not found' });
    return;
  }
  res.json({ ok: true, order });
});

// Mount router on BOTH '/api' and '/' so all path variants work
app.use('/api', router);
app.use('/', router);

export default app;
