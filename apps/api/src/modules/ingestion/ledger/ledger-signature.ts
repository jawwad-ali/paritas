import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Ledger webhooks are signed like Stripe's: header `t=<unix seconds>,v1=<hex>`,
 * where v1 = HMAC-SHA256(secret, `${t}.${rawBody}`). Binding the timestamp into
 * the MAC and bounding its age defeats replay of captured requests.
 */
export const LEDGER_SIGNATURE_HEADER = 'x-paritas-signature';
export const LEDGER_SIGNATURE_TOLERANCE_SECONDS = 300;

const SIGNATURE_PATTERN = /^t=(\d+),v1=([0-9a-f]{64})$/;

const computeMac = (secret: string, timestamp: number, body: Buffer): Buffer =>
  createHmac('sha256', secret).update(`${timestamp}.`).update(body).digest();

export const signLedgerPayload = (
  body: Buffer,
  secret: string,
  timestamp: number = Math.floor(Date.now() / 1000),
): string => `t=${timestamp},v1=${computeMac(secret, timestamp, body).toString('hex')}`;

export const verifyLedgerSignature = (
  body: Buffer,
  header: string | undefined,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): boolean => {
  const match = header ? SIGNATURE_PATTERN.exec(header.trim()) : null;
  if (!match?.[1] || !match[2]) {
    return false;
  }
  const timestamp = Number(match[1]);
  if (Math.abs(nowSeconds - timestamp) > LEDGER_SIGNATURE_TOLERANCE_SECONDS) {
    return false;
  }
  const expected = computeMac(secret, timestamp, body);
  const provided = Buffer.from(match[2], 'hex');
  // Constant-time comparison: response timing reveals nothing about the MAC.
  return provided.length === expected.length && timingSafeEqual(provided, expected);
};
