# Plan 02-02 Summary: Curated Categories UI

**Added category chip navigation to ModsTab and a "Popular Shaders" auto-loaded section to ShadersTab, backed by static slug lists.**

## Accomplishments
- Created `src/renderer/data/mod-categories.ts` — 4 categories: Compatibility, Performance, HUD & Minimap, Gameplay & QoL
- Created `src/renderer/data/popular-shaders.ts` — 5 popular shader slugs
- Added `.category-chip`, `.category-chip--active`, `.category-chips`, and `.mods__section-title` styles to `globals.css`
- `ModsTab`: chip row above search bar; clicking a chip fetches that category's projects and shows them as mod cards; typing clears the active chip; active chip highlighted in accent green
- `ShadersTab`: popular shaders fetched once on mount (when instance is fabric/quilt); shown when search is empty; hidden when user types
- **Follow-up (user request):** added "Search All" chip as the first chip — active by default (no category selected), clears category + focuses search input on click; uses a `useRef` on the search input

## Files Created
- `src/renderer/data/mod-categories.ts`
- `src/renderer/data/popular-shaders.ts`

## Files Modified
- `src/renderer/styles/globals.css`
- `src/renderer/components/mods/ModsTab.tsx`
- `src/renderer/components/shaders/ShadersTab.tsx`

## Decisions Made
- Curated slug lists are intentionally small — they're hand-picked highlights, not exhaustive catalogs. The "Search All" chip makes the full search path obvious.
- Popular shaders section is hidden when `results.length > 0` (search active) — avoids stacking both sections simultaneously.
