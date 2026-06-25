# Deploy / npm install fix

## What changed

- Removed the heavy `@huggingface/transformers` dependency from the production dependency tree.
- Replaced the local browser LLM helper with a lightweight deterministic fallback so the feature remains stable without downloading model tooling during install/build.
- Added `@types/node` to devDependencies to fix `TS2688: Cannot find type definition file for 'node'`.
- Added `.nvmrc` with Node 20.
- Added Netlify build environment defaults in `netlify.toml`:
  - `NODE_VERSION = "20"`
  - `NPM_FLAGS = "--legacy-peer-deps"`
- Regenerated `package-lock.json`.

## Why

The previous dependency tree included a very large AI/model package which made npm install slow/heavy and also introduced protobuf-related audit issues. The project does not need that package for the dashboard/reporting workflow.

## Verified

- `npm ci --ignore-scripts --no-audit --no-fund --legacy-peer-deps`
- `npm run build`
