# Backend gap analysis and phased roadmap

Based on the current source, existing F1/F3 suites, and the security audit in the
project conversation. Implemented means code exists; it does not imply database,
Cloudinary, SMTP, Google, or Razorpay behavior has been verified in production.
Phase A and C1-C3 are implemented; Phase B remains incomplete. Later phases require a separate
pre-implementation review of files, API contracts, migrations, and tests.

## Current gaps

| Area | State | Actual code and remaining work |
| --- | --- | --- |
| Management authorization | Implemented | `src/utils/routes/*.ts` protects 20 writes before uploads; `middleware/auth.middleware.ts` rejects deleted/disabled accounts. Preserve F1/F3 tests. |
| User data | Phase A completed | `dto/user.dto.ts`, `models/user.model.ts`, `controllers/user.controller.ts`: allowlisted responses and private query fields. |
| Authentication lifecycle | Incomplete/missing | `utils/jwt.ts` issues access JWTs. No application refresh-token/session model, rotation, or revocation was found. Passport's `_refreshToken` parameter is a provider callback value, not an application refresh implementation. `logout` only acknowledges success. |
| Recovery and identity | Incomplete/unsafe | `user.controller.ts` does not consume successful reset tokens or revoke sessions; `config/passport.ts` links by email. Email verification/change verification is missing. OAuth JWT/reset links target localhost. |
| Validation/security boundary | Incomplete | Mostly presence/coercion checks; `error.middleware.ts` exposes unexpected messages. `app.ts` has hardcoded CORS origins and no security headers. Limits exist for forgot-password/AI, not login/registration. |
| Catalog CRUD/search | C1 completed and integration-tested | Existing controllers now validate writes/IDs, active relationships, unique SKUs, effective prices, category cycles and null parent changes. Shared catalog queries are bounded, use literal search, stable sorting and batched enrichment. The storefront was adapted to server pagination with explicit owner approval. |
| Image CRUD | C2 completed and integration-tested | JPEG/PNG/WebP are decoded/re-encoded before Cloudinary; update branches/status/relationships are fixed. Durable asset journaling/retry checks references before deletion. Optimistic concurrency rejects stale writes. |
| Inventory | C3 implemented | Transactional conditional allocation/confirmation/release enforces nonnegative available stock; 15-minute reservations and expiry worker exist. Admin quantity updates are audited, zero works, reserved counters are system-controlled, and public reads remain availability-only. |
| Customer commerce | Implemented but incomplete | Cart/wishlist/address controllers scope resources to the authenticated user. Orders reprice server-side and snapshot addresses. Integer validation, concurrency, stock reservations, restoration, and fulfillment transitions remain incomplete. |
| Pricing | Incomplete/policy-dependent | `order.controller.ts` sets shipping to zero; no coupon/discount implementation was found. Do not introduce discount features without confirmed requirements. |
| Payments | Unsafe/incomplete | `payment.controller.ts` verifies HMAC but permits repeat processing, mutates paid state before stock processing, and clears the whole current cart. No transaction, webhook, refund workflow, or reconciliation was found. |
| Admin backend | Mostly missing beyond catalog writes | Existing `order.routes.ts` is customer-scoped. Admin order/user management and analytics APIs are missing; admin `pages/Orders.tsx` and other management pages are placeholders, and `DashBoard.tsx` has sample metrics. |
| Operations/testing | Partial | Existing isolated smoke/security suites pass through mocked dependencies. Real DB transaction tests, deployment CI, readiness, structured logs, and backup/rollback checks remain to be added. |

## Priority and dependencies

1. **A: user-data boundary (this change).** Preserve auth envelopes; no data
   migration. Verify allowlists and real Mongoose projection/save behavior with
   mocked collection I/O, plus F1/F3 regression suites.
2. **B1: validated identity boundary.** Extend existing user routes/controllers,
   Passport, environment/CORS/error middleware. Add reusable schemas, safe errors,
   login/registration limits, verified email and explicit provider linking.
   Plan email-verification tokens and existing-account migration/grandfathering;
   test malformed input, pre-hijacking, provider subject mismatch, and throttling.
3. **B2: session lifecycle.** Add hashed refresh credentials/session records,
   atomic rotation/reuse detection, session/device listing and revocation,
   logout invalidation, and single-use reset consumption with session policy.
   Review refresh/logout/session API changes, cookie domain/SameSite/Secure and
   CSRF/Origin policy with frontend deployment before coding. Plan existing JWT
   transition and TTL/unique indexes. Test concurrent refresh, replay, logout,
   reset reuse, and session revocation. Depends on A/B1; no refresh system exists
   to preserve today.
4. **C1: catalog/upload repairs.** Preserve CRUD/controllers/models and extend
   validation, bounded search/filter/sort, active visibility rules, content
   inspection, dimension limits and compensating upload cleanup. Review response
   pagination compatibility and search indexes. Mock providers; test each CRUD
   operation and failed-upload cleanup before staging provider checks.
