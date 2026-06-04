/** Generate a random 4-char hex segment (uppercase). */
const rand4 = () => Math.random().toString(16).slice(2, 6).toUpperCase();

/** Generate a full LSRD-XXXX-XXXX-XXXX key string. */
export const generateKeyString = () => `LSRD-${rand4()}-${rand4()}-${rand4()}`;

/** Compute expiry timestamp from type string. Returns null for lifetime. */
export function getExpiry(type) {
  const now = Date.now();
  const map = {
    '1day':    now + 86_400_000,
    '7days':   now + 7  * 86_400_000,
    '30days':  now + 30 * 86_400_000,
    'lifetime': null,
    'beta':    now + 30 * 86_400_000,
  };
  return map[type] ?? null;
}

/** Derive status object { cls, label } from a key document. */
export function keyStatus(key) {
  if (key.blacklisted)                          return { cls: 'banned',   label: 'Blacklistée' };
  if (key.expiresAt && Date.now() > key.expiresAt) return { cls: 'expired',  label: 'Expirée' };
  if (key.active)                               return { cls: 'active',   label: 'Active' };
  return                                               { cls: 'inactive', label: 'Non utilisée' };
}

/** Map key type to badge variant string. */
export function keyTypeBadge(type) {
  if (type === 'lifetime') return 'lifetime';
  if (type === 'beta')     return 'beta';
  return 'default';
}
