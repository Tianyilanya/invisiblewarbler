---
name: global
overview: Add 5s ease-in and 5s ease-out for bird spawn/despawn globally and extend bird lifetime by 10s, using opacity animation on mesh materials with easeInOut easing.
todos: []
---

# Add global 5s bird fade-in/out

Overview

When a bird is created it will fade in over 5 seconds (opacity 0 -> 1) using an ease-in-out curve. When a bird is scheduled for removal it will fade out over 5 seconds (opacity 1 -> 0) before being removed. All bird lifetimes will be increased by 10 seconds so the visible lifetime is extended accordingly.

Files to change

- `src/index.js` — wire global config values, helper animation utilities, and integrate with existing spawn/despawn/hooks.
- `src/modules/randomBird.js` (or the module where `FlyingBird` / `createBirdFromComponents` is defined) — set initial opacity on creation and update removal scheduling. If `FlyingBird` lives elsewhere, edit that file instead.

Implementation details

- Add config constants near other debug params:
- `BIRD_FADE_IN_MS = 5000`
- `BIRD_FADE_OUT_MS = 5000`
- `BIRD_LIFETIME_BONUS_MS = 10000`

- Add helper `setObjectOpacity(object3D, opacity)` that traverses child meshes and sets `material.transparent = true` and `material.opacity = opacity`. Ensure multiple-material meshes handled.

- Add `animateOpacity(object3D, from, to, duration, easing, onComplete)` using requestAnimationFrame and an `easeInOut` function to interpolate; use performance.now().

- On bird creation: set opacity to 0 then call `animateOpacity(..., to=1, duration=BIRD_FADE_IN_MS, easing=easeInOut)`.

- When scheduling removal (where code calls `remove()` or uses a lifetime timeout): add `BIRD_LIFETIME_BONUS_MS` to the timeout and, when removal time arrives, call `animateOpacity(..., to=0, duration=BIRD_FADE_OUT_MS, onComplete: actuallyRemoveFromScene)` instead of immediate removal.

- Safety: if a bird is removed/cancelled early, cancel any running opacity animation and immediately proceed with removal or revert as appropriate.

Testing notes

- Verify new birds fade in over 5s on spawn.
- Verify removed birds fade out over 5s and are then removed.
- Verify lifetime increased by 10s (existing timeouts adjusted accordingly).
- Verify that materials that originally had textures/colors still display correctly (opacity applied multiplicatively).

Todos

- fade-1: Add global config constants for fade durations and lifetime bonus (`src/index.js`).
- fade-2: Implement `setObjectOpacity` and `animateOpacity` helpers (`src/index.js`).
- fade-3: Integrate fade-in on bird creation (`src/modules/randomBird.js` or creation site).
- fade-4: Integrate fade-out on bird removal and extend lifetime where removal is scheduled.
- fade-5: Test spawn/despawn behavior and edge cases (rapid spawn/remove, animation cancellation).