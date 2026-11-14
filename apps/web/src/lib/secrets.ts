import 'server-only';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';

/**
 * AUTH_SECRET signs sessions and encrypts Spotify tokens. If the env var isn't set (the
 * Deploy button only asks for the Spotify and Last.fm keys), one is generated once and kept in the
 * database. Setting AUTH_SECRET later works too, but signs everyone out once.
 */
let cached: string | null = null;

export async function authSecret(): Promise<string> {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (cached) return cached;
  const d = db();
  const [row] = await d.select().from(schema.appSettings).where(eq(schema.appSettings.key, 'auth_secret'));
  if (row && typeof row.value === 'string') return (cached = row.value);
  const generated = Buffer.from(crypto.getRandomValues(new Uint8Array(48))).toString('base64url');
  await d.insert(schema.appSettings).values({ key: 'auth_secret', value: generated }).onConflictDoNothing();
  const [again] = await d.select().from(schema.appSettings).where(eq(schema.appSettings.key, 'auth_secret'));
  cached = String(again?.value ?? generated);
  return cached;
}

const enc = new TextEncoder();

async function aesKey(): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', enc.encode(await authSecret()), 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: enc.encode('autosort-token-encryption'), info: enc.encode('v1') },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Encrypt a secret for storage: "v1.<iv>.<ciphertext>" (base64url). */
export async function encrypt(plain: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(), enc.encode(plain));
  return `v1.${Buffer.from(iv).toString('base64url')}.${Buffer.from(data).toString('base64url')}`;
}

export async function decrypt(stored: string): Promise<string> {
  const [v, iv, data] = stored.split('.');
  if (v !== 'v1' || !iv || !data) throw new Error('Unreadable token');
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: Buffer.from(iv, 'base64url') },
    await aesKey(),
    Buffer.from(data, 'base64url'),
  );
  return new TextDecoder().decode(plain);
}

/** HMAC-SHA256 (base64url), for signed cookies. */
export async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(await authSecret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return Buffer.from(await crypto.subtle.sign('HMAC', key, enc.encode(value))).toString('base64url');
}

export function randomToken(bytes = 18): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(bytes))).toString('base64url');
}
