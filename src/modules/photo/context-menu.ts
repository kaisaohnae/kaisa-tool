/** Position a floating menu beside its anchor, flipping each axis before clamping. */
export function fitContextMenu(x: number, y: number, width: number, height: number, viewportWidth: number, viewportHeight: number, margin = 8) {
  const maxLeft = Math.max(margin, viewportWidth - margin - width);
  const maxTop = Math.max(margin, viewportHeight - margin - height);
  const left = x + width <= viewportWidth - margin ? x : x - width;
  const top = y + height <= viewportHeight - margin ? y : y - height;
  return {left: Math.max(margin, Math.min(maxLeft, left)), top: Math.max(margin, Math.min(maxTop, top))};
}