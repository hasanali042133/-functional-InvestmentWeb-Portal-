import crypto from 'node:crypto';

// No 0/O or 1/I, so a reference cannot be misread when a customer reads it back.
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export const generateTxnRef = (prefix = 'INV', length = 8) => {
  const bytes = crypto.randomBytes(length);
  let ref = '';

  for (let i = 0; i < length; i += 1) {
    ref += ALPHABET[bytes[i] % ALPHABET.length];
  }

  return `${prefix}-${ref}`;
};
