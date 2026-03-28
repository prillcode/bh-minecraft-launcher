---
phase: 04-app-level-instance-selection-and-launch
plan: 01
status: complete
---

# Summary: App-wide SelectedInstanceContext + InstanceList card selection

## Tasks completed

### Task 1: Create SelectedInstanceContext
- Created `src/renderer/stores/selected-instance-context.tsx` with `SelectedInstanceProvider` and `useSelectedInstance` hook
- Updated `src/renderer/App.tsx` to import and wrap the authenticated shell with `SelectedInstanceProvider` (outside `HashRouter` so all routes have access)

### Task 2: Update InstanceList — card selection, edit button, delete + auto-select
- Updated `src/renderer/components/instances/InstanceList.tsx`:
  - Imports `useSelectedInstance` from context
  - Auto-selects first instance on mount if nothing is selected or selection no longer exists
  - Card `onClick` now calls `setSelectedInstanceId(inst.id)` instead of opening edit modal
  - Card receives `instance-card--selected` class when it matches `selectedInstanceId`
  - Added dedicated `✏` edit button (`instance-card__edit`) that stops propagation and opens edit modal
  - `handleDelete` clears/reassigns selection to first remaining instance when the deleted instance was selected
  - `handleLaunch` calls `setSelectedInstanceId(instanceId)` before launching

### Task 3: Add instance-card--selected CSS
- Added `.instance-card--selected` rule to `src/renderer/styles/globals.css` (after `.instance-card:hover`):
  - `border-color: var(--accent)`
  - `box-shadow: 0 0 0 2px var(--accent)`
- Note: `.instance-card__edit` styles were already present in globals.css from a prior session

## Files created
- `src/renderer/stores/selected-instance-context.tsx` (new)
- `.planning/pcw-101-build-out-instances-tab/phases/04-app-level-instance-selection-and-launch/04-01-SUMMARY.md` (this file)

## Files modified
- `src/renderer/App.tsx`
- `src/renderer/components/instances/InstanceList.tsx`
- `src/renderer/styles/globals.css`

## Deviations from plan
- The `.instance-card__edit` CSS block was already present in globals.css (lines 582–604) with styles slightly different from what the plan specified but functionally equivalent. No changes were made to those existing styles; only `.instance-card--selected` was added.

## Build result
`pnpm build` passed with no TypeScript errors. Both `build:main` and `build:renderer` succeeded.
