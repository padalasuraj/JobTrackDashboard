# Deploy JobTrack: Vercel + Render + Neon

This guide prepares a shareable personal/portfolio deployment using free service plans. A Java process needs a Java-capable host: Vercel hosts the Next.js frontend, Render runs the Spring Boot container, and Neon stores PostgreSQL data. The included configuration does not create accounts or deploy automatically from your laptop.

## 1. Push the project to your repository

Run the checks in the README, then push the project to a Git repository that Vercel and Render can access. Keep credentials out of Git. You need your own accounts with Vercel, Render, and Neon. Choose free plans and review each provider's current allowances before proceeding.

Use a stable Vercel **production** URL throughout setup. Preview URLs change and will not automatically be accepted by the backend's origin checks or Google's redirect allowlist.

## 2. Create the database on Neon

1. Create a project on the **Free** plan in a region near your Render service.
2. In the Connect dialog, select your database and Java/JDBC if offered. Record the host, database, username, and password.
3. Prepare a JDBC URL **without embedded username/password**:

   ```text
   jdbc:postgresql://YOUR_NEON_HOST/neondb?sslmode=require
   ```

4. Keep the credentials for Render. Do not put them in Vercel or a `NEXT_PUBLIC_` variable.

Neon requires TLS; preserve `sslmode=require` or use a stricter verified connection configuration. Use the host supplied by Neon rather than inventing or editing one. Connection pooling is available in the Connect dialog. [Neon connection guidance](https://neon.com/docs/connect/connect-from-any-app)

The backend automatically applies Flyway migrations on its first successful connection. Give this project its own database; do not reuse an unrelated production schema.

## 3. Create the frontend project on Vercel

1. Import your repository as a new Vercel project.
2. Keep the repository root as the **Root Directory** and choose **Next.js**.
3. Use the included `vercel.json`: install `npm ci`, build `npm run build`.
4. Create the project to obtain its production hostname, such as `https://jobtrack-example.vercel.app`.
5. The public home page can build before the API is ready. Authentication requires the backend configured in the next steps.

Vercel Hobby is for personal, non-commercial use and has usage caps. This setup is intended for a portfolio or personal tracker. [Vercel Hobby plan](https://vercel.com/docs/plans/hobby)

## 4. Create the Java service on Render

Use **New → Blueprint**, select the repository, and use root `render.yaml`. It declares **one Free web service**, with root directory `backend`, Dockerfile `./Dockerfile`, and health path `/api/health`. It does not create a paid database or persistent disk.

Enter these values when prompted:

| Variable | Value |
| --- | --- |
| `APP_URL` | Your exact Vercel production origin, e.g. `https://jobtrack-example.vercel.app` |
| `JDBC_DATABASE_URL` | `jdbc:postgresql://YOUR_NEON_HOST/neondb?sslmode=require` |
| `DATABASE_USERNAME` | Neon role/username |
| `DATABASE_PASSWORD` | Neon password |

The blueprint already sets `SPRING_PROFILES_ACTIVE=prod`, `COOKIE_SECURE=true`, disables local email logging, and constrains JVM memory for the small instance. Set no URL trailing slashes. Render supplies `PORT` automatically.

For manual creation instead of Blueprints, choose **Web Service → Docker → Free**, root directory `backend`, Dockerfile `./Dockerfile`, and the same environment variables plus the values from `render.yaml`.

Wait for the deploy to become healthy, then open:

```text
https://YOUR_RENDER_SERVICE.onrender.com/api/health
```

Expect an HTTP 200 health response. If startup fails, inspect Render logs for database connectivity, credentials, or migration errors. Do not switch production to H2 as a workaround: the free container filesystem is temporary.

Render supports Java through Docker. Its free services sleep after 15 minutes without incoming traffic and can take about a minute to wake. Allow for this first-request delay; free hosting is not an always-on production SLA. Free Render PostgreSQL expires after 30 days, so this guide uses Neon instead. [Render free limits](https://render.com/docs/free), [Render Docker/Java support](https://render.com/docs/faq)

## 5. Connect Vercel to Render

In Vercel → Project → Settings → Environment Variables, add:

```text
BACKEND_URL=https://YOUR_RENDER_SERVICE.onrender.com
```

Set it for **Production**, then redeploy the frontend. Do not add `/api` to the URL: the application appends the original `/api/...` path. Do not use `NEXT_PUBLIC_BACKEND_URL`.

Open these paths on the **Vercel domain**:

```text
/api/health
/api/auth/config
```

The health request should reach Java. Auth config will show Google/reset disabled until their optional credentials exist. Register a new account with an email and password, add an application, reload, and confirm it persists.

Next.js proxies requests to the backend under the website's `/api` path. Cookies therefore remain on the website's domain; no browser cross-domain token storage is required. [Vercel external rewrites](https://vercel.com/docs/routing/rewrites)

If `BACKEND_URL` changes, redeploy the frontend: Next.js reads deployment configuration during its build. If the Vercel domain changes, update Render's `APP_URL`, redeploy the backend, and update Google redirects too.

## 6. Enable Google sign-in

Email/password remains available without Google setup. To enable Google:

1. Open Google Cloud Console, create/select a project, and configure its OAuth consent/branding and audience.
2. Request only basic identity scopes: `openid`, `email`, `profile`. JobTrack does not need Gmail inbox access.
3. Create an OAuth client with application type **Web application**.
4. Add this exact **Authorized redirect URI**, using the Vercel domain:

   ```text
   https://YOUR_PROJECT.vercel.app/api/auth/google/callback
   ```

5. For local testing, add a separate allowed URI:

   ```text
   http://localhost:3000/api/auth/google/callback
   ```

6. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` on **Render**, then redeploy the backend. Keep the secret off Vercel and out of browser code.
7. Refresh `/api/auth/config` on the Vercel domain and confirm Google is enabled.
8. Test Google login from the website. The callback must use Vercel, rather than the Render hostname, so the state/session cookies belong to the correct origin.

For sign-in by people beyond your test list, choose an **External** audience and publish the OAuth app **In production**. A Testing app normally allows only listed test users. Complete any branding, privacy, domain, or verification requirements shown in Google's console before sharing widely. Organization-managed Google accounts can still impose administrator restrictions. [Google OAuth audience and publishing guidance](https://developers.google.com/identity/protocols/oauth2/production-readiness/overview), [Google publishing status](https://support.google.com/cloud/answer/15549945)

For security, a Google login does not silently merge with an existing password account having the same email. Use that account's password if prompted. Test both methods with appropriate separate accounts.

## 7. Optional password-reset email

The core tracker does not require email delivery. To enable production password recovery, configure an email provider account supported by the backend:

```text
RESEND_API_KEY=YOUR_SERVER_API_KEY
EMAIL_FROM=JobTrack <YOUR_AUTHORIZED_SENDER>
```

Add these to Render. The sender must be authorized for your email provider account, and free accounts may limit recipients until sender/domain setup is complete. A custom sender domain can cost money; if a zero-cost authorized sending setup is unavailable, leave recovery disabled rather than promising delivery. Keep the provider's current quotas in mind. The backend uses an HTTPS email API because Render's free tier restricts common outbound SMTP ports. [Render outbound SMTP limitations](https://render.com/docs/free)

Local development can instead set `DEV_EMAIL_LOG=true` to log a reset link in the backend terminal. Never enable that behavior on a public deployment; the production profile disables it.

## 8. Acceptance checklist before sharing

- The home page and sign-in pages render on mobile and desktop.
- A new email/password user can register and sign in using their own email.
- Google sign-in works for an account outside the Google test-user list, if enabled.
- A user can add, edit, change status, and delete an application.
- Application and status-check links open the intended external website.
- Search, status filters, sorting, pagination, and CSV export work.
- Reloading and signing out/in preserve saved records.
- Two accounts see separate workspaces; one cannot read or change the other's record IDs.
- Signing out makes protected API calls return `401`.
- The application handles an initially sleeping backend with a clear retry path.
- Database credentials, Google client secret, reset links, and session cookies are absent from public files/logs.

Record the actual deployed URL and test date for your resume. Do not advertise this as an unlimited or guaranteed-availability service: it runs within provider free-tier and audience policies.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Frontend works but login fails | Render awake/healthy, Vercel `BACKEND_URL`, frontend redeployed after changing env |
| Origin/403 error | Render `APP_URL` exactly matches the current browser origin, including `https` and hostname |
| Login appears successful but session disappears | Use one production domain, HTTPS, same-origin `/api`, and production secure cookies |
| Google `redirect_uri_mismatch` | Exact Vercel callback path allowlisted in the correct Google web client |
| Google denies another person | OAuth audience is External/In production; check Google account admin policies |
| Database startup error | JDBC prefix, correct host/database, TLS query, separate username/password, current Neon credentials |
| Data disappears after a backend restart | Ensure `prod` profile and Neon database; do not store hosted data in local H2 |
| First visit is slow | Free backend/database may be waking; wait briefly and retry |
| Vercel preview login fails | Production `APP_URL` and OAuth callbacks do not authorize arbitrary preview domains |

No production provider credentials or deployment URLs are embedded in this repository. You remain responsible for access to the hosting accounts and backups of your own data.
