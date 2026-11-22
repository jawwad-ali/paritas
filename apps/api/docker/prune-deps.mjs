// Trims a `pnpm deploy --legacy` node_modules tree down to what one image runs.
//
//   node prune-deps.mjs <node_modules> --runtime
//     The API server. pnpm links a package's optional peers whenever the
//     workspace has them, so dev-only tools leak into the production tree:
//     `prisma` and `typescript` (optional peers of @prisma/client and
//     @nestjs/swagger) drag in Prisma Studio, PGlite, Effect and TypeScript
//     (~250 MB). The server loads neither, so those optional-peer links are cut.
//
//   node prune-deps.mjs <node_modules> --keep a,b,c
//     A one-off job (the migrator): only the listed top-level packages and
//     what they depend on survive.
//
// Both modes then drop the Prisma query compilers for databases we do not run
// (the schema's provider is PostgreSQL), delete every `.pnpm` store entry no
// longer reachable from the remaining top-level packages, and remove hoisted
// links left dangling.
import { lstat, readdir, readFile, readlink, realpath, rm, stat } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';

/** Dev tools that must never be linked into the server's tree as optional peers. */
const DEV_ONLY_PEERS = ['prisma', 'typescript'];
/** Must match `provider` in prisma/schema.prisma. */
const DATABASE_PROVIDER = 'postgresql';
const QUERY_COMPILER = /^query_compiler_\w+_bg\.(\w+)\./;

const [root, mode, keepList] = process.argv.slice(2);
if (!root || (mode !== '--runtime' && !(mode === '--keep' && keepList))) {
  throw new Error('Usage: node prune-deps.mjs <node_modules> (--runtime | --keep a,b,c)');
}
const store = await realpath(join(root, '.pnpm'));

/** Package folders in a node_modules folder, scoped ones expanded (`@scope/name`). */
const listPackages = async (dir) => {
  const found = [];
  for (const name of await readdir(dir).catch(() => [])) {
    if (name.startsWith('.')) continue;
    if (name.startsWith('@')) {
      for (const scoped of await readdir(join(dir, name))) found.push(join(dir, name, scoped));
    } else {
      found.push(join(dir, name));
    }
  }
  return found;
};

const packageName = (path, base) => relative(base, path).split(sep).join('/');
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const isStoreEntry = (name) => name !== 'node_modules' && !name.startsWith('.');

/** Cuts the dev-only links a store entry's package declares as optional peers. */
const cutDevOnlyPeers = async (entry) => {
  const modules = join(store, entry, 'node_modules');
  // The entry's own package is a real folder; its dependencies are links.
  const owners = [];
  for (const pkg of await listPackages(modules)) {
    if (!(await lstat(pkg)).isSymbolicLink()) owners.push(pkg);
  }
  for (const pkg of owners) {
    const { peerDependenciesMeta = {} } = await readJson(join(pkg, 'package.json'));
    for (const peer of DEV_ONLY_PEERS) {
      if (peerDependenciesMeta[peer]?.optional) await rm(join(modules, peer), { force: true });
    }
  }
};

/** Removes top-level packages that are not listed; fails if a listed one is absent. */
const keepOnly = async (names) => {
  const keep = new Set(names);
  const present = new Set();
  for (const pkg of await listPackages(root)) {
    const name = packageName(pkg, root);
    if (keep.has(name)) present.add(name);
    else await rm(pkg, { recursive: true, force: true });
  }
  const missing = [...keep].filter((name) => !present.has(name));
  if (missing.length > 0) throw new Error(`Not at the top level: ${missing.join(', ')}`);
};

// 1. Choose the roots.
if (mode === '--runtime') {
  for (const entry of await readdir(store)) {
    if (isStoreEntry(entry)) await cutDevOnlyPeers(entry);
  }
} else {
  await keepOnly(keepList.split(','));
}

// 2. Mark every store entry reachable from the remaining top-level packages.
const reachable = new Set();
const queue = [];
const visit = async (link) => {
  const target = await realpath(link).catch(() => null);
  const rel = target && relative(store, target);
  if (!rel || rel.startsWith('..')) return;
  const entry = rel.split(sep)[0];
  if (!reachable.has(entry)) {
    reachable.add(entry);
    queue.push(entry);
  }
};
for (const pkg of await listPackages(root)) await visit(pkg);
while (queue.length > 0) {
  for (const dep of await listPackages(join(store, queue.pop(), 'node_modules'))) await visit(dep);
}

// 3. Query compilers for other databases (~55 MB of WebAssembly).
for (const entry of reachable) {
  if (!entry.startsWith('@prisma+client@')) continue;
  const runtime = join(store, entry, 'node_modules', '@prisma', 'client', 'runtime');
  for (const file of await readdir(runtime)) {
    const provider = QUERY_COMPILER.exec(file)?.[1];
    if (provider && provider !== DATABASE_PROVIDER) await rm(join(runtime, file));
  }
}

// 4. Sweep unreachable store entries, then hoisted links left dangling.
let removed = 0;
for (const entry of await readdir(store)) {
  if (!isStoreEntry(entry) || reachable.has(entry)) continue;
  if (!(await stat(join(store, entry))).isDirectory()) continue;
  await rm(join(store, entry), { recursive: true, force: true });
  removed += 1;
}
for (const link of await listPackages(join(store, 'node_modules'))) {
  if (!(await lstat(link)).isSymbolicLink()) continue;
  const target = join(dirname(link), await readlink(link));
  if (!(await stat(target).catch(() => null))) await rm(link, { force: true });
}
console.info(`prune-deps ${mode}: kept ${reachable.size} packages, removed ${removed}`);
