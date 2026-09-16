export type GuideOrientation = 'horizontal' | 'vertical';

export type PhotoGuide = {
  id: string;
  orientation: GuideOrientation;
  position: number;
};

export type SnapOptions = {
  guides: PhotoGuide[];
  gridSize: number;
  zoom: number;
  tolerancePx?: number;
  snapGrid?: boolean;
};

export function saneGridSpacing(gridSize: number, zoom: number, minimumScreenSpacing = 12) {
  let spacing = Math.max(5, Math.min(500, gridSize));
  while (spacing * zoom < minimumScreenSpacing) spacing *= 2;
  return spacing;
}

export function snapCoordinate(value: number, axis: 'x' | 'y', options: SnapOptions) {
  const tolerance = (options.tolerancePx ?? 6) / Math.max(0.01, options.zoom);
  const candidates = options.guides
    .filter(guide => guide.orientation === (axis === 'x' ? 'vertical' : 'horizontal'))
    .map(guide => guide.position);
  if (options.snapGrid !== false && options.gridSize > 0) {
    candidates.push(Math.round(value / options.gridSize) * options.gridSize);
  }
  let best = value;
  let distance = tolerance + 1;
  for (const candidate of candidates) {
    const nextDistance = Math.abs(candidate - value);
    if (nextDistance <= tolerance && nextDistance < distance) {
      best = candidate;
      distance = nextDistance;
    }
  }
  return best;
}

export function snapPoint<T extends {x: number; y: number}>(point: T, options: SnapOptions): T {
  return {
    ...point,
    x: snapCoordinate(point.x, 'x', options),
    y: snapCoordinate(point.y, 'y', options)
  };
}

export function snapBox(
  box: {x: number; y: number; w: number; h: number},
  options: SnapOptions,
  mode: 'move' | 'resize' = 'move'
) {
  if (mode === 'resize') {
    const right = snapCoordinate(box.x + box.w, 'x', options);
    const bottom = snapCoordinate(box.y + box.h, 'y', options);
    return {...box, w: Math.max(1, right - box.x), h: Math.max(1, bottom - box.y)};
  }
  const xs = [box.x, box.x + box.w / 2, box.x + box.w];
  const ys = [box.y, box.y + box.h / 2, box.y + box.h];
  let dx = 0;
  let dy = 0;
  for (const x of xs) {
    const snapped = snapCoordinate(x, 'x', options);
    if (snapped !== x && (dx === 0 || Math.abs(snapped - x) < Math.abs(dx))) dx = snapped - x;
  }
  for (const y of ys) {
    const snapped = snapCoordinate(y, 'y', options);
    if (snapped !== y && (dy === 0 || Math.abs(snapped - y) < Math.abs(dy))) dy = snapped - y;
  }
  return {...box, x: box.x + dx, y: box.y + dy};
}
