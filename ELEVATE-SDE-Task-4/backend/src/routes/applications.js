import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { createPublicId, publicApplication, todayIso } from '../utils.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
const requestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^[0-9]{10}$/, 'Phone must contain exactly 10 digits'),
  gender: z.enum(['Male', 'Female', 'Other']),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100)
}).strict();

router.post('/', (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Please provide valid application details.', errors: parsed.error.issues });
  const data = parsed.data;
  let applicationId;
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = createPublicId('APP', 5);
    try {
      const result = db.prepare(`INSERT INTO applications (applicationId,name,phone,gender,city,state,status,submittedAt)
        VALUES (@applicationId,@name,@phone,@gender,@city,@state,'Pending',@submittedAt)`).run({
        ...data, applicationId: candidate, submittedAt: todayIso()
      });
      if (result.changes) { applicationId = candidate; break; }
    } catch (err) {
      if (err.code !== 'SQLITE_CONSTRAINT_UNIQUE') throw err;
    }
  }
  if (!applicationId) return res.status(500).json({ success: false, message: 'Could not generate an application ID. Please retry.' });
  return res.status(201).json({ success: true, message: 'Application submitted successfully.', applicationId, status: 'Pending' });
});

router.get('/track/:applicationId', (req, res) => {
  const applicationId = String(req.params.applicationId || '').trim();
  const row = db.prepare('SELECT applicationId,name,status,submittedAt FROM applications WHERE applicationId = ?').get(applicationId);
  if (!row) return res.status(404).json({ success: false, message: 'Application not found.' });
  return res.json({ success: true, ...row });
});

router.get('/', requireAdmin, (req, res) => {
  const rows = db.prepare(`SELECT applicationId,name,phone,gender,city,state,status,submittedAt,rejectionReason
    FROM applications ORDER BY submittedAt DESC`).all();
  return res.json({ success: true, count: rows.length, applications: rows });
});

router.patch('/:applicationId/approve', requireAdmin, (req, res) => {
  const run = db.transaction((applicationId) => {
    const app = db.prepare('SELECT * FROM applications WHERE applicationId = ?').get(applicationId);
    if (!app) return { error: 'not_found' };
    if (app.status === 'Rejected') return { error: 'rejected' };
    let cert = db.prepare('SELECT certificateId,applicationId,issuedOn,status FROM certificates WHERE applicationId = ?').get(applicationId);
    if (!cert) {
      let certificateId;
      for (let i=0;i<5;i++) {
        const candidate = createPublicId('CERT', 6);
        try {
          db.prepare(`INSERT INTO certificates (certificateId,applicationId,issuedOn,status) VALUES (?,?,?,'Valid')`)
            .run(candidate, applicationId, todayIso());
          certificateId = candidate; break;
        } catch (e) { if (e.code !== 'SQLITE_CONSTRAINT_UNIQUE') throw e; }
      }
      if (!certificateId) throw new Error('Could not generate a certificate ID.');
      cert = db.prepare('SELECT certificateId,applicationId,issuedOn,status FROM certificates WHERE applicationId = ?').get(applicationId);
    }
    db.prepare(`UPDATE applications SET status='Approved', rejectionReason=NULL WHERE applicationId = ?`).run(applicationId);
    return { applicationId, status: 'Approved', certificate: cert };
  });
  const result = run(req.params.applicationId);
  if (result.error === 'not_found') return res.status(404).json({ success: false, message: 'Application not found.' });
  if (result.error === 'rejected') return res.status(409).json({ success: false, message: 'A rejected application cannot be approved.' });
  return res.json({ success: true, message: 'Application approved and certificate issued.', ...result });
});

router.patch('/:applicationId/reject', requireAdmin, (req, res) => {
  const bodySchema = z.object({ reason: z.string().trim().max(500).optional() }).strict();
  const parsed = bodySchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid rejection details.', errors: parsed.error.issues });
  const app = db.prepare('SELECT applicationId,status FROM applications WHERE applicationId = ?').get(req.params.applicationId);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });
  if (app.status === 'Approved') return res.status(409).json({ success: false, message: 'An approved application cannot be rejected. Revoke its certificate instead.' });
  db.prepare(`UPDATE applications SET status='Rejected', rejectionReason=? WHERE applicationId=?`).run(parsed.data.reason || null, app.applicationId);
  return res.json({ success: true, message: 'Application rejected.', applicationId: app.applicationId, status: 'Rejected' });
});

export default router;
