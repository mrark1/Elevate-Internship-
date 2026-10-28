import bcrypt from 'bcryptjs';
import { db } from '../src/db/database.js';
import { config } from '../src/config.js';

const hash = bcrypt.hashSync(config.ADMIN_PASSWORD, 12);
db.prepare(`INSERT INTO admins (username,password) VALUES (?,?)
  ON CONFLICT(username) DO UPDATE SET password=excluded.password`).run(config.ADMIN_USERNAME, hash);
console.log(`Seeded admin account "${config.ADMIN_USERNAME}".`);
db.close();
