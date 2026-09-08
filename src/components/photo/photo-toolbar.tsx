'use client';

import {useEffect, useRef, useState} from 'react';
import {PhotoShapeIcon, PhotoToolIcon} from './photo-tool-icons';
import {TOOL_DEFS, type PhotoTool, type ShapeMode} from '@/modules/photo';

type Props = {
  activeTool: PhotoTool;
  onSelect: (tool: PhotoTool) => void;
  foreground: string;
  background: string;
  onForegroundChange: (color: string) => void;
  onBackgroundChange: (color: string) => void;
  onSwapColors: () => void;
  onResetColors: () => void;
  shapeMode: ShapeMode;
  onShapeModeChange: (mode: ShapeMode) => void;
};

export function PhotoToolbar({
  activeTool,
  onSelect,
  foreground,
  background,
  onForegroundChange,
  onBackgroundChange,
  onSwapColors,
  onResetColors,
  shapeMode,
  onShapeModeChange
}: Props) {
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };

  useEffect(() => {
    if (!shapeMenuOpen) return;
    const close = () => setShapeMenuOpen(false);
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [shapeMenuOpen]);

  const chooseShape = (mode: ShapeMode) => {
    onShapeModeChange(mode);
    onSelect('shape');
    setShapeMenuOpen(false);
  };

  return (
    <aside className="photo-toolbar" onClick={event => event.stopPropagation()}>
      <div className="photo-toolbar__tools">
        {TOOL_DEFS.map(tool =>
          tool.id === 'shape' ? (
            <div key={tool.id} className="photo-tool-group">
              <button
                type="button"
                className={`photo-tool photo-tool--flyout${activeTool === tool.id ? ' is-active' : ''}`}
                title={`${tool.tip} · Hold to choose shape`}
                onClick={() => onSelect(tool.id)}
                onPointerDown={() => {
                  stopHold();
                  holdTimer.current = setTimeout(() => setShapeMenuOpen(true), 450);
                }}
                onPointerUp={stopHold}
                onPointerCancel={stopHold}
                onPointerLeave={stopHold}
                onContextMenu={event => {
                  event.preventDefault();
                  setShapeMenuOpen(true);
                }}
              >
                <PhotoShapeIcon mode={shapeMode} size={18} />
              </button>
              {shapeMenuOpen ? (
                <div className="photo-tool-flyout" onPointerDown={event => event.stopPropagation()}>
                  {([
                    ['rect', 'Rectangle'],
                    ['ellipse', 'Ellipse'],
                    ['rounded', 'Rounded Rectangle']
                  ] as const).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      className={shapeMode === mode ? 'is-active' : ''}
                      onClick={() => chooseShape(mode)}
                      title={label}
                    >
                      <PhotoShapeIcon mode={mode} size={18} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <button
              key={tool.id}
              type="button"
              className={`photo-tool${activeTool === tool.id ? ' is-active' : ''}`}
              title={tool.tip}
              onClick={() => onSelect(tool.id)}
            >
              <PhotoToolIcon tool={tool.id} size={18} />
            </button>
          )
        )}
      </div>

      <div className="photo-toolbar__colors">
        <div className="photo-swatches" aria-label="Foreground and background colors">
          <button
            type="button"
            className="photo-swatch photo-swatch--fg"
            title="Foreground color"
            style={{background: foreground}}
            onClick={() => document.getElementById('photo-fg')?.click()}
          />
          <button
            type="button"
            className="photo-swatch photo-swatch--bg"
            title="Background color"
            style={{background}}
            onClick={() => document.getElementById('photo-bg')?.click()}
          />
          <input
            id="photo-fg"
            type="color"
            value={foreground}
            hidden
            onChange={event => onForegroundChange(event.target.value)}
          />
          <input
            id="photo-bg"
            type="color"
            value={background}
            hidden
            onChange={event => onBackgroundChange(event.target.value)}
          />
          <button type="button" className="photo-swatch-swap" title="Swap colors (X)" onClick={onSwapColors}>
            ⇄
          </button>
        </div>
        <button type="button" className="photo-colors-reset" title="Default colors (D)" onClick={onResetColors}>
          ◩
        </button>
      </div>
    </aside>
  );
}
