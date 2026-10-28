import crypto from 'node:crypto';

export function createPublicId(prefix, bytes = 5) {
  return `${prefix}-${crypto.randomBytes(bytes).toString('hex').toUpperCase()}`;
}
export function todayIso() {
  return new Date().toISOString();
}
export function publicApplication(row) {
  if (!row) return null;
  const { id, rejectionReason, ...safe } = row;
  return safe;
}
export function publicCertificate(row) {
  if (!row) return null;
  const { id, ...safe } = row;
  return safe;
}
