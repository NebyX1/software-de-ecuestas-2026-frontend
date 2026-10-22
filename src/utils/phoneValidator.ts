export interface PhoneValidationResult { valid: boolean; sanitized: string; normalized: string }
// This validates formatting only. The backend checks normalized-number uniqueness; ownership is not verified.
export function validatePhone(raw: string): PhoneValidationResult {
  const sanitized = raw.replace(/[\s.\-()]/g, '').trim();
  const valid = /^(?:09\d{7}|(?:\+?598)9\d{7})$/.test(sanitized);
  const digits = sanitized.replace(/^\+/, '');
  const normalized = valid ? (digits.startsWith('598') ? `+${digits}` : `+598${digits.slice(1)}`) : '';
  return { valid, sanitized, normalized };
}
export function formatPhoneForDisplay(normalized: string): string {
  const body = normalized.slice(4);
  return normalized.startsWith('+598') && body.length === 8 ? `+598 ${body.slice(0, 2)} ${body.slice(2, 5)} ${body.slice(5)}` : normalized;
}
