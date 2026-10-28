import { Router } from 'express';
import { db } from '../db/database.js';
import { publicCertificate } from '../utils.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/verify/:certificateId', (req, res) => {
  const certificateId = String(req.params.certificateId || '').trim();
  const row = db.prepare(`SELECT c.certificateId, a.name, a.phone, c.issuedOn, c.status
    FROM certificates c JOIN applications a ON a.applicationId = c.applicationId
    WHERE c.certificateId = ?`).get(certificateId);
  if (!row) return res.status(404).json({ success: false, message: 'Certificate not found.' });
  return res.json({ success: true, ...row });
});

router.get('/', requireAdmin, (req, res) => {
  const rows = db.prepare(`SELECT c.certificateId,c.applicationId,a.name,a.phone,a.city,a.state,c.issuedOn,c.status
    FROM certificates c JOIN applications a ON a.applicationId=c.applicationId ORDER BY c.issuedOn DESC`).all();
  return res.json({ success: true, count: rows.length, certificates: rows });
});

// The SRS specifies GET for this endpoint; PATCH is also supported as a conventional mutation method.
function revoke(req, res) {
  const certificate = db.prepare('SELECT certificateId,status FROM certificates WHERE certificateId = ?').get(req.params.certificateId);
  if (!certificate) return res.status(404).json({ success: false, message: 'Certificate not found.' });
  if (certificate.status === 'Revoked') return res.json({ success: true, message: 'Certificate is already revoked.', certificateId: certificate.certificateId, status: 'Revoked' });
  db.prepare(`UPDATE certificates SET status='Revoked' WHERE certificateId=?`).run(certificate.certificateId);
  return res.json({ success: true, message: 'Certificate revoked.', certificateId: certificate.certificateId, status: 'Revoked' });
}
router.get('/:certificateId/revoke', requireAdmin, revoke);
router.patch('/:certificateId/revoke', requireAdmin, revoke);

export default router;
