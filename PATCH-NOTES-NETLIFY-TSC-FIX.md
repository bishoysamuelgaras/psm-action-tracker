# Netlify tsc/vite install fix

This patch fixes Netlify builds failing with:

`sh: 1: tsc: not found`

Changes:
- Build-critical packages are installed as regular dependencies so they are available even if Netlify/npm omits devDependencies.
- Build script calls local package entrypoints directly instead of relying on shell PATH binaries.
- Node is pinned to `20.18.1`.
- npm is pinned to `10.8.2`.
- Netlify install flags explicitly include dev packages and use legacy peer resolution.

After pushing:
1. Commit and push these files.
2. In Netlify, run **Trigger deploy → Clear cache and deploy site**.
3. Remove any old UI env vars such as `NODE_ENV=production`, `NPM_CONFIG_OMIT=dev`, or `NPM_CONFIG_PRODUCTION=true` if present.
