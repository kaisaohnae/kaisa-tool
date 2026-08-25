'use client';

import {useMemo, useState} from 'react';
import {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {
  BLACK,
  contrastRatio,
  hslToRgb,
  parseColor,
  suggestTextColor,
  WHITE,
  type ColorValue,
  type Hsl,
  type Rgb
} from '@/modules/format/color';

function mustParse(input: string): ColorValue {
  const result = parseColor(input);
  if (!result.ok) throw new Error(result.error);
  return result.color;
}

const INITIAL = mustParse('#3B82F6');

export default function ColorTool() {
  const t = useT();
  const [color, setColor] = useState<ColorValue>(INITIAL);
  const [hexInput, setHexInput] = useState(INITIAL.hex);
  const [rgbInput, setRgbInput] = useState(INITIAL.rgbString);
  const [hslInput, setHslInput] = useState(INITIAL.hslString);
  const [picker, setPicker] = useState(INITIAL.hex.toLowerCase());
  const [message, setMessage] = useState<{type: 'ok' | 'error'; text: string} | null>(null);

  const sync = (next: ColorValue) => {
    setColor(next);
    setHexInput(next.hex);
    setRgbInput(next.rgbString);
    setHslInput(next.hslString);
    setPicker(next.hex.toLowerCase());
  };

  const tryParse = (value: string) => {
    const result = parseColor(value);
    if (!result.ok) {
      setMessage({type: 'error', text: result.error});
      return;
    }
    sync(result.color);
    setMessage(null);
  };

  const patchRgb = (partial: Partial<Rgb>) => {
    const rgb = {...color.rgb, ...partial};
    const result = parseColor(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
    if (result.ok) sync(result.color);
  };

  const patchHsl = (partial: Partial<Hsl>) => {
    const hsl = {...color.hsl, ...partial};
    const rgb = hslToRgb(hsl);
    const result = parseColor(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
    if (result.ok) sync(result.color);
  };

  const contrast = useMemo(
    () => ({
      white: contrastRatio(color.rgb, WHITE),
      black: contrastRatio(color.rgb, BLACK),
      text: suggestTextColor(color.rgb)
    }),
    [color]
  );

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage({type: 'ok', text: `Copied ${label}.`});
    } catch {
      setMessage({type: 'error', text: 'Copy failed.'});
    }
  };

  return (
    <ToolPageShell title="Color" description="Convert colors between HEX, RGB, and HSL.">
      <div className="color-tool-layout">
        <div
          className="color-swatch"
          style={{background: color.hex, color: contrast.text}}
          aria-label={t('Color preview')}
        >
          <span>{color.hex}</span>
          <span style={{opacity: 0.85, fontSize: '0.85rem'}}>
            {t('Text')} {contrast.text}
          </span>
        </div>

        <div className="tool-controls" style={{flexDirection: 'column', alignItems: 'stretch'}}>
          <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
            <span className="field__label">{t('Picker')}</span>
            <input
              className="field__color"
              type="color"
              value={picker}
              onChange={e => tryParse(e.target.value)}
            />
          </label>

          <label className="field field--block">
            <span className="field__label">HEX</span>
            <div className="color-input-row">
              <input
                className="field__input"
                value={hexInput}
                onChange={e => setHexInput(e.target.value)}
                onBlur={() => tryParse(hexInput)}
                onKeyDown={e => {
                  if (e.key === 'Enter') tryParse(hexInput);
                }}
                spellCheck={false}
              />
              <button type="button" className="btn btn--ghost" onClick={() => copy(color.hex, 'HEX')}>
                {t('Copy')}
              </button>
            </div>
          </label>

          <label className="field field--block">
            <span className="field__label">RGB</span>
            <div className="color-input-row">
              <input
                className="field__input"
                value={rgbInput}
                onChange={e => setRgbInput(e.target.value)}
                onBlur={() => tryParse(rgbInput)}
                onKeyDown={e => {
                  if (e.key === 'Enter') tryParse(rgbInput);
                }}
                spellCheck={false}
              />
              <button type="button" className="btn btn--ghost" onClick={() => copy(color.rgbString, 'RGB')}>
                {t('Copy')}
              </button>
            </div>
          </label>

          <div className="color-sliders">
            {(['r', 'g', 'b'] as const).map(key => (
              <label key={key} className="field field--block">
                <span className="field__label">
                  {key.toUpperCase()} {color.rgb[key]}
                </span>
                <input
                  className="field__range"
                  type="range"
                  min={0}
                  max={255}
                  value={color.rgb[key]}
                  onChange={e => patchRgb({[key]: Number(e.target.value)})}
                />
              </label>
            ))}
          </div>

          <label className="field field--block">
            <span className="field__label">HSL</span>
            <div className="color-input-row">
              <input
                className="field__input"
                value={hslInput}
                onChange={e => setHslInput(e.target.value)}
                onBlur={() => tryParse(hslInput)}
                onKeyDown={e => {
                  if (e.key === 'Enter') tryParse(hslInput);
                }}
                spellCheck={false}
              />
              <button type="button" className="btn btn--ghost" onClick={() => copy(color.hslString, 'HSL')}>
                {t('Copy')}
              </button>
            </div>
          </label>

          <div className="color-sliders">
            <label className="field field--block">
              <span className="field__label">H {color.hsl.h}</span>
              <input
                className="field__range"
                type="range"
                min={0}
                max={360}
                step={0.1}
                value={color.hsl.h}
                onChange={e => patchHsl({h: Number(e.target.value)})}
              />
            </label>
            <label className="field field--block">
              <span className="field__label">S {color.hsl.s}%</span>
              <input
                className="field__range"
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={color.hsl.s}
                onChange={e => patchHsl({s: Number(e.target.value)})}
              />
            </label>
            <label className="field field--block">
              <span className="field__label">L {color.hsl.l}%</span>
              <input
                className="field__range"
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={color.hsl.l}
                onChange={e => patchHsl({l: Number(e.target.value)})}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="color-contrast">
        <p className="tool-status">
          {t('Contrast on white')} <strong>{contrast.white}:1</strong>
          {contrast.white >= 4.5 ? t(' (AA pass)') : t(' (AA fail)')}
        </p>
        <p className="tool-status">
          {t('Contrast on black')} <strong>{contrast.black}:1</strong>
          {contrast.black >= 4.5 ? t(' (AA pass)') : t(' (AA fail)')}
        </p>
        <p className="tool-status tool-status--ok">
          {t('Suggested text color:')} {contrast.text}
        </p>
      </div>

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" onClick={() => copy(color.hex, 'HEX')}>
          {t('Copy HEX')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => copy(color.rgbString, 'RGB')}>
          {t('Copy RGB')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => copy(color.hslString, 'HSL')}>
          {t('Copy HSL')}
        </button>
        {message ? (
          <p className={`tool-status${message.type === 'error' ? ' tool-status--error' : ' tool-status--ok'}`}>{t(message.text)}</p>
        ) : null}
      </div>
    </ToolPageShell>
  );
}
