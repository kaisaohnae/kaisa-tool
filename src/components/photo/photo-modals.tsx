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
