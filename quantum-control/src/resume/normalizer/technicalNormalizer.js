/**
 * resume/normalizer/technicalNormalizer.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Technical Normalization Engine
 *
 * Performs foundational byte/string level sanitization prior to business rules:
 *  - Whitespace trimming
 *  - Email lowercasing
 *  - Unicode NFC normalization
 *  - Null safety
 * ─────────────────────────────────────────────────────────────────────────────
 */

export function technicalNormalize(data) {
  if (data === null || data === undefined) return null;

  if (typeof data === 'string') {
    return data.normalize('NFC').replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
  }

  if (Array.isArray(data)) {
    return data.map(item => technicalNormalize(item));
  }

  if (typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      if (key.toLowerCase() === 'email' && typeof value === 'string') {
        sanitized[key] = value.normalize('NFC').trim().toLowerCase();
      } else {
        sanitized[key] = technicalNormalize(value);
      }
    }
    return sanitized;
  }

  return data;
}
