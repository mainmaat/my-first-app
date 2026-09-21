# Copilot instructions

## Repository overview

This is a dependency-free browser game prototype, not a framework-based application. The
entry point is `index.html`, which loads `style.css` and `game.js` in that order. There is no
package manifest or build step; opening `index.html` in a browser runs the game.

## Build, test, and lint

No build, test, or lint scripts are configured in this repository. Use these checks when
validating changes:

```bash
# Validate JavaScript syntax
node --check game.js

# Check whitespace errors in the patch
git diff --check
```

There is currently no automated test suite or single-test command. For behavior changes,
run the page in a browser and manually verify keyboard and touch controls, collisions,
scrolling, coin/life counters, restart, game-over, and clear states.

## Architecture

- `index.html` owns the page shell and HUD: the canvas, score/lives elements, status
  overlay, restart button, keyboard help, and mobile touch buttons.
- `style.css` provides the visual shell and responsive layout. The game itself is drawn
  inside the fixed logical `960x540` canvas, which is scaled with CSS for smaller screens.
- `game.js` contains the complete game loop. Static level geometry is in `platforms`, coin
  locations are in `coinPositions`, and runtime state is held in the `game` object.
- `update()` handles input, movement, gravity, platform landing, pickups, enemies, life
  loss, camera tracking, and the goal. `draw()` renders the sky, scenery, platforms,
  entities, and goal. `loop()` calls both through `requestAnimationFrame`.
- The camera translates the canvas drawing by `game.cam`; level/world coordinates remain
  independent of the viewport. The player reaches the end by crossing the goal near
  world coordinate `x > 3480`.

## Codebase conventions

- Keep the project dependency-free and preserve the three-file browser structure unless a
  change explicitly requires otherwise.
- Explanations, implementation summaries, and user-facing guidance should be written in
  Japanese. Keep code identifiers and standard technical terms in their conventional form.
- Use the existing plain JavaScript style: DOM elements are captured once at startup,
  mutable session data lives under `game`, and static level data stays outside the loop.
- Add keyboard actions to the `keys` set and mirror them in the mobile controls through
  `data-key` values. Current movement aliases are `a`/`d` and arrow keys; jump aliases
  include Space, `w`, and ArrowUp.
- Keep HUD changes centralized through `hud()`. Reset all per-run state in `reset()` and
  use `end()` for terminal overlays rather than duplicating end-state rendering.
- Canvas coordinates use the top-left origin and positive downward `y`; collision boxes
  use the `x`, `y`, `w`, `h` shape consumed by `hit()`.
- Match the existing Japanese player-facing text and the dark navy/mint visual palette
  when adding UI. Preserve the responsive touch-control behavior below 600px.
