import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function requireAdmin(req, res, next) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ success: false, message: 'Admin authentication required.' });
  }
  try {
    const payload = jwt.verify(token, config.JWT_SECRET, { issuer: 'credvault-api', audience: 'credvault-admin' });
    req.admin = { username: payload.sub };
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired admin token.' });
  }
}
