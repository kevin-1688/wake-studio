import { ipAddress, next } from '@vercel/functions';

/**
 * Edge middleware for wake.com.tw
 * 邊緣中介層 — 在請求抵達網站前先行檢查。
 *
 * Two layers of protection:
 *   1. BLOCKED_IPS  — an explicit blocklist of exact IP addresses.
 *   2. proxycheck.io — blocks visitors arriving through a VPN, proxy,
 *      Tor exit node or datacenter, which is how a blocked person would
 *      try to come back with a fresh IP.
 *
 * NOTE: The specific "bad" IPs are best managed in the Vercel Firewall
 * dashboard (Project → Firewall). This file is the ONLY place that can
 * detect VPN/proxy usage — the Firewall cannot do that on its own.
 *
 * Fails OPEN everywhere: if the IP is unknown, the API key is missing, or
 * the lookup errors/times out, the visitor is allowed through so the site
 * never goes dark because of this middleware.
 */

export const config = {
  // Run on page navigations only. Skip /assets, robots, sitemap and any
  // static file extension so we don't burn API lookups on sub-resources.
  matcher: [
    '/((?!assets/|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:css|js|mjs|map|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf)$).*)',
  ],
};

// ─────────────────────────────────────────────────────────────────────────
// 1. Explicit IP blocklist (optional — the Vercel Firewall is the primary
//    place to manage these). Add exact IPv4/IPv6 strings, one per line.
// ─────────────────────────────────────────────────────────────────────────
const BLOCKED_IPS = new Set<string>([
  // '203.0.113.10',
  // '2001:db8::1',
]);

// ─────────────────────────────────────────────────────────────────────────
// 2. VPN / proxy detection settings (proxycheck.io)
// ─────────────────────────────────────────────────────────────────────────
const RISK_THRESHOLD = 80; // also block if proxycheck risk score >= this (0–100)
const FETCH_TIMEOUT_MS = 1500; // fail open if the lookup is slower than this
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // remember a verdict for 6 hours

// Per-isolate in-memory cache: ip -> { blocked, expires }
const cache = new Map<string, { blocked: boolean; expires: number }>();

async function isVpnOrProxy(ip: string): Promise<boolean> {
  const key = process.env.PROXYCHECK_API_KEY;
  if (!key) return false; // not configured -> never block

  const hit = cache.get(ip);
  if (hit && hit.expires > Date.now()) return hit.blocked;

  // vpn=1 -> flag VPNs as well as proxies; risk=1 -> include risk score.
  const url =
    `https://proxy.proxycheck.io/v2/${ip}` +
    `?key=${encodeURIComponent(key)}&vpn=1&risk=1`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return false; // API error -> fail open
    const data = (await res.json()) as Record<
      string,
      { proxy?: string; type?: string; risk?: number } | string
    >;
    const rec = data[ip];
    if (!rec || typeof rec === 'string') return false;

    const blocked =
      rec.proxy === 'yes' ||
      (typeof rec.risk === 'number' && rec.risk >= RISK_THRESHOLD);

    cache.set(ip, { blocked, expires: Date.now() + CACHE_TTL_MS });
    return blocked;
  } catch {
    return false; // timeout / network error -> fail open
  } finally {
    clearTimeout(timer);
  }
}

// Bilingual 403 page returned to blocked visitors.
function deny(): Response {
  const html = `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>403 — 拒絕存取 / Access denied</title>
<style>
  :root { color-scheme: dark; }
  body { font-family: system-ui, -apple-system, "Noto Sans TC", "PingFang TC", sans-serif;
    background:#0e0e10; color:#ededed; margin:0; min-height:100vh;
    display:flex; align-items:center; justify-content:center; padding:2rem; }
  .box { max-width:32rem; text-align:center; }
  h1 { font-size:4rem; margin:0 0 .25rem; letter-spacing:-.02em; }
  h2 { font-size:1.1rem; font-weight:600; margin:0 0 1rem; color:#fff; }
  p { color:#9a9aa2; line-height:1.7; margin:.4rem 0; }
  .en { font-size:.95rem; }
  .note { margin-top:1.5rem; font-size:.8rem; color:#5f5f68; }
</style>
</head>
<body>
  <div class="box">
    <h1>403</h1>
    <h2>很抱歉，您目前無法存取本網站</h2>
    <p>若您正在使用 VPN 或代理伺服器，請先關閉後再重新整理。</p>
    <p class="en">Access to this site is currently restricted. If you are using a
      VPN or proxy, please disable it and try again.</p>
    <p class="note">Reference: edge-403</p>
  </div>
</body>
</html>`;
  return new Response(html, {
    status: 403,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
    },
  });
}

export default async function middleware(request: Request) {
  const ip = ipAddress(request);

  // Cannot identify the caller -> allow (fail open).
  if (!ip) return next();

  // Layer 1: explicit blocklist.
  if (BLOCKED_IPS.has(ip)) return deny();

  // Layer 2: VPN / proxy / datacenter.
  if (await isVpnOrProxy(ip)) return deny();

  return next();
}
