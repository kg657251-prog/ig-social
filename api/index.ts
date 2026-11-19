import 'dotenv/config';
import express from 'express';
import crypto from 'node:crypto';
import dns from 'node:dns';
import https from 'node:https';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

const IG_APP_ID = '936619743392459';
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const CRAWLER_USER_AGENTS = [
  'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
  'Twitterbot/1.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 254.0.0.19.109',
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'WhatsApp/2.21.12.21 A',
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
    if (titleMatch && titleMatch[1].trim()) {
      fullName = decodeHtmlEntities(titleMatch[1].trim());
    }
  }

  // Filter out generic/login titles
  if (
    fullName &&
    (fullName.toLowerCase() === 'login' ||
      fullName.toLowerCase() === 'instagram' ||
      fullName.toLowerCase().includes('welcome back') ||
      fullName.toLowerCase().includes('see instagram photos'))
  ) {
    fullName = null;
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

  // 4. Avatar from og:image (ignore Instagram's static logo/favicon on login pages)
  let rawOgImage = getMetaContent(html, 'og:image');
  if (
    rawOgImage &&
    (rawOgImage.includes('/rsrc.php/') ||
      rawOgImage.includes('static.cdninstagram.com') ||
      rawOgImage.includes('static.xx.fbcdn.net'))
  ) {
    rawOgImage = null;
  }

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
): Promise<{ userId: string | null; profile: IgProfilePayload | null }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const headers: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 254.0.0.19.109',
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

    if (res.status === 404) return { userId: null, profile: null };
    const html = await res.text();

    const profile = extractProfileFromHtml(username, null, html);
    if (
      profile &&
      (profile.profilePicUrl ||
        profile.followersCount !== null ||
        profile.fullName ||
        profile.postsCount !== null)
    ) {
      return { userId: null, profile };
    }

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
        return { userId: match[1], profile: null };
      }
    }
    return { userId: null, profile: null };
  } catch {
    return { userId: null, profile: null };
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
  const fetchWithUa = async (ua: string): Promise<IgProfilePayload | null> => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);

      const headers: Record<string, string> = {
        'User-Agent': ua,
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      };

      const response = await fetch(`https://www.instagram.com/${username}/`, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) return null;
      const html = await response.text();
      return extractProfileFromHtml(username, null, html);
    } catch {
      return null;
    }
  };

  const results = await Promise.all(
    CRAWLER_USER_AGENTS.map((ua) => fetchWithUa(ua))
  );

  // 1. Prioritize complete profile (followersCount + avatar or name)
  for (const p of results) {
    if (p && p.followersCount !== null && (p.profilePicUrl || p.fullName)) {
      return p;
    }
  }

  // 2. Otherwise return any candidate with at least one data point
  for (const p of results) {
    if (
      p &&
      (p.profilePicUrl ||
        p.followersCount !== null ||
        p.fullName ||
        p.postsCount !== null)
    ) {
      return p;
    }
  }

  return null;
}

// ── Pay0 Gateway Integration ──

