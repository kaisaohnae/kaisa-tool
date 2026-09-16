'use client';
import {useRef, useState} from 'react';
import type {BrushTip} from '@/modules/photo';

const PRESETS: {label: string; tip: BrushTip; hardness: number; angle: number; spacing: number}[] = [
  {label: 'Hard Round', tip: 'round', hardness: 100, angle: 0, spacing: 12.5},
  {label: 'Soft Round', tip: 'round', hardness: 0, angle: 0, spacing: 10},
  {label: 'Square', tip: 'square', hardness: 100, angle: 0, spacing: 12.5},
  {label: 'Calligraphy', tip: 'calligraphy', hardness: 100, angle: -45, spacing: 8},
  {label: 'Spray', tip: 'spray', hardness: 35, angle: 0, spacing: 15},
  {label: 'Dry Brush', tip: 'texture', hardness: 80, angle: 0, spacing: 10}
];
function Preview({tip, soft = false}: {tip: BrushTip; soft?: boolean}) {
  return <svg width="64" height="32" viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
    {tip === 'square' ? <rect x="20" y="4" width="24" height="24" rx="1" /> : tip === 'calligraphy'
      ? <ellipse cx="32" cy="16" rx="16" ry="4.5" transform="rotate(-45 32 16)" /> : tip === 'round'
      ? <>{soft && [16,14,12,10].map((r,i) => <circle key={r} cx="32" cy="16" r={r} opacity={(i+1)*.09} />)}<circle cx="32" cy="16" r={soft ? 8 : 12} opacity={soft ? .4 : 1} /></>
      : <>{Array.from({length:40},(_,i) => {const a=i*2.399963,d=Math.sqrt((i+.5)/40)*14;return <circle key={i} cx={32+Math.cos(a)*d} cy={16+Math.sin(a)*d} r={tip === 'spray' ? .75 : 1.5} opacity={tip === 'spray' ? .7 : .85} />;})}</>}
  </svg>;
}
export function PhotoBrushPresets({tip, hardness, onSelect}: {tip: BrushTip; hardness: number; onSelect: (preset: typeof PRESETS[number]) => void}) {
  const panel = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({left: 104, top: 120});
  const selected = PRESETS.find(preset => preset.tip === tip && (tip !== 'round' || (hardness < 50) === (preset.hardness < 50)));
  return <>
    <button type="button" className="photo-brush-picker" popoverTarget="photo-brush-presets" aria-label="Choose brush preset"
      onClick={event => {const rect=event.currentTarget.getBoundingClientRect();setPosition({left:Math.max(8, Math.min(rect.left, innerWidth-300)),top:Math.min(rect.bottom+8,innerHeight-250)});}}>
      <Preview tip={tip} soft={tip === 'round' && hardness < 50} /><span>{selected?.label ?? 'Brush'}</span><span aria-hidden="true">⌄</span>
    </button>
    <div ref={panel} id="photo-brush-presets" popover="auto" className="photo-brush-presets" style={position}>
      <div className="photo-brush-presets__title">Brush presets <span>6 tips</span></div>
      <div className="photo-brush-presets__grid">
        {PRESETS.map(preset => <button key={preset.label} type="button" aria-pressed={preset === selected}
          onClick={() => {onSelect(preset);panel.current?.hidePopover();}}>
          <Preview tip={preset.tip} soft={preset.hardness === 0} /><span>{preset.label}</span>
        </button>)}
      </div>
    </div>
  </>;
}