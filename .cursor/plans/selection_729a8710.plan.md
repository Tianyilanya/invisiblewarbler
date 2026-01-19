---
name: selection
overview: Implement click-and-hold selection (3s radial progress) to capture bird assemblies into a session-only filmroll UI, with counter (max 10) and gallery modal showing thumbnails and full model preview.
todos: []
---

# Implement long-press selection & film-roll gallery

## Goal

Add click-and-hold selection of bird assemblies (3s) with a radial progress UI; successful long-press saves the selected assembly into an in-memory film roll (max 10 entries). Provide a bottom-right film-roll control showing a count and a film-strip ring; clicking it opens a modal gallery with thumbnails; clicking a thumbnail centers that model in the scene.

## Files to change

- `src/index.js` — add pointer event handlers, raycasting, selection/long-press logic, radial progress overlay, capture serialization, and gallery preview hooking.
- `src/components/FilmRollUI.js` — extend existing component to display count, film-strip UI, modal gallery, thumbnail strip, and click-to-preview behavior (session-only storage API).
- `src/styles.css` or inline styles — add CSS for radial progress, modal overlay, film-strip UI (if applicable).

## Implementation details

- Selection
- Attach `pointerdown`, `pointerup`, and `pointermove` on the renderer canvas.
- On `pointerdown`: run raycast to find bird assembly (look for group name `RandomBirdAssembly` or a `userData.isBird=true` marker). Show a circular SVG overlay at the pointer pos and start a 3s progress animation (requestAnimationFrame). If pointer moves beyond a small threshold, cancel.
- On `pointerup` before 3s: cancel and hide the overlay.
- On 3s complete: hide overlay, mark target as captured, call `FilmRollUI.addCapture(captureData)`.
- Capture data model (session-only)
- `id` (uuid), `timestamp`
- `components`: array of component identifiers (model paths or component IDs) extracted from the assembly so it can be reloaded for preview
- `thumbnail`: dataURL PNG produced by rendering the selected object isolated to an offscreen render target (small size, e.g., 256px)
- `transform`: optional transform of the assembly (position/rotation/scale)
- Film-roll UI
- Reuse `src/components/FilmRollUI.js` and add methods: `addCapture(capture)`, `openGallery()`, `renderThumbnails()`, `showPreview(captureId)`.
- UI shows count (0..10); when count reaches 10, refuse further captures or remove oldest (choose: refuse by default; we'll keep it simple and refuse with small toast).
- Clicking the control opens a modal with a horizontal thumbnail strip; clicking a thumbnail loads the capture into center preview area (reconstruct assembly using `components` data and position it in scene center).
- Thumbnail generation
- Create an offscreen WebGLRenderTarget, render the selected object with neutral bg, readPixels to canvas and toDataURL, store as thumbnail string (in-memory only).
- UX details
- Radial UI: SVG circle with stroke-dasharray animation running clockwise over 3s.
- Cancel conditions: pointermove > 8px or pointerup before completion.
- Visual feedback: brief highlight on captured assembly (e.g., emissive pulse) when saved.

## Testing

- Manual: create several captures (1..10) in session; verify counter increments, modal shows thumbnails, preview displays reconstructed model in center.
- Edge cases: no selection when clicking empty space; rapid clicks don't trigger capture; moving pointer cancels.

## Todos

- `sel-01` — Add pointer event handlers and raycast selection in `src/index.js` (in_progress)
- `sel-02` — Implement radial progress overlay and long-press timing (pending `sel-01`)
- `sel-03` — Implement capture serialization + offscreen thumbnail generation (pending `sel-01`)
- `sel-04` — Extend `src/components/FilmRollUI.js` with add/open/preview APIs and UI (pending `sel-03`)
- `sel-05` — Hook FilmRollUI to scene preview logic (pending `sel-04`)
- `sel-06` — Manual testing and UX tweaks (pending `sel-05`)

If you approve, I'll implement these changes using the existing `FilmRollUI` (as you requested) and keep captures session-only (in-memory).