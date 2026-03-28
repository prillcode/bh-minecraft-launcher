# Phase 04 Plan 02: Instance Header in Mods & Shaders Tabs Summary

## What was built
Removed per-tab instance `<select>` dropdowns from ModsTab and ShadersTab. Both tabs now read
`selectedInstanceId` from `SelectedInstanceContext` (via `useSelectedInstance()`). Replaced the
dropdown with a compact instance header showing `Instance: [name] (version)` and a `← Change`
button that navigates to `/instances`.

## Files changed
- `src/renderer/components/mods/ModsTab.tsx` — removed local `selectedInstanceId` state, imported
  `useSelectedInstance` + `useNavigate`, removed `<select>`, added `mods__instance-header` JSX,
  added `useEffect` to reset results and refresh key on instance change.
- `src/renderer/components/shaders/ShadersTab.tsx` — same pattern as ModsTab.
- `src/renderer/styles/globals.css` — added `.mods__instance-header`, `.mods__instance-label`,
  `.mods__instance-label--none` styles near `.mods__controls`.

## Verification
- `pnpm build` passes with no TypeScript errors
- ModsTab: no `<select>` for instances; reads `selectedInstanceId` from context
- ShadersTab: no `<select>` for instances; reads `selectedInstanceId` from context
- Both tabs show instance header label + Change/Select button
- `selectedInstanceId` change effect resets results + refreshKey in both tabs
- CSS for `.mods__instance-header` added

## Next Step
04-03: Add Play button to Sidebar.
