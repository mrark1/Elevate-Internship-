export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err?.name === 'ZodError') {
    return res.status(400).json({ success: false, message: 'Validation failed.', errors: err.issues });
  }
  if (err?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ success: false, message: 'A record with this identifier already exists.' });
  }
  if (process.env.NODE_ENV !== 'production') console.error(err);
  return res.status(err.status || 500).json({
    success: false,
    message: err.status ? err.message : 'Internal server error.'
  });
}
