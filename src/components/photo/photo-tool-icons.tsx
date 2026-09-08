import type {ReactElement, ReactNode} from 'react';
import type {PhotoTool, ShapeMode} from '@/modules/photo';

type IconProps = {size?: number; className?: string};

function Svg({size = 18, className, children}: IconProps & {children: ReactNode}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function IconMove(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 3l7.2 14.2 1.8-5 5-1.8L4 3z" fill="currentColor" stroke="none" />
      <path d="M12.5 15.5h8M16.5 11.5v8" />
      <path d="M12.5 15.5l2-2M12.5 15.5l2 2M20.5 15.5l-2-2M20.5 15.5l-2 2M16.5 11.5l-2 2M16.5 11.5l2 2M16.5 19.5l-2-2M16.5 19.5l2-2" />
    </Svg>
  );
}

export function IconSelect(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4" y="5" width="16" height="14" strokeDasharray="2.5 2" />
    </Svg>
  );
}

export function IconEllipse(props: IconProps) {
  return (
    <Svg {...props}>
      <ellipse cx="12" cy="12" rx="8" ry="6" strokeDasharray="2.5 2" />
    </Svg>
  );
}

export function IconLasso(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 16c-2-2-2-5 0-7 2.5-2.5 7-3 9 0 1.5 2.2.5 5-1.5 6.5-1.5 1.2-3.5 1.5-5 1" />
      <path d="M8 16l-2 4" />
    </Svg>
  );
}

export function IconWand(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 19L15.5 8.5" />
      <path d="M14 7l3 3" />
      <path d="M16.5 4.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
      <path d="M8.5 4.5l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5z" />
    </Svg>
  );
}

export function IconBrush(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14.5 4.5l5 5-9.2 9.2a3.2 3.2 0 01-4.5-4.5L14.5 4.5z" />
      <path d="M13 6.5l4.5 4.5" />
      <path d="M5.2 18.8l-1.4 1.4" />
    </Svg>
  );
}

export function IconEraser(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M15.5 4.5l4 4-8.5 8.5H7l-3.5-3.5 12-12z" />
      <path d="M7 17h12" />
    </Svg>
  );
}

export function IconFill(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 4l8 8-6.5 6.5a3.2 3.2 0 01-4.5-4.5L8 4z" />
      <path d="M14.5 10.5l3 3" />
      <path d="M17.5 15.5c1.2 0 2.2 1.3 2.2 2.5S18 21 17.5 21s-2.2-1.3-2.2-3 1-2.5 2.2-2.5z" />
    </Svg>
  );
}

export function IconGradient(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4" y="5" width="16" height="14" />
      <path d="M12 5v14" />
      <path d="M4 12h8" opacity="0.35" />
    </Svg>
  );
}

export function IconClone(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="11" r="4.5" />
      <circle cx="15.5" cy="13.5" r="3.5" strokeDasharray="2 1.5" />
      <path d="M12.5 9.5l3-3" />
    </Svg>
  );
}

export function IconEyedropper(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14.5 4.5l5 5" />
      <path d="M16.2 6.2l1.8-1.8a1.4 1.4 0 012 2l-1.8 1.8" />
      <path d="M13.2 7.8L5.5 15.5 4 20l4.5-1.5 7.7-7.7" />
    </Svg>
  );
}

export function IconText(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 6h14" />
      <path d="M8 6v2" />
      <path d="M16 6v2" />
      <path d="M12 6v13" />
      <path d="M9 19h6" />
    </Svg>
  );
}

export function IconCrop(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 3v14h14" />
      <path d="M17 21V7H3" />
      <path d="M7 7h6v6" />
    </Svg>
  );
}

export function IconShape(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4" y="5" width="10" height="9" />
      <ellipse cx="16" cy="15" rx="4" ry="3.5" />
    </Svg>
  );
}

export function PhotoShapeIcon({mode, ...props}: IconProps & {mode: ShapeMode}) {
  if (mode === 'ellipse') {
    return (
      <Svg {...props}>
        <ellipse cx="12" cy="12" rx="8" ry="6.5" />
      </Svg>
    );
  }
  if (mode === 'rounded') {
    return (
      <Svg {...props}>
        <rect x="4" y="5" width="16" height="14" rx="4" />
      </Svg>
    );
  }
  return (
    <Svg {...props}>
      <rect x="4" y="5" width="16" height="14" />
    </Svg>
  );
}

export function IconHand(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8.5 11.5V7.2a1.2 1.2 0 012.4 0V11" />
      <path d="M10.9 10.8V6.4a1.2 1.2 0 012.4 0v5.2" />
      <path d="M13.3 11V7.6a1.2 1.2 0 012.4 0V14" />
      <path d="M15.7 12.2v-1.4a1.2 1.2 0 012.4 0v4.4c0 2.4-1.6 4.4-4.2 4.4h-1.3c-2.2 0-3.7-1-4.8-2.4L7 13.5a1.3 1.3 0 012-1.7l1.1 1.3" />
    </Svg>
  );
}

export function IconZoom(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="10.5" cy="10.5" r="5.5" />
      <path d="M15 15l5 5" />
      <path d="M10.5 8v5M8 10.5h5" />
    </Svg>
  );
}

export function IconTransform(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="5" y="5" width="14" height="14" />
      <rect x="4" y="4" width="3" height="3" fill="currentColor" stroke="none" />
      <rect x="17" y="4" width="3" height="3" fill="currentColor" stroke="none" />
      <rect x="4" y="17" width="3" height="3" fill="currentColor" stroke="none" />
      <rect x="17" y="17" width="3" height="3" fill="currentColor" stroke="none" />
    </Svg>
  );
}

const MAP: Record<PhotoTool, (props: IconProps) => ReactElement> = {
  move: IconMove,
  select: IconSelect,
  ellipse: IconEllipse,
  lasso: IconLasso,
  wand: IconWand,
  brush: IconBrush,
  eraser: IconEraser,
  fill: IconFill,
  gradient: IconGradient,
  clone: IconClone,
  eyedropper: IconEyedropper,
  text: IconText,
  crop: IconCrop,
  shape: IconShape,
  hand: IconHand,
  zoom: IconZoom,
  transform: IconTransform
};

export function PhotoToolIcon({tool, ...props}: IconProps & {tool: PhotoTool}) {
  const Comp = MAP[tool];
  return <Comp {...props} />;
}
