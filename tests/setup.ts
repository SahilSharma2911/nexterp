// Safety: make sure tests never touch the dev/prod DB.
const url = process.env.DATABASE_URL ?? "";
if (!/nexterp_test/.test(url)) {
  throw new Error(
    `Refusing to run tests: DATABASE_URL must point at nexterp_test (got "${url}")`,
  );
}
