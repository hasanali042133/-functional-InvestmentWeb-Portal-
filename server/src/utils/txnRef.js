import crypto from 'node:crypto';

// Characters that cannot be confused when a customer reads a reference aloud or
// retypes it from a screenshot: no 0/O, no 1/I.
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generates a customer-facing transaction reference, e.g. `INV-7QK2M9XD`.
 *
 * Uniqueness is ultimately enforced by the unique index on `transactions.txn_ref`;
 * this only needs enough entropy that a collision is vanishingly unlikely.
 */
export const generateTxnRef = (prefix = 'INV', length = 8) => {
  const bytes = crypto.randomBytes(length);
  let ref = '';
  for (let i = 0; i < length; i += 1) {
    ref += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `${prefix}-${ref}`;
};
