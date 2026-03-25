import { randomBytes } from 'crypto';

export function urlShortner(): string {
  return randomBytes(6).toString('base64url');
}
