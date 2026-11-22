// Bundles the compiled Vercel Function entry (dist/serverless.js, emitted by `nest build`)
// into one ES module: dist/serverless.bundle.js, which api/index.js serves.
//
// Why: @nestjs/throttler and nestjs-pino are CommonJS and `require()` @nestjs/common,
// which is ESM only. Node 22+ allows that natively, but the Vercel Functions loader
// does not (ERR_REQUIRE_ESM). Bundling resolves those requires at build time.
//
// Nest and everything that shares its singletons (@nestjs/*, rxjs, reflect-metadata)
// is bundled together, so there is exactly one copy of each. Native modules, packages
// that read their own files at run time and the Redis stack (unused by the inline
// job runner) stay external; Vercel traces and ships them from node_modules.
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const apiDir = path.resolve(import.meta.dirname, '..');
const { dependencies } = JSON.parse(readFileSync(path.join(apiDir, 'package.json'), 'utf8'));

/**
 * Loaded from node_modules at run time. Each must be a direct dependency of this
 * package: pnpm only links those into apps/api/node_modules, where the bundle resolves.
 */
const EXTERNAL = [
  // Native or file-reading packages.
  '@node-rs/argon2',
  'pdfkit',
  '@prisma/client',
  '@prisma/adapter-pg',
  // CommonJS packages with no Nest dependency.
  'bullmq',
  'ioredis',
  'stripe',
  'pino',
  'pino-http',
];

const notDirect = EXTERNAL.filter((name) => !(name in dependencies));
if (notDirect.length > 0) {
  throw new Error(
    `External packages must be direct dependencies of @paritas/api: ${notDirect.join(', ')}`,
  );
}

/**
 * Nest and Terminus import their optional integrations (@nestjs/microservices,
 * @mikro-orm/core, …) lazily, inside try/catch, only when an app uses them. Those are
 * not installed here, so an import that cannot be resolved stays external instead of
 * failing the bundle.
 */
const optionalImportsStayExternal = {
  name: 'optional-imports-stay-external',
  setup(builder) {
    const skipped = new Set();
    builder.onResolve({ filter: /^[^./]/ }, async (args) => {
      if (args.pluginData?.resolving) {
        return undefined;
      }
      const result = await builder.resolve(args.path, {
        kind: args.kind,
        importer: args.importer,
        resolveDir: args.resolveDir,
        pluginData: { resolving: true },
      });
      if (result.errors.length === 0) {
        return result;
      }
      skipped.add(args.path);
      return { path: args.path, external: true };
    });
    builder.onEnd(() => {
      if (skipped.size > 0) {
        console.info(
          `Left external (not installed, loaded only on demand): ${[...skipped].sort().join(', ')}`,
        );
      }
    });
  },
};

await build({
  plugins: [optionalImportsStayExternal],
  entryPoints: [path.join(apiDir, 'dist/serverless.js')],
  outfile: path.join(apiDir, 'dist/serverless.bundle.js'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node24',
  // Nest uses class names as injection tokens and in its logs.
  keepNames: true,
  external: EXTERNAL.flatMap((name) => [name, `${name}/*`]),
  // Bundled CommonJS code still calls require() for the external packages above,
  // and some of it reads __dirname / __filename. Set as globals, not declared, so
  // they can never clash with a top-level name inside the bundle.
  banner: {
    js: [
      "import { createRequire as __paritasCreateRequire } from 'node:module';",
      "import { fileURLToPath as __paritasFileURLToPath } from 'node:url';",
      "import { dirname as __paritasDirname } from 'node:path';",
      'globalThis.require ??= __paritasCreateRequire(import.meta.url);',
      'globalThis.__filename ??= __paritasFileURLToPath(import.meta.url);',
      'globalThis.__dirname ??= __paritasDirname(globalThis.__filename);',
    ].join('\n'),
  },
  logLevel: 'warning',
});

console.info('Bundled dist/serverless.bundle.js');
