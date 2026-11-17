# Tests

Service-level + unit tests (Vitest) for the DMS modules, run against a real
throwaway Postgres database so the inventory + GL posting paths are exercised
for real.

## One-time setup

```bash
createdb nexterp_test
npx prisma db push --url "postgresql://$USER@127.0.0.1:5432/nexterp_test"
```

(The URL is also set in `vitest.config.ts`; a safety check in `tests/setup.ts`
refuses to run unless `DATABASE_URL` points at `nexterp_test`.)

## Run

```bash
npm test          # once
npm run test:watch
```

## Coverage

- `warranty-eligibility` — unit, every branch (period, km limit, battery SoH).
- `vehicles` — CRUD, dup VIN, delete guard, options, related history.
- `dealers` — CRUD, dup code, vehicle count, delete guard.
- `job-cards` — totals, **complete issues stock + posts GL**, **cancel reverses
  both**, no-warehouse / insufficient-stock / draft-only guards, labour-only.
- `warranties` — coverage maths, active-only options, delete guard.
- `warranty-claims` — SoH eligibility + full OEM workflow + transition guards.
- `subsidy-schemes` — CRUD, dup code, active options, delete guard.
- `subsidy-claims` — KYC gate, e-voucher on approval, disburse, guards.
