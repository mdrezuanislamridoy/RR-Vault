import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly config: ConfigService) {
    const secret = this.config.getOrThrow<string>('ENCRYPTION_KEY');
    this.key = Buffer.from(secret.padEnd(32, '0').slice(0, 32), 'utf8');
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return iv.toString('hex') + tag.toString('hex') + encrypted.toString('hex');
  }

  decrypt(ciphertext: string): string {
    try {
      const iv = Buffer.from(ciphertext.slice(0, 24), 'hex');
      const tag = Buffer.from(ciphertext.slice(24, 56), 'hex');
      const encrypted = Buffer.from(ciphertext.slice(56), 'hex');
      const decipher = createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(tag);
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);
      return decrypted.toString('utf8');
    } catch {
      return ciphertext;
    }
  }
}