5. **C2: atomic inventory.** Add a coherent reservation/adjustment service and
   protected admin details without widening public availability. Decide stock
   semantics jointly with D/E before coding. Plan uniqueness/index cleanup,
   legacy quantities/reservations, audit records, and reservation expiry jobs.
   Test last-unit contention, zero adjustments, reservation release, and retries
   against a disposable replica-set MongoDB. Depends on validated C1 boundaries.
6. **D: customer order lifecycle.** Reuse cart/wishlist/address/order modules;
   add strict quantities, server pricing/shipping policy, durable order
   transitions, cancellation and exactly-once inventory restoration. Review
   order snapshot/state migration and API additions. Test cross-user access,
   stale prices, duplicate submissions, cancel/fulfillment races, and cart edits
   during checkout. Depends on B and C2; coordinate paid cancellation with E.
7. **E: payments (release blocker).** Extend existing Razorpay integration with
   idempotent payment transitions, raw-body signed webhooks, durable provider
   identifiers/events, capture/status validation, refunds, reconciliation and
   transactional DB changes. External Razorpay calls cannot join MongoDB
   transactions: use durable retry states/compensation. MongoDB transactions
   require a replica set or sharded cluster, not a standalone server. Review
   pending/paid legacy data and duplicate IDs before unique indexes. Test signed
   fixtures, replay, event reordering, partial failures, duplicate refunds and
   last-unit concurrency. Depends on C2/D contracts; design this jointly before
   implementing C2. Never enable real checkout before this phase is verified.
8. **F: admin operations.** Reuse catalog APIs; add active-admin-only inventory
   detail/adjustments, order fulfillment, safe user management and dashboard
   aggregates. Confirm metrics/time windows from the sample dashboard rather
   than inventing frontend contracts. Plan audit trails, pagination and indexes;
   prevent self-lockout/unsafe role changes. Test customer denial, disabled admins,
   customer-data allowlists, illegal transitions and aggregate accuracy. Depends
   on B/C/D/E; catalog work can finish earlier.
9. **G: release verification.** Complete existing environment/README/API docs,
   security headers, proxy-aware shared rate limits, structured redacted logging,
   readiness/graceful shutdown, CI, integration/load tests and backup/rollback
   exercises. Validation/errors/basic logging begin in B, not only at release.
   Review Node/runtime versions, HTTPS, secrets, database permissions/indexes,
   cookies/CORS, and staging vs production configuration before deployment.

## Decisions needed before later phases

- Customer/admin/API deployment domains and whether cookies are same-site.
- MongoDB topology, live data volume, existing paid orders, and migration window.
- India/INR/payment methods, shipping/tax rules, cancellation/refund policy, and
  reservation duration. Coupons/discounts are out of scope unless confirmed.
- Google signup/linking requirements, existing unverified accounts, email-change
  policy, session lifetime/device policy, and admin provisioning.
- Exact admin analytics/user-management requirements and staging credentials.

## C1 execution report

- Owner approved bounded server pagination and the minimal storefront adaptation.
- Existing route paths and `data` arrays remain; pagination metadata is added.
  Defaults: page 1, 9 rows, maximum 100 rows, maximum page 10000. Empty lists now
  return 200 with empty data. All write guards remain unchanged.
- Public products require active product, direct category and brand. Variants
  require an active product/parents. No automatic descendant deactivation or new
  draft/publication state is introduced. Out-of-stock products may still be browsed.
- Product enrichment embeds up to 100 active variants; the existing variant-list
  endpoint is paginated for larger sets. MongoDB 5.2+ is required by `$firstN`;
  integration was verified on the installed MongoDB 8.0 executable.
- Query inputs reject non-scalars, malformed IDs, invalid ranges and unknown
  fields. Names/slugs/descriptions/attributes and money are bounded. Prices are
  nonnegative with at most two decimal places; explicit zero/false updates work.
- SKU uniqueness relies on the existing unique database index, including racing
  creation. Added product/category/variant query indexes need normal deployment
  review; no production index or data migration was run.
- Verification: backend typecheck/build; 59 existing security tests; one smoke
  test; eight catalog integration tests against a fresh temporary mongod; customer
  production build. No live providers, production credentials or existing DBs used.
- New test command: `npm run test:catalog`. Requires `mongod` in PATH, or
  `TEST_MONGOD_PATH` pointing to its executable. It creates/deletes only a new temp
  test directory and never accepts a configured production database URI.
- Browser interactions and representative production-size query plans still need
  staging review. Category ancestry validation is bounded to 32 levels; concurrent
  hierarchy edits need serialization/transaction design before multi-admin editing
  can be considered race-proof.

The current request authorizes C1 through G sequentially, but decisions affecting
business rules, destructive migrations or further breaking contracts remain gated.

## C2 execution report

- Added `sharp` for actual content decoding, not just MIME/metadata checks.
  Limits: 5 MiB per file, one primary plus five thumbnails, 16 million pixels,
  8192 pixels per dimension, no animation. JPEG/PNG/WebP only; content must match
  MIME. Images are fully decoded/re-encoded as WebP without original metadata.
  Memory buffering happens only after active-admin guards. All request files are
  validated before any upload. Public paths and image response shapes remain.
