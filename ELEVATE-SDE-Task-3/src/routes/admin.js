import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../db/database.js';
import { config } from '../config.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
const loginSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200)
}).strict();

router.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Username and password are required.', errors: parsed.error.issues });
  const { username, password } = parsed.data;
  const admin = db.prepare('SELECT username,password FROM admins WHERE username=?').get(username);
  const valid = admin ? bcrypt.compareSync(password, admin.password) : false;
  if (!valid) return res.status(401).json({ success: false, message: 'Invalid username or password.' });
  const token = jwt.sign({}, config.JWT_SECRET, {
    subject: admin.username,
    expiresIn: config.JWT_EXPIRES_IN,
    issuer: 'credvault-api',
    audience: 'credvault-admin'
  });
  return res.json({ success: true, message: 'Admin login successful.', token, tokenType: 'Bearer', expiresIn: config.JWT_EXPIRES_IN, admin: { username: admin.username } });
});

router.get('/me', requireAdmin, (req, res) => res.json({ success: true, admin: req.admin }));
export default router;
