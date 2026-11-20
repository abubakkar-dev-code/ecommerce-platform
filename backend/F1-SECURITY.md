# F1 management authorization

All 20 POST/PATCH/DELETE management routes for products, variants, inventories,
product images, categories, and brands now execute `authenticate` followed by
`authorize("admin")` before their controller. Image routes execute both guards
before Multer. Existing API paths and public catalog GET routes are preserved.
An authenticated non-admin now receives 403; missing/invalid JWTs receive 401.

## Inventory read decision

The owner approved exposing storefront availability only. The existing public
`GET /api/inventories/varient/:id` keeps its response envelope and returns:

```json
{ "varient": "variant-object-id", "inStock": true }
```

`inStock` means `quantity > reservedQuantity`. Exact quantities, reserved counts,
thresholds, inventory record IDs, version fields, and timestamps are omitted.
Missing inventory retains its existing 404. No frontend inventory API consumers
were found during inspection. External consumers expecting the full inventory
document must adapt; no replacement admin read API is introduced in this task.

## F3 account-status enforcement

Authentication now loads the account before granting access: deleted accounts
receive 401 and disabled accounts receive 403. The F1 suite checks both before
controllers/uploads. Password login and OAuth also enforce account activity.
Session revocation remains separate work; token signing and expiry are unchanged.
The OAuth callback rechecks existence/activity immediately before issuing a JWT.
New Google signups remain supported: deleting an account does not permanently ban
that identity from signing up again, since no identity tombstone is maintained.

## Verification

```sh
npm run typecheck
npm run build
npm run test:smoke
npm run test:security
```

The security suite uses real Express routes, JWT verification, role middleware,
error handling, and Multer parsing. User/inventory reads and controller bodies
are mocked. Upload storage is local/fake; a Cloudinary guard fails if called.
It verifies all 20 management endpoints, all 12 public reads, three multipart
upload endpoints, deleted-account rejection, and disabled-admin rejection.
It never connects to MongoDB or calls live payment, email, OAuth, or upload APIs.
These tests verify authorization and controller dispatch, not business logic or
database/provider integration. The security command also runs account-status
tests for JWT access, password login, and OAuth. Other audit findings remain
outside this change.
