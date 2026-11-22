// Build step of the API's Vercel project (apps/api/vercel.json runs it from apps/api).
// 1. Build the shared package and the API, then bundle the function entry.
// 2. Production only: apply pending migrations, then the idempotent seed (sources,
//    default matching rules, demo users), so the database always matches the code.
//    Preview builds touch no database.
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const apiDir = path.resolve(import.meta.dirname, '..');
const repoRoot = path.resolve(apiDir, '../..');

const run = (args, cwd) => execFileSync('pnpm', args, { cwd, stdio: 'inherit' });

run(['--filter', '@paritas/api...', 'build'], repoRoot);
execFileSync(process.execPath, ['scripts/bundle-serverless.mjs'], {
  cwd: apiDir,
  stdio: 'inherit',
});

if (process.env.VERCEL_ENV === 'production') {
  run(['exec', 'prisma', 'migrate', 'deploy'], apiDir);
  run(['exec', 'prisma', 'db', 'seed'], apiDir);
} else {
  console.info('Not a production build: skipping migrations and seed.');
}
