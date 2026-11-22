// Vercel Function entry. vercel.json rewrites every path here. scripts/vercel-build.mjs
// compiles src/ with `nest build` and then bundles dist/serverless.js into one ES module
// (scripts/bundle-serverless.mjs explains why the function needs the bundle).
export { default } from '../dist/serverless.bundle.js';
