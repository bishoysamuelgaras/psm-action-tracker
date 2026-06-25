# Netlify Vite/Rolldown binding fix

This patch fixes Netlify build failures caused by:

- Node 20.18.1 being lower than Vite 8 requirements.
- Missing native Rolldown Linux binding on Netlify.

Changes:

- Updated `.nvmrc` to Node `20.19.0`.
- Updated `netlify.toml` build command to `npm run build:netlify`.
- Added `build:netlify` script that installs the required Linux native Rolldown binding before building.
- Pinned `vite` to `8.1.0` and `@vitejs/plugin-react` to `5.2.0` so the native binding version remains stable.

After applying, push to GitHub and trigger **Clear cache and deploy site** on Netlify.
