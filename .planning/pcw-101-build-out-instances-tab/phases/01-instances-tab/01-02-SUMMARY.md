# Summary: Plan 01-02 — Create Instance Modal + Upgrade Instance List UI

## Status: Completed

## Tasks Completed

### Task 1: CreateInstanceModal component
- Created `src/renderer/components/instances/CreateInstanceModal.tsx`
- Fetches release versions from `window.launcher.game.getVersions()` on mount, defaults to `latest.release`
- Form fields: Instance Name, Version dropdown, optional Server Host + Port (side-by-side via `.form-row`)
- Validates name is non-empty, constructs `InstanceConfig` (with `serverAutoConnect` only if host is provided)
- Calls `window.launcher.instances.create(config)`, fires `onCreate` callback, then `onClose`
- Closes on backdrop click and Escape key
- Inline error display on failure

### Task 2: Upgraded InstanceList component
- Removed local `Instance` interface — now uses global `InstanceInfo`
- Added `showCreateModal` state wired to "New Instance" button
- `handleCreated` prepends new instance to state list
- Delete button (`instance-card__delete`) per card — calls `confirm()` then `window.launcher.instances.delete(id)`, removes from state
- Shows `serverAutoConnect.host` on cards via `.instance-card__server`
- Better empty state: message + "Create your first instance" button

### Task 3: CSS additions to globals.css
- `.modal-overlay`, `.modal`, `.modal__header`, `.modal__title`, `.modal__close`, `.modal__actions`
- `.form-group`, `.form-group label`, `.form-group input/select`, focus styles, `.form-group__hint`, `.form-row`
- `.btn--ghost`
- `.instance-card__delete`, `.instance-card__server`
- All styles use existing CSS variables, no hardcoded colors

## Deviations
- `InstanceConfig` and `InstanceInfo` moved from module level to inside `declare global {}` in `global.d.ts` so they are accessible in component files without imports. The original plan placed them at module level which would not work with the `export {}` pattern in that file.

## Files Modified
- `src/renderer/components/instances/CreateInstanceModal.tsx` (new)
- `src/renderer/components/instances/InstanceList.tsx`
- `src/renderer/styles/globals.css`
- `src/renderer/global.d.ts` (interfaces moved into `declare global`)
