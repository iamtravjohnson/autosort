import type { FetchLike } from '../util.js';

export const SPOTIFY_ACCOUNTS_URL = 'https://accounts.spotify.com';

/**
 * What AutoSort's features use: read and write playlists, read and change Liked Songs,
 * and upload smart-playlist cover images.
 */
export const SPOTIFY_SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-private',
  'playlist-modify-public',
  'user-library-read',
  'user-library-modify',
  'ugc-image-upload',
] as const;

/**
 * Every Web API scope useful to a personal library manager: the above plus follows, top
 * tracks, recently played, profile and playback. Excludes SDK-only and partner scopes.
 */
export const SPOTIFY_ALL_SCOPES = [
  ...SPOTIFY_SCOPES,
  'user-follow-read',
  'user-follow-modify',
  'user-top-read',
  'user-read-recently-played',
  'user-read-private',
  'user-read-email',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-read-playback-position',
] as const;

/** Scopes the user granted (from a token's `scope`) that `required` still lacks. */
export function missingScopes(granted: string, required: readonly string[] = SPOTIFY_SCOPES): string[] {
  const have = new Set(granted.split(/\s+/).filter(Boolean));
  return required.filter((s) => !have.has(s));
}

export interface TokenSet {
  accessToken: string;
  refreshToken: string;
  /** Epoch milliseconds. */
  expiresAt: number;
  scope: string;
}

export class SpotifyAuthError extends Error {
  constructor(
    message: string,
    /** OAuth error code, e.g. "invalid_grant" (user must reconnect). */
    readonly error: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'SpotifyAuthError';
  }
}

export interface AuthorizeUrlOptions {
  clientId: string;
  /** Must exactly match a Redirect URI in the Spotify app. HTTPS, or http://127.0.0.1:PORT for local dev (not "localhost"). */
  redirectUri: string;
  state: string;
  scopes?: readonly string[];
  /** Set for the PKCE flow (no client secret). */
  codeChallenge?: string;
  showDialog?: boolean;
}

export function buildAuthorizeUrl(opts: AuthorizeUrlOptions): string {
  const params = new URLSearchParams({
    client_id: opts.clientId,
    response_type: 'code',
    redirect_uri: opts.redirectUri,
    state: opts.state,
    scope: (opts.scopes ?? SPOTIFY_SCOPES).join(' '),
  });
  if (opts.codeChallenge) {
    params.set('code_challenge_method', 'S256');
    params.set('code_challenge', opts.codeChallenge);
  }
  if (opts.showDialog) params.set('show_dialog', 'true');
  return `${SPOTIFY_ACCOUNTS_URL}/authorize?${params}`;
}

const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

/** PKCE verifier + S256 challenge (Web Crypto; works in Node 20+, edge and browsers). */
export async function createPkcePair(): Promise<{ verifier: string; challenge: string }> {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const random = crypto.getRandomValues(new Uint8Array(64));
  const verifier = Array.from(random, (b) => alphabet[b % alphabet.length]).join('');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return { verifier, challenge: base64url(new Uint8Array(digest)) };
}

interface TokenRequest {
  clientId: string;
  /** Omit for PKCE. */
  clientSecret?: string;
  fetch?: FetchLike;
}

async function tokenRequest(req: TokenRequest, body: Record<string, string>, previousRefreshToken?: string): Promise<TokenSet> {
  const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
  const form = new URLSearchParams(body);
  if (req.clientSecret) headers.Authorization = `Basic ${btoa(`${req.clientId}:${req.clientSecret}`)}`;
  else form.set('client_id', req.clientId);

  const res = await (req.fetch ?? fetch)(`${SPOTIFY_ACCOUNTS_URL}/api/token`, { method: 'POST', headers, body: form.toString() });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const error = typeof data.error === 'string' ? data.error : 'token_error';
    const description = typeof data.error_description === 'string' ? data.error_description : res.statusText;
    throw new SpotifyAuthError(`Spotify token request failed: ${description}`, error, res.status);
  }
  const refreshToken = (data.refresh_token as string | undefined) ?? previousRefreshToken;
  if (!refreshToken) throw new SpotifyAuthError('Spotify did not return a refresh token', 'missing_refresh_token', res.status);
  return {
    accessToken: data.access_token as string,
    refreshToken,
    expiresAt: Date.now() + Number(data.expires_in ?? 3600) * 1000,
    scope: (data.scope as string | undefined) ?? '',
  };
}

export function exchangeCode(
  req: TokenRequest & { code: string; redirectUri: string; codeVerifier?: string },
): Promise<TokenSet> {
  const body: Record<string, string> = { grant_type: 'authorization_code', code: req.code, redirect_uri: req.redirectUri };
  if (req.codeVerifier) body.code_verifier = req.codeVerifier;
  return tokenRequest(req, body);
}

/** Refresh an access token. Spotify may omit a new refresh token; the old one is kept then. */
export function refreshTokens(req: TokenRequest & { refreshToken: string }): Promise<TokenSet> {
  return tokenRequest(req, { grant_type: 'refresh_token', refresh_token: req.refreshToken }, req.refreshToken);
}

export function isExpired(tokens: Pick<TokenSet, 'expiresAt'>, skewMs = 60_000, now = Date.now()): boolean {
  return tokens.expiresAt - skewMs <= now;
}
