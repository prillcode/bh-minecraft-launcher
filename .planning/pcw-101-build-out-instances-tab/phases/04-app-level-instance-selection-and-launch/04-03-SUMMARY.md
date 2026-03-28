# Phase 04 Plan 03: Sidebar Play Button Summary

## What was built
Added a Play button section to the Sidebar that launches the currently selected instance without
navigating to the Instances tab. The button shows the selected instance name above it, is accent-
coloured, shows a loading state during launch, and displays inline error messages on failure.
Disabled when no instance is selected.

## Files changed
- `src/renderer/components/layout/Sidebar.tsx` — added `useSelectedInstance`, `useState` for
  `instances`/`launching`/`launchError`, `useEffect` to load instances, `handlePlay` async
  handler, `sidebar__play` JSX section between nav list and footer.
- `src/renderer/styles/globals.css` — added `.sidebar__play`, `.sidebar__play-instance`,
  `.sidebar__play-btn` (with hover + disabled states), `.sidebar__play-error` styles.

## Verification
- `pnpm build` passes with no TypeScript errors
- Sidebar has Play button with instance name label
- Play button disabled when no selection
- Launch error shown inline in sidebar
- CSS for sidebar play section added

## Human Verify Checkpoint
Pending user test of full flow:
1. Select instance on Instances tab (accent border highlights card)
2. Mods/Shaders tabs show compact header — no dropdown
3. "← Change" navigates back to Instances tab
4. Sidebar Play button shows selected instance name
5. Click ▶ Play — game launches or inline error shown
6. Vanilla instance → Mods/Shaders → gate message shown

## Next Step
Phase 04 complete.
