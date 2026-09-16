import type {LayerStyle} from '@/modules/photo';

export function PhotoLayerStyleBadge({style}: {style?: LayerStyle}) {
  const effects = [
    style?.dropShadow.enabled && 'Drop Shadow',
    style?.border.enabled && 'Stroke',
    style?.overlay.enabled && (style.overlay.type === 'gradient' ? 'Gradient Overlay' : 'Color Overlay')
  ].filter(Boolean);
  if (!effects.length) return null;
  const label = `Layer effects: ${effects.join(', ')}`;
  return <span className="photo-layer__effects" title={label} aria-label={label}>
    <span aria-hidden="true">fx</span>
  </span>;
}