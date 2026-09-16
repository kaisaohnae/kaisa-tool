import type {ReactElement, ReactNode} from 'react';
import type {PhotoTool, ShapeMode} from '@/modules/photo';

type IconProps = {size?: number; className?: string};

function Svg({size = 22, className, children}: IconProps & {children: ReactNode}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function IconMove(props: IconProps) {
  return <Svg {...props}><path d="m4 3 6.5 16 2.2-6.3L19 10 4 3Z" /><path d="m14 14 5 5m-4 0h4v-4" /></Svg>;
}

export function IconSelect(props: IconProps) {
  return <Svg {...props}><rect x="4" y="4" width="16" height="16" rx="1" strokeDasharray="2 3" /></Svg>;
}

export function IconEllipse(props: IconProps) {
  return <Svg {...props}><ellipse cx="12" cy="12" rx="8.5" ry="7" strokeDasharray="2 3" /></Svg>;
}

export function IconLasso(props: IconProps) {
  return <Svg {...props}><path d="M7 16c-2.5-1-4-3-4-5.5C3 7 7 4.5 12 4.5S21 7 21 10.5 17 17 12 17H9" /><ellipse cx="7.5" cy="16.5" rx="2" ry="1.5" /><path d="M7 18c0 2 1 3 3 3" /></Svg>;
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
  return <Svg {...props}><path d="m10 14 8.5-10.5a1.8 1.8 0 0 1 2.5 2.5L10.5 14.5" /><path d="M10.5 14.5c1.5 1.5 1 4-1 5-1.5.8-4 .5-6.5 1.5 1.5-1.5 1-3.5 2-5a3.5 3.5 0 0 1 5.5-1Z" /><path d="m13.5 9.5 2 2" /></Svg>;
}

export function IconEraser(props: IconProps) {
  return <Svg {...props}><path d="m14.5 4 6 6-10 10H6l-3-3a2 2 0 0 1 0-2.8L13 4a1 1 0 0 1 1.5 0Z" /><path d="m8 9 6 6M10 20h11" /></Svg>;
}

export function IconFill(props: IconProps) {
  return <Svg {...props}><path d="m4 11 8-8 8 8-8 8-8-8Z" /><path d="M4 11h16M9 3l4 4" /><path d="M20 14s-2 2.5-2 4a2 2 0 0 0 4 0c0-1.5-2-4-2-4Z" fill="currentColor" stroke="none" /></Svg>;
}

export function IconGradient(props: IconProps) {
  return <Svg {...props}><rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="M6 7.5v9" opacity=".25" /><path d="M9 7.5v9" opacity=".45" /><path d="M12 7.5v9" opacity=".65" /><path d="M15 7.5v9" opacity=".85" /><path d="M18 7.5v9" /></Svg>;
}

export function IconClone(props: IconProps) {
  return <Svg {...props}><path d="M8 14v-3l1.5-2V6a2.5 2.5 0 0 1 5 0v3L16 11v3M6 14h12l2 5H4l2-5ZM6 22h12" /></Svg>;
}

export function IconBlur(props: IconProps) {
  return <Svg {...props}><path d="M12 3S6.5 10 6.5 14.2a5.5 5.5 0 0011 0C17.5 10 12 3 12 3z" /><path d="M9 15.5c.6 1.3 1.5 2 3 2" opacity=".55" /></Svg>;
}

export function IconSharpen(props: IconProps) {
  return <Svg {...props}><path d="m12 3 9 17H3L12 3Z" /><path d="m12 9 4.5 8h-9L12 9Z" fill="currentColor" stroke="none" opacity=".3" /></Svg>;
}

export function IconDodge(props: IconProps) {
  return <Svg {...props}><circle cx="9" cy="9" r="5" /><path d="m13 13 7 7M9 6v6M6 9h6" /></Svg>;
}

export function IconBurn(props: IconProps) {
  return <Svg {...props}><path d="M13 3c1 4-3 5-1 8 1-2 3-2 4-4 3 4 3 9-1 12-3 2-8 1-10-3-2-5 2-8 4-10 0 3 1 4 2 5-1-4 1-5 2-8z" /></Svg>;
}

export function IconEyedropper(props: IconProps) {
  return <Svg {...props}><path d="m14 5 5 5m-3.5-3.5 2-2a2.1 2.1 0 0 1 3 3l-2 2M14 7 5 16l-1 4 4-1 9-9M7 14l3 3" /></Svg>;
}

export function IconText(props: IconProps) {
  return <Svg {...props}><path d="M4 7V4h16v3M12 4v16M8 20h8" /></Svg>;
}

export function IconCrop(props: IconProps) {
  return <Svg {...props}><path d="M7 3v14h14M3 7h14v14M10 7h7v7" /><path d="m18 6 3-3M3 21l3-3" opacity=".45" /></Svg>;
}

export function IconShape(props: IconProps) {
  return <Svg {...props}><rect x="3" y="4" width="12" height="12" rx="2" /><circle cx="16" cy="16" r="5" fill="currentColor" fillOpacity=".12" /></Svg>;
}
export function IconPen(props: IconProps) {
  return <Svg {...props}><path d="m4 20 3-11 10-5 3 3-5 10-11 3ZM4 20l7-7M17 4l3 3" /><circle cx="12" cy="12" r="2" /><path d="m7 9 8 8" opacity=".4" /></Svg>;
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
  return <Svg {...props}><path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V12m0-1V4.5a1.5 1.5 0 0 1 3 0V12m0-1V6a1.5 1.5 0 0 1 3 0v7m0-3V9a1.5 1.5 0 0 1 3 0v6c0 4-2.5 6-6 6h-1c-2.5 0-4-1-5.5-3L4 13.5a1.5 1.5 0 0 1 2.3-1.9L8 14" /></Svg>;
}

export function IconZoom(props: IconProps) {
  return <Svg {...props}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5M7.5 10.5h6M10.5 7.5v6" /></Svg>;
}

export function IconTransform(props: IconProps) {
  return <Svg {...props}><rect x="5" y="5" width="14" height="14" rx="1" strokeDasharray="3 2" /><path d="M3 3h4v4H3zM17 3h4v4h-4zM3 17h4v4H3zM17 17h4v4h-4z" fill="currentColor" stroke="none" /></Svg>;
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
  blurTool: IconBlur,
  sharpenTool: IconSharpen,
  dodge: IconDodge,
  burn: IconBurn,
  eyedropper: IconEyedropper,
  text: IconText,
  crop: IconCrop,
  shape: IconShape,
  pen: IconPen,
  hand: IconHand,
  zoom: IconZoom,
  transform: IconTransform
};

export function PhotoToolIcon({tool, ...props}: IconProps & {tool: PhotoTool}) {
  const Comp = MAP[tool];
  return <Comp {...props} />;
}

export function IconEye({hidden = false, ...props}: IconProps & {hidden?: boolean}) {
  return (
    <Svg {...props}>
      {hidden ? (
        <>
          <path d="m3 3 18 18M10.6 5.2 12 5c5.5 0 9 7 9 7a19 19 0 0 1-3.1 3.9M6.1 6.1A21 21 0 0 0 3 12s3.5 7 9 7a10 10 0 0 0 4.1-.9" />
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        </>
      ) : (
        <>
          <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </Svg>
  );
}
export function IconLayerAction({action, ...props}: IconProps & {action: 'up' | 'down' | 'add' | 'remove' | 'lock' | 'unlock'}) {
  return (
    <Svg {...props}>
      {action === 'up' && <path d="m6 12 6-6 6 6M12 6v14" />}
      {action === 'down' && <path d="m6 12 6 6 6-6M12 4v14" />}
      {action === 'add' && <path d="M12 5v14M5 12h14" />}
      {action === 'remove' && <path d="M5 12h14" />}
      {(action === 'lock' || action === 'unlock') && <>
        <rect x="5" y="10" width="14" height="11" rx="2.5" />
        {action === 'lock' ? <path d="M8 10V7a4 4 0 0 1 8 0v3" /> : <path d="M8 10V7a4 4 0 0 1 7.5-2" />}
        <path d="M12 14v3" />
      </>}
    </Svg>
  );
}