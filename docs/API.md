# JobTrack API

The frontend calls these paths on its own origin, such as `https://your-project.vercel.app/api/applications`. Next.js forwards `/api` to the Java backend. JSON requests use `Content-Type: application/json` and browser cookies. Authenticated responses must not be cached publicly.

## Authentication

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Public health response |
| GET | `/api/auth/config` | Whether Google and password reset are configured |
| POST | `/api/auth/register` | Create an email/password account and session |
| POST | `/api/auth/login` | Sign in with email/password |
| GET | `/api/auth/me` | Current user; `401` without a valid session |
| POST | `/api/auth/logout` | Revoke session and clear cookie |
| GET | `/api/auth/google` | Begin configured Google authorization |
| GET | `/api/auth/google/callback` | Google redirect; use the website's public origin |
| POST | `/api/auth/forgot-password` | Request a reset link when delivery is enabled |
| POST | `/api/auth/reset-password` | Exchange a valid reset token for a new password |

Register:

```json
{ "name": "Alex", "email": "alex@gmail.com", "password": "a-long-unique-password" }
```

Login:

```json
{ "email": "alex@gmail.com", "password": "a-long-unique-password" }
```

Auth returns `{ "user": { "id": "...", "name": "Alex", "email": "alex@gmail.com", "provider": "..." } }` and an HttpOnly session cookie. Passwords and session tokens are never included in the user object.

## Applications

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/applications` | Search/filter/sort a page and retrieve summary counts |
| GET | `/api/applications/{id}` | Read one owned application |
| POST | `/api/applications` | Create an application |
| PUT | `/api/applications/{id}` | Replace editable application fields |
| PATCH | `/api/applications/{id}/status` | Change status only |
| DELETE | `/api/applications/{id}` | Delete an owned application; `204` on success |
| GET | `/api/applications/export` | Download an owned CSV export |

Example application body:

```json
{
  "company": "Example Company",
  "title": "Software Engineer",
  "salary": "8–12 LPA",
  "location": "Bengaluru",
  "workMode": "HYBRID",
  "status": "APPLIED",
  "applicationUrl": "https://example.com/careers/engineer",
  "statusUrl": "https://example.com/candidate/dashboard",
  "appliedDate": "2026-10-27",
  "deadline": null,
  "notes": "Referral submitted."
}
```

`company`, `title`, and `applicationUrl` are required. The Java API enforces field lengths and validates links and dates. Dates use `YYYY-MM-DD`; omit optional dates or send `null`. Package is a display string so users can preserve currencies and formats instead of forcing everything into INR.

Statuses: `SAVED`, `APPLIED`, `ASSESSMENT`, `INTERVIEW`, `OFFER`, `REJECTED`, `WITHDRAWN`. Work modes: `UNSPECIFIED`, `ONSITE`, `HYBRID`, `REMOTE`.

Create/update/status changes return `{ "application": { ... } }`. Records also include a server-generated ID and creation/update timestamps.

### Pagination and filtering

```text
GET /api/applications?search=engineer&status=APPLIED&sort=updated&page=0&size=20
```

| Query | Meaning |
| --- | --- |
| `search` | Match company, role, or location |
| `status` | One valid status; omit for all |
| `sort` | `updated`, `company`, or `applied` |
| `page` | Zero-based page index |
| `size` | Page size, from `1` to `100` |

Response shape:

```json
{
  "applications": [],
  "page": 0,
  "totalPages": 0,
  "totalElements": 0,
  "summary": { "total": 0, "active": 0, "interviews": 0, "offers": 0 }
}
```

Summary counts describe the user's whole workspace; the list count describes the selected filters. Every endpoint uses the signed-in user's identity, never a user ID supplied in the body.

### Errors

Errors include a safe `error` message. Typical HTTP statuses are `400` for malformed input, `401` for missing/expired authentication, `403` for a rejected origin, `404` for an inaccessible application, `409` for a conflict or workspace limit, `422` for field validation, and `429` for throttled authentication requests. Validation responses can also include a `fields` object. The UI handles network failure separately and lets users retry.

Each workspace allows up to 10,000 applications. Passwords require at least 10 characters and at most 72 UTF-8 bytes; this avoids BCrypt truncation. A successful password reset revokes existing sessions and asks the user to sign in again.

For scripts accessing unsafe endpoints, send an `Origin` header matching `APP_URL` as well as a valid session cookie. Browser use through the website supplies the origin automatically. Never put a session cookie in a public issue, screenshot, or README example.