- Fixed primary status 2001, unreachable all-thumbnail update, wrong image lookup,
  singular thumbnail deletion, `Product` reference, and stale write protection.
- `ImageAsset` is a durable journal written before provider calls. New uploads use
  unique server-generated IDs without overwriting. Failed/unknown outcomes are
  queued with a five-minute delay; pending crash leftovers are checked after one
  hour. Old assets are journaled before replacement; references are removed from
  the image document before provider deletion. Shared references prevent deletion.
  Database outages fail closed. Failed deletions retry with backoff using leased,
  bounded work batches. `server.ts` runs the worker every minute.
- Added a unique product-image-per-product index. BEFORE deployment, audit existing
  duplicate image documents and missing version fields; stop for approval before
  reconciling any production records. No production index/data migration was run.
- Verified backend checks/build, 59 security tests, one smoke test, eight catalog
  integration tests and nine image integration tests. Real temporary MongoDB,
  mocked Cloudinary; actual provider/CDN behavior and process-kill recovery remain
  staging checks. No real provider calls were made.
- `npm audit` reports eight dependency advisories (one critical, four high, three
  moderate), including transitive proxy-addr and direct mongoose/zod/nodemailer.
  No automatic potentially breaking upgrades were applied; resolve/retest in G.

## C3 approved policies and current work

- Owner approved reservation at order creation for 15 minutes; release on expiry,
  cancellation or payment failure; late payments require manual review rather
  than automatic fulfillment/refund.
- Owner approved requiring a replica set (or sharded cluster) for transactions.
- C3 verified on a new temporary single-node replica set: ten inventory/checkout
  integration tests cover contention, transaction rollback, release/expiry,
  confirmation/restoration idempotency, private stock details, order creation,
  cancellation, replay-safe stock confirmation and late-payment review.
- Stock invariants: integer quantity/reservedQuantity >= 0 and reservedQuantity
  <= quantity. Stock changes write audit records; callers cannot set reserved
  counters. Inventory deletion requires zero quantities and no active or confirmed
  reservations, preserving restoration capability.
- Checkout now creates the order and reservations in one transaction. Existing
  payment verification delegates stock confirmation to the reservation transaction
  (no repeated decrement); invalid signatures cannot downgrade paid records.
  Purchased cart quantities are removed without erasing later additions. These are
  necessary C3 integration hooks, not completion of E's webhook/refund lifecycle.
- Added active-admin GET `/api/inventories/:id`; public `/varient/:id` unchanged.
  PATCH accepts quantity/lowStockThreshold plus optional audit reason, rejects
  reservedQuantity, and returns 409 if stock would drop below reservations.
- Added order states `expired` and `payment_review`. The expiry worker runs every
  30 seconds; expiry checks also occur during confirmation. Verified payment-failure
  release exists as an idempotent service; provider failure-event wiring belongs E.
- `database.ts` requires a replica set/sharded cluster at actual server startup.
  No existing database or production credentials were used. Before deployment,
  audit duplicate variant inventory records and legacy quantity/reservation values;
  do not build the unique index or reconcile production records without review.
  Legacy unpaid orders without reservations cannot initiate payment; reconciliation
  of historical orders is a gated migration, not silently performed here.

## D/E approved commercial policy (implementation in progress)

- INR; Razorpay online payments only, no COD.
- Shipping: INR 49 below INR 999 discounted merchandise subtotal, otherwise free.
- Catalog prices include GST; configure product-specific rates, do not add GST twice.
- All financial calculations must use integer minor units.
- Cancellation before shipment; automatic full refunds of captured payments with
  duplicate protection. Shipping eligibility and tax configuration must be verified
  before production release. Detailed eligibility and shipping-tax policy await
  confirmation. D/E/F/G remain incomplete.

### D pricing checkpoint — 2026-11-17

- Checkout now calculates line totals, subtotal and shipping in integer paise,
  then exposes existing INR response fields for API compatibility. Shipping is
  INR 49 below INR 999 merchandise subtotal, otherwise free. GST remains included;
  no unapproved tax or discount rules were introduced.
- Payment creation uses the same strict INR-to-paise conversion. Nonfinite,
  negative, fractional-paise and unsafe amounts fail closed, including legacy
  catalog values; no existing records were migrated.
- Added `test:pricing` for threshold boundaries, precision, invalid quantities,
  invalid prices and safe-integer overflow. Updated the replica-set checkout
  regression to assert subtotal, shipping and total separately.
- This checkpoint does not complete D/E: duplicate checkout prevention, captured
  payment validation, signed webhooks, durable refunds/reconciliation and the
  remaining authentication/operations work still block production release.
- Paid-order cancellation now returns 409 until durable refunds are implemented,
  preventing a success response/stock restoration without returning customer funds.
  This is a temporary release guard; automatic full refunds remain required.
