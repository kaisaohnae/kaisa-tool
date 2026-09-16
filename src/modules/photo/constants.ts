export const HISTORY_LIMIT = 40;
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 20;
export const DRAG_THRESHOLD = 2;

// Photoshop-style fixed zoom steps: the 10% floor, then every 25 percentage points up to 2000%.
export const ZOOM_LEVELS: number[] = (() => {
  const levels = [MIN_ZOOM];
  for (let pct = 25; pct <= 2000; pct += 25) levels.push(pct / 100);
  return levels;
})();
