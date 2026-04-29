/**
 * Pages Functions middleware for /api/reports/*
 *
 * Defence-in-depth verification of the Cloudflare Access JWT
 * (`Cf-Access-Jwt-Assertion` header). The Access policy at the Cloudflare
 * edge is the primary gate; this middleware re-verifies the JWT signature
 * and standard claims so the API is protected even if a request reaches
 * the function from a path that bypasses the edge policy.
 *
 * Required env vars (Cloudflare Pages dashboard):
 *   CF_ACCESS_TEAM_DOMAIN  e.g. "navora.cloudflareaccess.com"
 *   CF_ACCESS_AUD          the Access application's AUD tag
 *
 * Optional:
 *   REPORTS_AUTH_BYPASS=1  skip verification (LOCAL DEV ONLY — never set in prod)
 */

const JWKS_CACHE_TTL_MS = 5 * 60 * 1000;

let _jwksCache = null;
let _jwksCacheTime = 0;

export async function onRequest(context) {
  const { request, env, next } = context;

  if (env.REPORTS_AUTH_BYPASS === '1') {
    console.warn('[reports auth] BYPASS enabled — auth check skipped');
    return next();
  }

  const teamDomain = env.CF_ACCESS_TEAM_DOMAIN;
  const audience = env.CF_ACCESS_AUD;
  if (!teamDomain || !audience) {
    return jsonError(500, 'Server is missing CF_ACCESS_TEAM_DOMAIN or CF_ACCESS_AUD');
  }

  const jwt = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!jwt) return jsonError(401, 'Missing Cloudflare Access JWT');

  try {
    const { payload } = await verifyAccessJwt(jwt, teamDomain, audience);
    context.data = context.data || {};
    context.data.user = { email: payload.email || null, sub: payload.sub || null };
  } catch (err) {
    return jsonError(401, `JWT verification failed: ${err.message}`);
  }

  return next();
}

async function verifyAccessJwt(token, teamDomain, audience) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('malformed JWT');
  const [headerB64, payloadB64, sigB64] = parts;
  const header = JSON.parse(b64urlToString(headerB64));
  const payload = JSON.parse(b64urlToString(payloadB64));

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) throw new Error('token expired');
  if (payload.nbf && payload.nbf > now) throw new Error('token not yet valid');

  const expectedIssuer = `https://${teamDomain}`;
  if (payload.iss && payload.iss !== expectedIssuer) throw new Error('issuer mismatch');

  const audClaim = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audClaim.includes(audience)) throw new Error('audience mismatch');

  if (header.alg !== 'RS256') throw new Error(`unsupported alg: ${header.alg}`);

  const jwks = await fetchJwks(teamDomain);
  const jwk = jwks.keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('no matching JWK');

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const sig = b64urlToBytes(sigB64);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sig, data);
  if (!ok) throw new Error('signature invalid');

  return { header, payload };
}

async function fetchJwks(teamDomain) {
  const now = Date.now();
  if (_jwksCache && now - _jwksCacheTime < JWKS_CACHE_TTL_MS) return _jwksCache;
  const res = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`);
  _jwksCache = await res.json();
  _jwksCacheTime = now;
  return _jwksCache;
}

function b64urlToString(s) {
  return new TextDecoder().decode(b64urlToBytes(s));
}

function b64urlToBytes(s) {
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function jsonError(status, error) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
