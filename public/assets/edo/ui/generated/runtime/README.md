# Generated runtime UI assets

These are production-facing assets derived from the approved OH! EDO! mock direction and the generated source sheets in `../source/`.

## Runtime assets

- `logo-approved-mock.webp` — approved-mock title/logo artwork.
- `nav-icon-sprite.webp` — six town-navigation icon motifs.
- `paper-panel-frame.svg` — stretchable washi/wood panel frame for the right rail.
- `nav-tab-frame.svg` — stretchable normal six-tab navigation surface.
- `nav-tab-frame-active.svg` — stretchable active navigation surface.
- `dialog-frame.svg` — stretchable conversation frame.

## Rules

- Keep text dynamic in React; do not bake variable labels or numbers into generated artwork.
- Use generated source sheets as visual reference, then derive small production assets from them.
- Preserve Day1–Day10 interaction semantics and mobile/landscape behavior when swapping visuals.
- Every new runtime asset must be covered by production smoke and browser screenshot QA.