interface PaymentOrderRecord {
  orderId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  gatewayId?: string;
  checkoutUrl?: string;
  username?: string;
  fullName?: string;
  profilePicUrl?: string | null;
  packId?: string;
  quantity?: number;
  utr?: string;
  gatewayTransactionId?: string;
  amountPaid?: number;
  createdAt: string;
  updatedAt?: string;
  smmOrderId?: string | number;
  smmStatus?: 'pending' | 'submitted' | 'failed';
  smmError?: string;
  smmSubmittedAt?: string;
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
      if (crawlerProfile.followersCount !== null) {
        profileCache.set(cacheKey, { profile: crawlerProfile, timestamp: Date.now() });
      }
      res.json({ ok: true, mode: 'live', profile: crawlerProfile });
      return;
    }

    // Secondary: fetch via web profile info API or authenticated HTML / ID lookup
    if (cookieHeader) {
      const webResult = await fetchViaWebProfileInfo(raw, cookieHeader);
      if (webResult.profile) {
        profileCache.set(cacheKey, { profile: webResult.profile, timestamp: Date.now() });
        res.json({ ok: true, mode: 'live', profile: webResult.profile });
        return;
      }

      // If web profile info fails (Instagram web API often returns 404/429 from datacenter IPs),
      // do NOT return hard 404 — try page HTML and mobile API endpoint:
      const pageLookup = await findInstagramIdByUsername(raw, cookieHeader);
      if (pageLookup.profile) {
        profileCache.set(cacheKey, { profile: pageLookup.profile, timestamp: Date.now() });
        res.json({ ok: true, mode: 'live', profile: pageLookup.profile });
        return;
      }
      if (pageLookup.userId) {
        const infoResult = await findInstagramProfileById(
          pageLookup.userId,
          cookieHeader
        );
        if (infoResult.profile) {
          profileCache.set(cacheKey, { profile: infoResult.profile, timestamp: Date.now() });
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

// ── Pay0 Payment Gateway Integration ──
const PAY0_DEFAULT_API_KEY = 'bd721fbe63b2185ebc5a3d64dbaf1ae3';
const PAY0_DEFAULT_SECRET = 'Ij5BmHSP1C687078021';

async function postPay0Form(
  endpoint: string,
  formBody: string,
  timeoutMs = 15000
): Promise<{ status: number; data: any }> {
  // 1. Try global fetch first
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json, text/plain, */*',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: formBody,
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    const text = await res.text();
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
    return { status: res.status, data: parsed };
  } catch (fetchErr: any) {
    console.warn(
      `[Pay0 Request] fetch failed (${fetchErr?.message || fetchErr}), falling back to native HTTPS...`
    );

    // 2. Fallback to native node:https.request
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint);
      const req = https.request(
        {
          hostname: url.hostname,
          port: 443,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(formBody),
            'Accept': 'application/json, text/plain, */*',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          timeout: timeoutMs,
        },
        (res) => {
          let chunks = '';
          res.on('data', (d) => (chunks += d));
          res.on('end', () => {
            try {
              resolve({
                status: res.statusCode || 200,
                data: JSON.parse(chunks),
              });
            } catch {
              resolve({ status: res.statusCode || 200, data: chunks });
            }
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Pay0 request timed out after ' + timeoutMs + 'ms'));
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.write(formBody);
      req.end();
    });
  }
}

// Pay0: Create Pay-In Order
router.post('/create-payment', async (req, res) => {
  try {
    const apiKey = (process.env.PAY0_API_KEY || PAY0_DEFAULT_API_KEY).trim();

    if (!apiKey) {
      res.status(500).json({
        success: false,
        error: 'Pay0 payment credentials are not configured.',
      });
      return;
    }

    const {
      amount,
      order_id,
      username,
      fullName,
      profilePicUrl,
      pack_id,
      quantity,
      customer_name,
      customer_phone,
    } = req.body || {};

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      res.status(400).json({
        success: false,
        error: 'A valid numeric payment amount is required.',
      });
      return;
    }

    const safeUsername = String(username || '').trim().replace(/^@+/, '');
    const cleanCustomerName = String(
      customer_name || fullName || safeUsername || 'Customer'
    ).trim();
    const cleanCustomerMobile = String(customer_phone || '9999999999').replace(
      /\D/g,
      ''
    ) || '9999999999';

    // Generate unique order ID if not provided
    const orderId =
      order_id ||
      `ORD${Date.now()}${Math.floor(100 + Math.random() * 900)}`;

    // Resolve site callback/redirect URL
    const proto =
      (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    const siteUrl = (
      process.env.SITE_URL ||
      process.env.APP_URL ||
      `${proto}://${host}`
    ).replace(/\/+$/, '');
    const redirectUrl = `${siteUrl}/?order_id=${encodeURIComponent(orderId)}`;

    const formParams = new URLSearchParams({
      customer_mobile: cleanCustomerMobile,
      customer_name: cleanCustomerName,
      user_token: apiKey,
      amount: String(numericAmount),
      order_id: orderId,
      redirect_url: redirectUrl,
      remark1: `@${safeUsername}`,
      remark2: `${quantity || ''} Followers`,
    });

    const { status: upstreamStatus, data } = await postPay0Form(
      'https://api.pay0.shop/apiv1/create-order',
      formParams.toString(),
      15000
    );

    const checkoutUrl =
      data?.result?.payment_url ||
      data?.payment_url ||
      data?.data?.payment_url;
    const resultOrderId =
      data?.result?.orderId || data?.orderId || orderId;

    if (
      (upstreamStatus === 200 || upstreamStatus === 201) &&
      data?.status &&
      checkoutUrl
    ) {
      const record: PaymentOrderRecord = {
        orderId: resultOrderId,
        amount: numericAmount,
        currency: 'INR',
        status: 'pending',
        gatewayId: resultOrderId,
        checkoutUrl,
        username: safeUsername,
        fullName: cleanCustomerName,
        profilePicUrl: profilePicUrl || null,
        packId: pack_id,
        quantity: Number(quantity) || 0,
        createdAt: new Date().toISOString(),
      };

      orderStore.set(resultOrderId, record);
      if (resultOrderId !== orderId) {
        orderStore.set(orderId, record);
      }

      res.status(200).json({
        success: true,
        paymentUrl: checkoutUrl,
        orderId: resultOrderId,
        data,
      });
    } else {
      const errorMsg =
        data?.message ||
        data?.error ||
        `Pay0 payment creation failed (HTTP ${upstreamStatus})`;
      res.status(upstreamStatus >= 400 ? upstreamStatus : 502).json({
        success: false,
        error: errorMsg,
        details: data,
      });
    }
  } catch (err: any) {
    console.error('[Pay0 create-payment error]:', err);
    res.status(504).json({
      success: false,
      error: `Payment creation failed: ${err?.message || 'Unknown error'}`,
    });
  }
});

// ── SMM Turk Fulfillment Integration ──
const SMM_TURK_DEFAULT_API_KEY = '921c1c7e4af362940d41656621f0c888';
const SMM_TURK_DEFAULT_SERVICE_ID = '14783';

async function fulfillSmmTurkOrder(order: PaymentOrderRecord): Promise<void> {
  // Deduplication check: if order is already submitted or in-flight, skip!
  if (!order || order.smmOrderId || order.smmStatus === 'submitted') {
    return;
  }

  const rawUsername = String(order.username || '').trim().replace(/^@+/, '');
  if (!rawUsername) {
    console.warn(
      `[SMM Turk] Cannot fulfill order ${order.orderId}: missing username`
    );
    return;
  }

  // Mark in-flight immediately to prevent race conditions between webhook and redirect polling
  order.smmStatus = 'submitted';

  const apiKey = (
    process.env.SMM_TURK_API_KEY || SMM_TURK_DEFAULT_API_KEY
  ).trim();
  const serviceId = (
    process.env.SMM_TURK_SERVICE_ID || SMM_TURK_DEFAULT_SERVICE_ID
  ).trim();
  const quantity = Math.max(10, Number(order.quantity) || 10);
  const link = `https://www.instagram.com/${rawUsername}`;

  console.log(
    `[SMM Turk] Submitting order fulfillment for ${order.orderId}: @${rawUsername}, quantity: ${quantity}, service: ${serviceId}`
  );

  try {
    const formParams = new URLSearchParams({
      key: apiKey,
      action: 'add',
      service: serviceId,
      link: link,
      quantity: String(quantity),
    });

    const res = await fetch('https://smmturk.org/api/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: formParams.toString(),
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    console.log(`[SMM Turk Response] Order ${order.orderId}:`, data);

    if (data?.order) {
      order.smmOrderId = data.order;
      order.smmStatus = 'submitted';
      order.smmSubmittedAt = new Date().toISOString();
      console.log(
        `[SMM Turk Success] Order ${order.orderId} fulfilled! SMM Turk Order ID: ${data.order}`
      );
    } else {
      order.smmStatus = 'failed';
      order.smmError = data?.error || 'Unknown SMM Turk error';
      console.error(
        `[SMM Turk Error] Order ${order.orderId}:`,
        data?.error || text
      );
    }
  } catch (err: any) {
    order.smmStatus = 'failed';
    order.smmError = err?.message || 'Network error contacting SMM Turk';
    console.error(`[SMM Turk Exception] Order ${order.orderId}:`, err);
  }
}

// Pay0: Webhook Callback
const handlePaymentCallback = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const payload: Record<string, any> = {
      ...(req.query || {}),
      ...(typeof req.body === 'object' && req.body !== null ? req.body : {}),
    };

    console.log('[Pay0 Webhook] Received:', {
      method: req.method,
      query: req.query,
      body: req.body,
    });

    const orderId = String(
      payload.order_id ||
        payload.orderId ||
        payload.order_no ||
        ''
    ).trim();

    const status = String(payload.status || '').toUpperCase();
    const amount = Number(payload.amount || payload.orderAmount) || 0;
    const utr = String(payload.utr || '').trim();
    const receivedHash = String(payload.hash || '').trim();

    const secretKey = (process.env.PAY0_SECRET || PAY0_DEFAULT_SECRET).trim();
    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(orderId)
      .digest('hex');

    const isValidSignature =
      !receivedHash ||
      receivedHash.toLowerCase() === expectedHash.toLowerCase();

    if (!isValidSignature) {
      console.warn('[Pay0 Webhook] Invalid HMAC signature for order:', orderId);
      res.status(403).json({ success: false, error: 'Invalid signature' });
      return;
    }

    const isSuccessful = ['SUCCESS', 'PAID', 'COMPLETED', '1'].includes(
      status
    );

    if (orderId) {
      const existing = orderStore.get(orderId);
      if (existing) {
        orderStore.set(orderId, {
          ...existing,
          status: isSuccessful ? 'paid' : existing.status,
          utr: utr || existing.utr,
          gatewayTransactionId: utr || existing.gatewayTransactionId,
          amountPaid: amount || existing.amountPaid || existing.amount,
          updatedAt: new Date().toISOString(),
        });

        if (isSuccessful) {
          fulfillSmmTurkOrder(orderStore.get(orderId)!).catch(() => {});
        }
      }
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (err: any) {
    console.error('[Pay0 Webhook] Error:', err);
    res.status(500).json({ success: false, error: 'Internal webhook error' });
  }
};

router.post('/payment-callback', handlePaymentCallback);
router.get('/payment-callback', handlePaymentCallback);
router.post('/pay0/webhook', handlePaymentCallback);
router.post('/callback/notify', handlePaymentCallback);

// Pay0: Check Order Status
router.get('/order-status/:orderId', async (req, res) => {
  const id = String(req.params.orderId || '').trim();
  let order = orderStore.get(id);

  const apiKey = (process.env.PAY0_API_KEY || PAY0_DEFAULT_API_KEY).trim();

  // If order is pending or not found in memory, query Pay0 live API
  if ((!order || order.status === 'pending') && apiKey && id) {
    try {
      const checkParams = new URLSearchParams({
        user_token: apiKey,
        order_id: id,
      });

      const { status: checkHttpStatus, data: statusData } = await postPay0Form(
        'https://api.pay0.shop/apiv1/check-order-status',
        checkParams.toString(),
        12000
      );

      if (checkHttpStatus === 200 && statusData?.status) {
        const txnStatus = String(
          statusData?.result?.txnStatus || ''
        ).toUpperCase();

        if (txnStatus === 'SUCCESS') {
          const remoteAmount =
            Number(statusData?.result?.amount) || (order ? order.amount : 0);
          const remoteUtr = String(statusData?.result?.utr || '').trim();

          if (order) {
            order = {
              ...order,
              status: 'paid',
              utr: remoteUtr || order.utr,
              gatewayTransactionId: remoteUtr || order.gatewayTransactionId,
              amountPaid: remoteAmount || order.amount,
              updatedAt: new Date().toISOString(),
            };
            orderStore.set(id, order);
          } else {
            // Restore order record from live Pay0 response
            order = {
              orderId: id,
              amount: remoteAmount,
              currency: 'INR',
              status: 'paid',
              utr: remoteUtr,
              gatewayTransactionId: remoteUtr,
              amountPaid: remoteAmount,
              createdAt: statusData?.result?.date || new Date().toISOString(),
            };
            orderStore.set(id, order);
          }
        }
      }
    } catch (checkErr) {
      console.error('[Pay0 Status Check] Error querying live status:', checkErr);
    }
  }

  // If order is paid and hasn't been fulfilled on SMM Turk yet, fulfill it!
  if (
    order &&
    order.status === 'paid' &&
    !order.smmOrderId &&
    order.smmStatus !== 'submitted'
  ) {
    fulfillSmmTurkOrder(order).catch(() => {});
  }

  if (!order) {
    res.status(404).json({ ok: false, error: 'Order not found' });
    return;
  }
  res.json({ ok: true, order });
});

// Mount router on '/api'
app.use('/api', router);

export default app;
