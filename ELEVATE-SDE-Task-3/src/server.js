import { app } from './app.js';
import { config } from './config.js';
import './db/database.js';

const server = app.listen(config.PORT, () => {
  console.log(`CredVault API listening on http://localhost:${config.PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
});
function shutdown(signal) {
  console.log(`${signal} received. Closing server...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
