# Netlify Lightning CSS Native Binding Fix

## Problem
Netlify installed dependencies but Vite failed while loading `vite.config.ts` because the Linux native optional package for Lightning CSS was missing:

```text
Cannot find module ../lightningcss.linux-x64-gnu.node
Require stack: node_modules/lightningcss/node/index.js
```

## Fix
Updated `package.json` `build:netlify` script to explicitly install the Linux native optional packages required by Netlify before running the build:

- `@rolldown/binding-linux-x64-gnu@1.1.3`
- `lightningcss-linux-x64-gnu@1.32.0`
- `@tailwindcss/oxide-linux-x64-gnu@4.3.1`

This avoids npm optional dependency skipping issues in Netlify Linux builds.

## Deploy
After applying the patch, commit and push, then run **Clear cache and deploy site** from Netlify.
