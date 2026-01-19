---
name: camera
overview: Smoothly move camera and zoom to center on selected bird during long-press selection, synchronized to the progress duration (1.8s). Provide cancel/revert behavior and minimal UI state changes.
todos: []
---

# Smooth focus-on-select plan

Overview

When the user begins a long-press on a bird (progress ring starts), the camera will smoothly pan and zoom to put the selected bird at the center of the view and slowly move closer over the same duration as the progress (currently 1.8s). If the selection completes, the camera remains at the focused pose (or optionally eases out). If the user cancels the selection early, the camera will rebound smoothly to its original position/target. OrbitControls will be temporarily disabled while the automated camera motion runs to avoid conflicts.

Files to edit

- `src/index.js`
  - Modify `onPointerDown` to start camera focus animation when a bird is selected.
  - Modify `onPointerUp` / `cancelSelection` / `completeSelection` to stop or finalize camera animation appropriately.
  - Add helper functions:
    - `startCameraFocus(targetObject, duration)` — captures original camera/controls state, disables controls, computes target camera position (e.g., move camera toward object along view vector or compute bounding sphere), and starts a time-based interpolation with easing.
    - `cancelCameraFocus()` — smoothly revert camera to original state.
    - `finalizeCameraFocus()` — optional small settle animation and leave controls enabled (or keep disabled depending on UX).
    - `computeFocusPosition(object, desiredDistance)` — returns a camera position that frames `object` at `desiredDistance` (uses bounding box/sphere).
  - Use requestAnimationFrame for smooth animation; make it robust to interruptions.

Design decisions and defaults

- **Duration**: Use the existing selection requiredTime (1.8s) so the camera movement ends when the progress ring completes.
- **Easing**: Use easeOutCubic for a natural feeling.
- **Zoom amount**: Move the camera toward the object to reduce distance by ~40% (configurable).
- **Controls**: `controls.enabled = false` during focus motion; restore previous state afterward.
- **Cancel behavior**: If selection is cancelled early, camera gently returns to its saved original pose over 400ms.
- **Robustness**: If another selection occurs while a focus animation is active, cancel the current animation and start a new one.

Minimal implementation sketch

```javascript
// Called when user presses and a bird is selected
function startCameraFocus(targetObject, duration) {
  // save camera.position, camera.quaternion, controls.target
  // compute desired pos = computeFocusPosition(targetObject, desiredDistance)
  // animate camera.position and controls.target from saved to desired over duration
  // disable controls
}

function cancelCameraFocus() {
  // animate camera back to saved state over 400ms, re-enable controls
}

function finalizeCameraFocus() {
  // small settle or leave in focused state, re-enable controls
}
```

Todos

- focus-1: Add camera focus helper functions and animation loop
- focus-2: Hook startCameraFocus into `onPointerDown` when selection starts
- focus-3: Hook cancelCameraFocus into `cancelSelection` and finalizeCameraFocus into `completeSelection`
- focus-4: Add config flags and make duration use `requiredTime` (1.8s)
- focus-5: Test interactions: multiple rapid selections, cancel mid-motion, controls restore

If you approve I will implement the changes in `src/index.js` following this plan and run tests to ensure the selection camera motion is smooth and robust.