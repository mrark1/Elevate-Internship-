import test from 'node:test';
import assert from 'node:assert/strict';
import { createPublicId, publicApplication, publicCertificate } from '../src/utils.js';

test('application IDs use APP prefix and are unique-looking', () => {
  const id = createPublicId('APP', 5);
  assert.match(id, /^APP-[A-F0-9]{10}$/);
});
test('certificate IDs use CERT prefix', () => {
  assert.match(createPublicId('CERT', 6), /^CERT-[A-F0-9]{12}$/);
});
test('publicApplication omits internal database id and rejectionReason', () => {
  const result = publicApplication({ id: 7, applicationId: 'APP-X', rejectionReason: 'private', status: 'Rejected' });
  assert.equal(result.id, undefined);
  assert.equal(result.rejectionReason, undefined);
  assert.equal(result.applicationId, 'APP-X');
});
test('publicCertificate omits internal database id', () => {
  const result = publicCertificate({ id: 3, certificateId: 'CERT-X', status: 'Valid' });
  assert.equal(result.id, undefined);
  assert.equal(result.certificateId, 'CERT-X');
});
