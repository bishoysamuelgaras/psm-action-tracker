# Actions UI Bidi Text Fix

Applied a UI-only fix for mixed Arabic/English text rendering in the Actions area.

## What changed
- Added reusable Bidi helpers:
  - `BidiText`
  - `BidiBlock`
  - `BidiCode`
- Added CSS classes for Arabic/English mixed content:
  - `.bidi-text`
  - `.bidi-code-token`
  - `.bidi-inline-isolate`
- Action numbers and reference codes now render as isolated LTR tokens.
- Action title, description, recommendation text, evidence, progress notes, history, extension reasons, and attachment descriptions now render with automatic direction handling.
- Inputs, textareas, and selects now use `dir="auto"` / text-start behavior to support Arabic, English, or mixed input.

## Scope
- UI/display only.
- No database changes.
- No Supabase logic changes.
- No action save/update/delete behavior changed.

## Build check
- `npm run build` completed successfully.
- Note: dependencies were installed locally with `npm ci --ignore-scripts` because the optional `onnxruntime-node` install script attempted to reach `api.nuget.org` and failed in this environment.
