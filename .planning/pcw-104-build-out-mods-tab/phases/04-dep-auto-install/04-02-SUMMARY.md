# Phase 04 Plan 02: Dep Auto-Install UI Summary

**VersionPickerModal now resolves and prompts for required deps before installing — verified working with Sodium Extra → Sodium.**

## Accomplishments
- Two-phase install flow: first Install click runs dep check via `getRequiredDeps`; if deps found, shows inline confirmation listing them with "Install all (N mods)" button; second click installs deps sequentially then the main mod
- Per-item status label ("Installing Sodium…", "Installing Sodium Extra…") shown during sequential install
- Version-change resets dep check state so switching versions re-checks correctly
- Error path shows message and resets `pendingDeps` to allow retry
- Mods with no required deps (or all already installed) install in a single click unchanged

## Files Created/Modified
- `src/renderer/components/mods/VersionPickerModal.tsx` — two-phase install flow, dep confirmation UI, status label, error handling, version-change reset

## Decisions Made
- No "Skip dependencies" option — required deps are required; prompt is informational only
- `runInstall` extracted as a helper to share between the no-deps fast path and the confirmed path

## Issues Encountered
- JourneyMap did not trigger the dep prompt because it does not declare Fabric API as a required dependency in Modrinth's data (mod authors must fill this in manually). Sodium Extra correctly declares Sodium as required and the full flow verified successfully.

## Next Step
Phase 04 complete. Ready for next feature phase.
