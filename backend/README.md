# Backend baseline verification

Run commands from `ecommerce-platform/backend` with dependencies already installed.

```sh
npm run typecheck
npm run build
npm run test:smoke
```

`test:smoke` builds the backend, imports the compiled Express app, and starts an
ephemeral loopback server. It checks liveness, 404 handling, authenticated route
mounting, validation paths, and distinct image update routes. It supplies dummy
integration settings and never imports `server.ts`, connects to MongoDB, or makes
payment, email, upload, OAuth, or Ollama calls. This is not a database integration
or production security test.

For real development startup, populate `.env` from `.env.example` with local/test
credentials, ensure MongoDB is available, and run `npm run dev`. Do not commit
secrets. Required-variable failures identify the missing variable, not its value.

`GET /api/health` returns `{"status":"ok"}`. It indicates HTTP liveness only,
not database or external service readiness.

Routes remain under `src/utils/routes`; no folder migration is required.
Primary image updates retain `PATCH /api/product-images/:productImageId`.
Thumbnail updates now use `PATCH /api/product-images/:productImageId/thumbnails`
with multipart field `thumbnails`; the formerly duplicated PATCH path could not
reach that handler.

Cloudinary remains the active upload provider. The optional, unused S3 client uses
the AWS SDK's standard region and credential provider chain (`AWS_REGION`,
`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and optional `AWS_SESSION_TOKEN`, or
an IAM role). AWS configuration is not required for application startup.

From each sibling frontend directory, run `npm run build` to check TypeScript and
produce the Vite bundle. Builds write generated output. To check app types without
emitting output, run:

```sh
node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit --incremental false
```

## User response contract (Phase A)

User objects now contain exactly `_id` (string), `name`, `email`, and `role`.
Registration, profile reads/updates and password reset return this object in
`data`; login keeps `data: { user, token }`. Password changes still return null
data. Existing status codes, messages, routes, JWTs and OAuth redirects are
preserved, except Google-only accounts now receive 401 for password verification
instead of a bcrypt error. The customer login/Redux contract uses these fields.

Passwords and Google IDs are excluded from normal Mongoose queries. Only login
and current-password verification explicitly select `+password`. Newly created
documents and explicitly selected hashes are still sanitized through the DTO.
Status flags, provider IDs, timestamps, version fields and future authentication
fields are not public user DTO fields. No database/index migration or credential
rewrite is needed. External clients relying on removed internal fields must adapt.

Run `npm run test:security` for F1/F3 and Phase A tests. Phase A uses real Mongoose
query projection/hydration/save logic with fake collection I/O; no live MongoDB,
Google, email, upload or payment service is contacted. This is not a real database
integration test. `npm run test:smoke` retains the existing initialization checks.

See [F1/F3 security notes](F1-SECURITY.md) and the
[remaining backend gap analysis and roadmap](BACKEND-ROADMAP.md). Refresh/session
rotation, token revocation, single-use resets, verified email/OAuth linking,
validation/error hardening and payment/inventory consistency remain outstanding.
Only Phase A user data security is implemented in this change.
