'use client';

import {useEffect, useRef, useState} from 'react';
import {PhotoShapeIcon, PhotoToolIcon} from './photo-tool-icons';
import {TOOL_DEFS, type PhotoTool, type ShapeMode} from '@/modules/photo';

type Props = {
  activeTool: PhotoTool;
  onSelect: (tool: PhotoTool) => void;
  foreground: string;
  background: string;
  foregroundAlpha: number;
  backgroundAlpha: number;
  onForegroundChange: (color: string) => void;
  onBackgroundChange: (color: string) => void;
  onForegroundAlphaChange: (alpha: number) => void;
  onBackgroundAlphaChange: (alpha: number) => void;
  onSwapColors: () => void;
  onResetColors: () => void;
  shapeMode: ShapeMode;
  onShapeModeChange: (mode: ShapeMode) => void;
};

// Tools kept fully functional (keyboard shortcut + menu entries) but hidden from the toolbar for now.
const HIDDEN_TOOL_IDS = new Set<PhotoTool>(['blurTool', 'burn', 'wand', 'clone', 'transform']);

type FlyoutKind = 'shape' | 'marquee';
type MarqueeMode = 'select' | 'ellipse';

export function PhotoToolbar({
  activeTool,
  onSelect,
  foreground,
  background,
  foregroundAlpha,
  backgroundAlpha,
  onForegroundChange,
  onBackgroundChange,
  onForegroundAlphaChange,
  onBackgroundAlphaChange,
  onSwapColors,
  onResetColors,
  shapeMode,
  onShapeModeChange
}: Props) {
  const [openFlyout, setOpenFlyout] = useState<FlyoutKind | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Which marquee tool the hold-flyout last chose, so a plain click on the group re-selects it.
  const [marqueeMode, setMarqueeMode] = useState<MarqueeMode>(activeTool === 'ellipse' ? 'ellipse' : 'select');

  useEffect(() => {
    if (activeTool === 'select' || activeTool === 'ellipse') setMarqueeMode(activeTool);
  }, [activeTool]);

  const stopHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };

  useEffect(() => {
    if (!openFlyout) return;
    const close = () => setOpenFlyout(null);
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [openFlyout]);

  const chooseShape = (mode: ShapeMode) => {
    onShapeModeChange(mode);
    onSelect('shape');
    setOpenFlyout(null);
  };

  const chooseMarquee = (mode: MarqueeMode) => {
    setMarqueeMode(mode);
    onSelect(mode);
    setOpenFlyout(null);
  };

  const visibleTools = TOOL_DEFS.filter(tool => !HIDDEN_TOOL_IDS.has(tool.id) && tool.id !== 'ellipse');

  return (
    <aside className="photo-toolbar" onClick={event => event.stopPropagation()}>
      <div className="photo-toolbar__tools">
        {visibleTools.map(tool =>
          tool.id === 'shape' ? (
            <div key={tool.id} className="photo-tool-group">
              <button
                type="button"
                className={`photo-tool photo-tool--flyout${activeTool === tool.id ? ' is-active' : ''}`}
                title={`${tool.tip} · Hold to choose shape`}
                onClick={() => onSelect(tool.id)}
                onPointerDown={() => {
                  stopHold();
                  holdTimer.current = setTimeout(() => setOpenFlyout('shape'), 450);
                }}
                onPointerUp={stopHold}
                onPointerCancel={stopHold}
                onPointerLeave={stopHold}
                onContextMenu={event => {
                  event.preventDefault();
                  setOpenFlyout('shape');
                }}
              >
                <PhotoShapeIcon mode={shapeMode} size={18} />
              </button>
              {openFlyout === 'shape' ? (
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
          ) : tool.id === 'select' ? (
            <div key={tool.id} className="photo-tool-group">
              <button
                type="button"
                className={`photo-tool photo-tool--flyout${activeTool === 'select' || activeTool === 'ellipse' ? ' is-active' : ''}`}
                title={`${marqueeMode === 'ellipse' ? 'Elliptical Marquee (Shift+M)' : 'Rectangular Marquee (M)'} · Hold to switch`}
                onClick={() => onSelect(marqueeMode)}
                onPointerDown={() => {
                  stopHold();
                  holdTimer.current = setTimeout(() => setOpenFlyout('marquee'), 450);
                }}
                onPointerUp={stopHold}
                onPointerCancel={stopHold}
                onPointerLeave={stopHold}
                onContextMenu={event => {
                  event.preventDefault();
                  setOpenFlyout('marquee');
                }}
              >
                <PhotoToolIcon tool={marqueeMode} size={18} />
              </button>
              {openFlyout === 'marquee' ? (
                <div className="photo-tool-flyout" onPointerDown={event => event.stopPropagation()}>
                  {([
                    ['select', 'Rectangular Marquee'],
                    ['ellipse', 'Elliptical Marquee']
                  ] as const).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      className={marqueeMode === mode ? 'is-active' : ''}
                      onClick={() => chooseMarquee(mode)}
                      title={label}
                    >
                      <PhotoToolIcon tool={mode} size={18} />
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
        <div className="photo-alpha-controls">
          <input
            type="number"
            min={0}
            max={100}
            value={foregroundAlpha}
            title="Foreground opacity %"
            onChange={event => onForegroundAlphaChange(Math.max(0, Math.min(100, Number(event.target.value) || 0)))}
          />
          <input
            type="number"
            min={0}
            max={100}
            value={backgroundAlpha}
            title="Background opacity %"
            onChange={event => onBackgroundAlphaChange(Math.max(0, Math.min(100, Number(event.target.value) || 0)))}
          />
        </div>
        <button type="button" className="photo-colors-reset" title="Default colors (D)" onClick={onResetColors}>
          ◩
        </button>
      </div>
    </aside>
  );
}
