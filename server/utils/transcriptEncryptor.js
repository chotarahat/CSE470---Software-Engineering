/**
 * Transcript Encryptor — AES-256-CBC
 *
 * Uses Node.js built-in `crypto` module — no extra dependencies needed.
 *
 * How it works:
 *   1. A random 32-byte key is generated for each export (one-time key)
 *   2. A random 16-byte IV (Initialization Vector) is generated per encryption
 *   3. The plaintext transcript is encrypted using AES-256-CBC
 *   4. The encrypted data + IV are combined into one buffer and base64-encoded
 *   5. The key is returned to the caller (shown once to the user)
 *
 * To decrypt:
 *   - Split the base64 buffer: first 16 bytes = IV, rest = ciphertext
 *   - Decrypt with the same key using AES-256-CBC
 *
 * Key format returned: hex string (64 characters)
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;   // AES block size
const KEY_BYTES = 32;   // 256 bits = 32 bytes

/**
 * Encrypts a plaintext string.
 * @param {string} plaintext
 * @returns {{ encryptedData: string, key: string }}
 *   encryptedData — base64 string (IV prepended to ciphertext)
 *   key           — hex string, shown once to the user
 */
const encryptTranscript = (plaintext) => {
  // Generate a fresh random key and IV for every export
  const key = crypto.randomBytes(KEY_BYTES);       // 32 bytes = 256-bit key
  const iv  = crypto.randomBytes(IV_LENGTH);       // 16 bytes IV

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt the plaintext (UTF-8 in, binary out)
  let encrypted = cipher.update(plaintext, 'utf8', 'binary');
  encrypted += cipher.final('binary');

  // Prepend IV to ciphertext so we can extract it on decryption
  // Format: [ 16 bytes IV | N bytes ciphertext ] → base64
  const ivBuffer        = Buffer.from(iv);
  const encryptedBuffer = Buffer.from(encrypted, 'binary');
  const combined        = Buffer.concat([ivBuffer, encryptedBuffer]);

  return {
    encryptedData: combined.toString('base64'),
    key: key.toString('hex'),   // 64-char hex string shown to user once
  };
};

/**
 * Decrypts an encrypted transcript.
 * @param {string} encryptedData — base64 string from encryptTranscript
 * @param {string} keyHex        — hex key string
 * @returns {string} plaintext
 */
const decryptTranscript = (encryptedData, keyHex) => {
  const combined = Buffer.from(encryptedData, 'base64');

  // Extract IV (first 16 bytes) and ciphertext (rest)
  const iv         = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  const key       = Buffer.from(keyHex, 'hex');
  const decipher  = crypto.createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(ciphertext, 'binary', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

module.exports = { encryptTranscript, decryptTranscript };