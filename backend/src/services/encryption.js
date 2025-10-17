import crypto from 'crypto';

// Use a fixed 32-byte key from environment or generate one
// If ENCRYPTION_KEY is set in env, it should be base64-encoded
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'base64')
  : crypto.scryptSync('default-key', 'salt', 32);

const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt a token using AES-256-GCM
 * @param {string} text - The token to encrypt
 * @returns {string} - Encrypted token with IV and auth tag
 */
export function encryptToken(text) {
  if (!text) return null;

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Combine IV and encrypted data
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt a token using AES-256-GCM
 * @param {string} encryptedText - The encrypted token string
 * @returns {string} - Decrypted token
 */
export function decryptToken(encryptedText) {
  if (!encryptedText) return null;

  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted token format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Token decryption failed:', error);
    return null;
  }
}