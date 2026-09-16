type NewDocumentModalProps = {
  open: boolean;
  width: number;
  height: number;
  fill: 'white' | 'transparent' | 'bg';
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  onFillChange: (value: 'white' | 'transparent' | 'bg') => void;
  onCancel: () => void;
  onCreate: () => void;
};

export function NewDocumentModal(props: NewDocumentModalProps) {
  if (!props.open) return null;
  return (
    <div className="photo-modal" onClick={props.onCancel}>
      <div className="photo-modal__card" onClick={event => event.stopPropagation()}>
        <h2>New Document</h2>
        <label>Width<input type="number" min={1} max={8192} value={props.width} onChange={event => props.onWidthChange(Number(event.target.value) || 1)} /></label>
        <label>Height<input type="number" min={1} max={8192} value={props.height} onChange={event => props.onHeightChange(Number(event.target.value) || 1)} /></label>
        <label>
          Background
          <select value={props.fill} onChange={event => props.onFillChange(event.target.value as NewDocumentModalProps['fill'])}>
            <option value="white">White</option><option value="bg">Background Color</option><option value="transparent">Transparent</option>
          </select>
        </label>
        <div className="photo-modal__actions">
          <button type="button" onClick={props.onCancel}>Cancel</button>
          <button type="button" className="is-primary" onClick={props.onCreate}>Create</button>
        </div>
      </div>
    </div>
  );
}

export function FillModal({source, color, opacity, preserveTransparency, onSourceChange, onColorChange, onOpacityChange, onPreserveChange, onCancel, onFill}: {
  source: string; color: string; opacity: number; preserveTransparency: boolean;
  onSourceChange: (value: string) => void; onColorChange: (value: string) => void;
  onOpacityChange: (value: number) => void; onPreserveChange: (value: boolean) => void;
  onCancel: () => void; onFill: () => void;
}) {
  return (
    <div className="photo-modal" onClick={onCancel}>
      <form className="photo-modal__card" role="dialog" aria-modal="true" aria-labelledby="photo-fill-title"
        onClick={event => event.stopPropagation()}
        onSubmit={event => {event.preventDefault(); onFill();}}
        onKeyDown={event => {if (event.key === 'Escape') {event.preventDefault(); onCancel();}}}>
        <h2 id="photo-fill-title">Fill</h2>
        <label>Contents
          <select autoFocus value={source} onChange={event => onSourceChange(event.target.value)}>
            <option value="foreground">Foreground Color</option>
            <option value="background">Background Color</option>
            <option value="color">Color…</option>
            <option value="black">Black</option>
            <option value="gray">50% Gray</option>
            <option value="white">White</option>
          </select>
        </label>
        {source === 'color' && <label>Color<input type="color" value={color} onChange={event => onColorChange(event.target.value)} /></label>}
        <label>Opacity (%)<input type="number" min={0} max={100} value={opacity} onChange={event => onOpacityChange(Math.max(0, Math.min(100, Number(event.target.value) || 0)))} /></label>
        <label><input type="checkbox" checked={preserveTransparency} onChange={event => onPreserveChange(event.target.checked)} />Preserve Transparency</label>
        <div className="photo-modal__actions"><button type="button" onClick={onCancel}>Cancel</button><button type="submit" className="is-primary">OK</button></div>
      </form>
    </div>
  );
}