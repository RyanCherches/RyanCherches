# Repertoire

Music submissions, administrator review, and difficulty-based contributor points.

## How it works

- Users create a Repertoire account with a unique username, private email address, and password of at least 12 characters. Registration creates their public profile and signs them in. No ChatGPT account is required by the application.
- A submission includes a title, composer, instrument, HTTPS recording/score link, and difficulty notes. This version accepts links, not file uploads.
- Submissions appear in the in-site Admin desk; email notifications are not configured.
- Administrators unlock review access using a password checked only on the server. The runtime stores a salted PBKDF2 hash in `ADMIN_PASSWORD_HASH`, never the password in source.
- Approving a piece adds it to the ranked list and credits its submitter. Denying it awards no points. Changing a decision recalculates totals without duplicate awards.
- Administrators assign difficulty from 1–1000. Points are `max(1, round(100 * difficulty / maximum accepted difficulty))`. The hardest accepted piece earns 100; tied difficulties earn the same amount. Account totals reflect the current list, so they can change as pieces are added or reranked.
- Case-insensitive title/composer/instrument duplicates are blocked, including previously denied submissions. Admins can reconsider a denial from the review history.
- Accounts, submissions, sessions, and attempt limits use the managed D1 database. This is not localStorage.

## Security and access

The Sites preview remains owner-private, so the hosting gateway still requires the owner’s ChatGPT sign-in before the preview is visible. For the later public deployment on ryancherches.com, remove that hosting-level restriction; the application independently requires its own account session to submit. Admin sessions expire after one hour, are tied to the signed-in account, and use Secure/HttpOnly/SameSite cookies. Mutations check Origin and server authorization. Password guesses are rate-limited per identity and across the site.

Account passwords are salted PBKDF2-SHA256 hashes. Random 256-bit session and recovery tokens are stored only as SHA-256 hashes. User sessions expire after seven days. Login accepts username or email and has attempt limits. Logout revokes the current session; password changes and recovery revoke every user/admin session and replace the recovery code. Email is private and unverified: no email delivery service is configured, so no verification or reset emails are sent. Users must save the one-time recovery code shown after signup.

Request identity headers never grant application access. The optional legacy migration reads authenticated Sites identity only during registration to preserve an old profile and its contributions. It never links records by email. This migration is disabled by default and runs only when the server environment variable SITES_LEGACY_MIGRATION is set to enabled. That setting is configured only on the existing Sites preview. Leave it unset when hosting outside the trusted Sites gateway.

To rotate the admin password, set a new random salt and PBKDF2-SHA256 hash (100000 iterations, 32 bytes), encoded as `salt:hexhash`, through the Sites secret settings and redeploy. Existing admin sessions last until expiry; revoke them in the database for immediate revocation.

## Development

Use Node 24 and the Sites installation/build workflow. `npm run db:generate` creates migrations. Local and hosted databases are separate. `npm run build` produces the Worker. Apply the generated migration with Wrangler's local D1 command before `npm start`.

`node tests/integration.mjs` tests a running local server on port 8787 with the explicitly supplied test-only admin secret. Never run it against production.

Layout inspiration: https://pointercrate.com/demonlist/ . Repertoire is an independent music project.

## Later deployment on ryancherches.com

This is a full-stack Cloudflare Worker app with D1, not a static HTML upload. A static-only host will not run accounts or persist points. The custom domain must route to a compatible backend (for example this Site with public access and a configured custom domain, or a separately provisioned Cloudflare Worker and D1 database). DNS/hosting has not been changed. Keep the production database, apply each migration once, and configure ADMIN_PASSWORD_HASH as a server secret. Keep Secure cookies and HTTPS. If using external hosting, leave SITES_LEGACY_MIGRATION unset.

## Prepared path: /music

The code supports a build-time subdirectory. For the domain deployment, build with:

```sh
NEXT_PUBLIC_APP_BASE_PATH=/music npm run build
```

This prefixes the app routes, browser API requests, asset URLs, home link, favicon, and cookie paths. Leave the variable unset for the existing root-level Sites preview. Always rebuild when changing this setting.

The domain is currently routed to GitHub Pages. A directory in that repository does not run the Worker. The domain host or an edge proxy must route **both /music and /music/** (including all descendants) to this app, preserving the complete path and the original HTTPS origin. Requests outside those paths must continue to the existing website. Do not strip /music from upstream requests or cache account/API responses. The Worker still needs a production D1 database and the ADMIN_PASSWORD_HASH secret; leave SITES_LEGACY_MIGRATION unset outside Sites. Do not use a private Sites access-bypass token as a public reverse proxy.

If using Cloudflare Worker routes, the domain must first be added to the authorized Cloudflare account with its existing DNS records preserved. No DNS, public-access, or production route changes have been made. The production database must be deliberately preserved/exported if moving away from Sites; local test records are not production data.

Local integration testing for this build uses `NEXT_PUBLIC_APP_BASE_PATH=/music node tests/integration.mjs` with the same local Worker/test-secret setup described above.
