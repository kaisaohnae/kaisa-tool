'use client';

import type {LayerStyle} from '@/modules/photo';

type Props = {
  style: LayerStyle;
  canPaste: boolean;
  onChange: (style: LayerStyle) => void;
  onBeginChange: (label: string) => void;
  onCopy: () => void;
  onPaste: () => void;
};

export function PhotoLayerStylePanel({
  style,
  canPaste,
  onChange,
  onBeginChange,
  onCopy,
  onPaste
}: Props) {
  const setShadow = (patch: Partial<LayerStyle['dropShadow']>) =>
    onChange({...style, dropShadow: {...style.dropShadow, ...patch}});
  const setBorder = (patch: Partial<LayerStyle['border']>) =>
    onChange({...style, border: {...style.border, ...patch}});
  const setOverlay = (patch: Partial<LayerStyle['overlay']>) =>
    onChange({...style, overlay: {...style.overlay, ...patch}});

  return (
    <section className="photo-layer-style">
      <div className="photo-layer-style__head">
        <strong>Layer Style</strong>
        <div>
          <button type="button" title="Copy Style (Shift+F2)" onClick={onCopy}>Copy</button>
          <button type="button" title="Paste Style (F2)" disabled={!canPaste} onClick={onPaste}>Paste</button>
        </div>
      </div>

      <fieldset>
        <label className="photo-layer-style__toggle">
          <input
            type="checkbox"
            checked={style.dropShadow.enabled}
            onChange={event => {
              onBeginChange('Toggle Drop Shadow');
              setShadow({enabled: event.target.checked});
            }}
          />
          Drop Shadow
        </label>
        {style.dropShadow.enabled ? (
          <div className="photo-layer-style__controls">
            <label>Color
              <input type="color" value={style.dropShadow.color}
                onFocus={() => onBeginChange('Shadow Color')}
                onChange={event => setShadow({color: event.target.value})} />
            </label>
            <label>Opacity
              <input type="range" min={0} max={100} value={Math.round(style.dropShadow.opacity * 100)}
                onFocus={() => onBeginChange('Shadow Opacity')}
                onChange={event => setShadow({opacity: Number(event.target.value) / 100})} />
              <span>{Math.round(style.dropShadow.opacity * 100)}%</span>
            </label>
            <label>X
              <input type="number" min={-100} max={100} value={style.dropShadow.offsetX}
                onFocus={() => onBeginChange('Shadow Offset')}
                onChange={event => setShadow({offsetX: Number(event.target.value)})} />
            </label>
            <label>Y
              <input type="number" min={-100} max={100} value={style.dropShadow.offsetY}
                onFocus={() => onBeginChange('Shadow Offset')}
                onChange={event => setShadow({offsetY: Number(event.target.value)})} />
            </label>
            <label>Blur
              <input type="range" min={0} max={50} value={style.dropShadow.blur}
                onFocus={() => onBeginChange('Shadow Blur')}
                onChange={event => setShadow({blur: Number(event.target.value)})} />
              <span>{style.dropShadow.blur}px</span>
            </label>
          </div>
        ) : null}
      </fieldset>

      <fieldset>
        <label className="photo-layer-style__toggle">
          <input
            type="checkbox"
            checked={style.border.enabled}
            onChange={event => {
              onBeginChange('Toggle Border');
              setBorder({enabled: event.target.checked});
            }}
          />
          Border
        </label>
        {style.border.enabled ? (
          <div className="photo-layer-style__controls">
            <label>Color
              <input type="color" value={style.border.color}
                onFocus={() => onBeginChange('Border Color')}
                onChange={event => setBorder({color: event.target.value})} />
            </label>
            <label>Size
              <input type="range" min={1} max={30} value={style.border.size}
                onFocus={() => onBeginChange('Border Size')}
                onChange={event => setBorder({size: Number(event.target.value)})} />
              <span>{style.border.size}px</span>
            </label>
            <label>Position
              <select value={style.border.location ?? 'outside'}
                onChange={event => {
                  onBeginChange('Border Position');
                  setBorder({location: event.target.value as LayerStyle['border']['location']});
                }}>
                <option value="inside">Inside</option>
                <option value="center">Center</option>
                <option value="outside">Outside</option>
              </select>
            </label>
          </div>
        ) : null}
      </fieldset>

      <fieldset>
        <label className="photo-layer-style__toggle">
          <input
            type="checkbox"
            checked={style.overlay.enabled}
            onChange={event => {
              onBeginChange('Toggle Overlay');
              setOverlay({enabled: event.target.checked});
            }}
          />
          Overlay
        </label>
        {style.overlay.enabled ? (
          <div className="photo-layer-style__controls">
            <label>Type
              <select value={style.overlay.type}
                onFocus={() => onBeginChange('Overlay Type')}
                onChange={event => setOverlay({type: event.target.value as LayerStyle['overlay']['type']})}>
                <option value="color">Color</option>
                <option value="gradient">Gradient</option>
              </select>
            </label>
            {style.overlay.type === 'color' ? (
              <label>Color
                <input type="color" value={style.overlay.color}
                  onFocus={() => onBeginChange('Overlay Color')}
                  onChange={event => setOverlay({color: event.target.value})} />
              </label>
            ) : (
              <>
                <label>Start
                  <input type="color" value={style.overlay.gradientStart}
                    onFocus={() => onBeginChange('Gradient Color')}
                    onChange={event => setOverlay({gradientStart: event.target.value})} />
                </label>
                <label>End
                  <input type="color" value={style.overlay.gradientEnd}
                    onFocus={() => onBeginChange('Gradient Color')}
                    onChange={event => setOverlay({gradientEnd: event.target.value})} />
                </label>
                <label>Angle
                  <input type="range" min={0} max={360} value={style.overlay.angle}
                    onFocus={() => onBeginChange('Gradient Angle')}
                    onChange={event => setOverlay({angle: Number(event.target.value)})} />
                  <span>{style.overlay.angle}°</span>
                </label>
              </>
            )}
            <label>Opacity
              <input type="range" min={0} max={100} value={Math.round(style.overlay.opacity * 100)}
                onFocus={() => onBeginChange('Overlay Opacity')}
                onChange={event => setOverlay({opacity: Number(event.target.value) / 100})} />
              <span>{Math.round(style.overlay.opacity * 100)}%</span>
            </label>
          </div>
        ) : null}
      </fieldset>
    </section>
  );
}
