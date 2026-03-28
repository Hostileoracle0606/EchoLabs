import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  const rawKey = process.env.APP_ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error('APP_ENCRYPTION_KEY is required for encrypted provider credentials');
  }

  if (/^[A-Za-z0-9+/=]+$/.test(rawKey)) {
    try {
      const decoded = Buffer.from(rawKey, 'base64');
      if (decoded.length === 32) {
        return decoded;
      }
    } catch {
      // Fall through to hashed secret handling.
    }
  }

  return crypto.createHash('sha256').update(rawKey).digest();
}

export function encryptSecret(secret: string): {
  encryptedSecret: string;
  iv: string;
  authTag: string;
} {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedSecret: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

export function decryptSecret(encryptedSecret: string, iv: string, authTag: string): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedSecret, 'base64')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
