# CredVault Backend — ELEVATE SDE Task 3

Backend API and SQLite database for the **Certificate Issuing & Verification Platform**. Implements the Task 3 SRS: certificate requests, application tracking, public certificate verification, admin login, protected application management, approval/rejection, certificate listing and revocation.

## Technology

- **Runtime:** Node.js (20+)
- **Framework:** Express
- **Database:** SQLite via `better-sqlite3`
- **Validation:** Zod
- **Authentication:** bcrypt password hashes + signed JWT bearer tokens
- **Security:** Helmet, CORS allow-list, JSON body limit, rate limiting, parameterized SQL

No frontend is included, as required by Task 3.

## Quick start

1. Install Node.js 20 or newer.
2. Extract this project and open its folder in a terminal.
3. Install dependencies and configure environment:

```bash
npm install
cp .env.example .env
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

4. **For local demo only**, keep the sample `ADMIN_USERNAME=admin` and `ADMIN_PASSWORD=admin` values, then seed the admin account:

```bash
npm run db:seed
```

5. Start the server:

```bash
npm run dev
```

Default API base URL: `http://localhost:4000`

Health check: `GET http://localhost:4000/api/health`

SQLite database is created automatically at `./data/credvault.sqlite`.

> Before deploying, set a strong unique `JWT_SECRET` (at least 32 characters), change the demo admin password, use HTTPS, and configure `CORS_ORIGIN` to the trusted frontend origin. The `.env` file must never be committed. This is an internship demonstration, not a security-audited production service.

## API endpoints

All JSON request bodies use `Content-Type: application/json`. Protected routes require `Authorization: Bearer <token>` returned by admin login.

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Health check |
| POST | `/api/applications` | Public | Submit certificate request |
| GET | `/api/applications/track/:applicationId` | Public | Track an application |
| GET | `/api/certificates/verify/:certificateId` | Public | Verify certificate |
| POST | `/api/admin/login` | Public | Admin login; returns JWT |
| GET | `/api/admin/me` | Admin | Validate token / current admin |
| GET | `/api/applications` | Admin | List all applications |
| PATCH | `/api/applications/:applicationId/approve` | Admin | Approve and issue a certificate |
| PATCH | `/api/applications/:applicationId/reject` | Admin | Reject a pending application |
| GET | `/api/certificates` | Admin | List certificates |
| GET | `/api/certificates/:certificateId/revoke` | Admin | Revoke certificate (matches SRS) |
| PATCH | `/api/certificates/:certificateId/revoke` | Admin | Conventional alternative for revocation |

## Example requests

### 1. Request a certificate

```bash
curl -X POST http://localhost:4000/api/applications \
  -H "Content-Type: application/json" \
  -d '{"name":"Aarav Sharma","phone":"9876543210","gender":"Male","city":"Kanpur","state":"Uttar Pradesh"}'
```

Example response (`201`):

```json
{
  "success": true,
  "message": "Application submitted successfully.",
  "applicationId": "APP-<generated-id>",
  "status": "Pending"
}
```

Application IDs are randomly generated and unique in the database.

### 2. Track an application

```bash
curl http://localhost:4000/api/applications/track/APP-YOURID
```

Success returns `applicationId`, `name`, `status`, and `submittedAt`. Unknown IDs return `404`.

### 3. Admin login

```bash
curl -X POST http://localhost:4000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

Copy the returned `token` and send it on protected endpoints:

```bash
curl http://localhost:4000/api/applications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Approve and issue a certificate

```bash
curl -X PATCH http://localhost:4000/api/applications/APP-YOURID/approve \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Approval and certificate creation happen in a SQLite transaction. The response includes the generated `certificateId`.

### 5. Verify a certificate

```bash
curl http://localhost:4000/api/certificates/verify/CERT-YOURID
```

Returns certificate ID, holder name, phone, issue date, and status. A revoked certificate remains discoverable and reports `Revoked`.

### 6. Reject an application

```bash
curl -X PATCH http://localhost:4000/api/applications/APP-YOURID/reject \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Supporting details are incomplete"}'
```

The `reason` is optional. Approved applications cannot be rejected; use certificate revocation for an issued certificate.

### 7. Revoke a certificate

The SRS specifies `GET` for revocation:

```bash
curl -X GET http://localhost:4000/api/certificates/CERT-YOURID/revoke \
  -H "Authorization: Bearer YOUR_TOKEN"
```

The implementation also supports `PATCH` for the same action. Revocation updates only the certificate status; the original application remains Approved.

## Data models

- **Applications:** `applicationId`, `name`, `phone`, `gender`, `city`, `state`, `status`, `submittedAt`; optional `rejectionReason` for admin workflow.
- **Certificates:** `certificateId`, `applicationId`, `issuedOn`, `status`.
- **Admins:** `username`, `password` (bcrypt hash; plaintext passwords are never stored).

Status values follow the SRS: application `Pending`, `Approved`, `Rejected`; certificate `Valid`, `Revoked`.

## Validation and error handling

- Required fields validated before database writes.
- Phone number must be exactly 10 digits.
- Gender is restricted to `Male`, `Female`, or `Other`.
- Invalid payload: `400`; unknown records/routes: `404`; invalid login/missing or expired token: `401`; conflicting state transition: `409`.
- SQL statements use bound parameters.
- Certificate IDs are unique; each application can have at most one certificate.

## Tests

```bash
npm test
```

Tests cover public ID format and removal of internal database fields from public representations. Run the tests after installing dependencies.

## Connect Task 2 frontend

Set the frontend's API base URL to `http://localhost:4000/api` during local development. Ensure the frontend origin is listed in `CORS_ORIGIN` (default `http://localhost:5173`). Replace browser-only demo actions in Task 2 with fetch calls to these endpoints.

## GitHub submission

Create a repository named **`ELEVATE-SDE-Task-3`** and run these commands from this project directory:

```bash
git init
git add .
git commit -m "Build CredVault backend APIs and SQLite database"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/ELEVATE-SDE-Task-3.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username. Task 3 does not require screenshots.
