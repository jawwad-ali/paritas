// Vercel Function entry. vercel.json rewrites every path here; `nest build` (run by
// scripts/vercel-build.mjs) compiles src/ to dist/, where the Nest app lives.
export { default } from '../dist/serverless.js';
