# Photo editor maintenance

The editor coordinates document state and rendering. Keep independent behavior in hooks:

- `use-photo-selection-overlay.ts`: selection animation, resize handling, outline cache, reduced motion.
- `use-photo-clipboard.ts`: native image paste, internal clipboard fallback, document-switch guard.
- `use-photo-pixel-actions.ts`: fill and layer transparency selection.
- `use-photo-selection-actions.ts`: selection commands, clipboard, and layer via copy/cut.
- `use-photo-transform-tool.ts`: transform lifecycle and cancellation using the original canvas.

## Drawing and selection

- Hold Shift while drawing a shape or marquee for equal width and height.
- Hold Alt to draw from the center. Shift and Alt work together.
- Ctrl+J copies the active selection to a new raster layer at its original position. Without a selection, it duplicates the active layer.
- Ctrl+Shift+J cuts the selection to a new raster layer.
- Shift+click selects a contiguous layer range; Ctrl/Command+click toggles individual layers.
- Ctrl/Command+click on a layer thumbnail selects its opaque pixels.
- Ctrl+E merges selected layers, or merges down when only one layer is selected. Locked and adjustment layers must be excluded from a multiple-layer merge.
- Ctrl+0 fits the document on screen; Ctrl+1 shows 100%.
- Brushes and erasers honor selection masks, including feathered alpha. Masked pixel changes are interpolated in premultiplied color to preserve transparent edges.

A regular layer click selects one layer. Brightness/Contrast creation stays hidden; mask creation remains in the layer context menu.

## Checks

Run `npm run typecheck` and `npm run test:photo`. The test runner executes all `scripts/check-photo-*.cjs` checks, stopping on the first failure. Tests include geometry constraints, selection-to-layer placement, mask compositing, brush spacing, blur, ID restoration, and floating menu placement.

Run `npm run build` for the static production export. This currently needs network access to fetch the Google Fonts used by the site layout.