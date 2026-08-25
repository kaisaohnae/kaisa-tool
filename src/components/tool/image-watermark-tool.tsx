'use client';

import {useState} from 'react';
import FileDropzone, {ToolPageShell} from '@/components/tool/file-dropzone';
import {useObjectUrl} from '@/hooks/use-object-url';
import {useT} from '@/i18n/locale-context';
import {applyWatermark, type WatermarkPosition} from '@/modules/image/watermark';
import {downloadBlob, formatBytes, replaceExtension} from '@/modules/shared/file';

const POSITION_VALUES: WatermarkPosition[] = ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'];

const POSITION_KEYS: Record<WatermarkPosition, string> = {
  'top-left': 'Top left',
  'top-right': 'Top right',
  center: 'Center',
  'bottom-left': 'Bottom left',
  'bottom-right': 'Bottom right'
};

export default function ImageWatermarkTool() {
  const t = useT();
  const [files, setFiles] = useState<File[]>([]);
  const [markFiles, setMarkFiles] = useState<File[]>([]);
  const [content, setContent] = useState('Watermark');
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState('#ffffff');
  const [opacity, setOpacity] = useState(0.45);
  const [position, setPosition] = useState<WatermarkPosition>('bottom-right');
  const [angle, setAngle] = useState(-20);
  const [tile, setTile] = useState(false);
  const [imgScale, setImgScale] = useState(0.25);
  const [imgOpacity, setImgOpacity] = useState(0.5);
  const [imgPosition, setImgPosition] = useState<WatermarkPosition>('center');
  const [format, setFormat] = useState<'image/png' | 'image/jpeg'>('image/png');
  const [quality, setQuality] = useState(0.92);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{blob: Blob; name: string} | null>(null);

  const file = files[0];
  const markFile = markFiles[0];
  const resultUrl = useObjectUrl(result?.blob);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const blob = await applyWatermark(
        file,
        content.trim()
          ? {content, fontSize, color, opacity, position, angle, tile}
          : null,
        markFile ? {file: markFile, scale: imgScale, opacity: imgOpacity, position: imgPosition} : null,
        format,
        quality
      );
      setResult({blob, name: replaceExtension(file.name, format === 'image/png' ? 'png' : 'jpg')});
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Watermark failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPageShell title="Watermark" description="Place a text or image watermark on top of the original.">
      <FileDropzone
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        files={files}
        onChange={next => {
          setFiles(next);
          setResult(null);
          setError('');
        }}
        title="Original image"
        hint="JPG, PNG, WebP"
      />

      <div className="tool-controls">
        <label className="field field--block">
          <span className="field__label">{t('Text')}</span>
          <input
            className="field__input"
            value={content}
            onChange={e => {
              setContent(e.target.value);
              setResult(null);
            }}
            placeholder={t('Watermark text')}
          />
        </label>
        <label className="field">
          <span className="field__label">{t('Font size')}</span>
          <input
            className="field__input"
            type="number"
            min={8}
            max={512}
            value={fontSize}
            onChange={e => {
              setFontSize(Number(e.target.value) || 8);
              setResult(null);
            }}
          />
        </label>
        <label className="field">
          <span className="field__label">{t('Color')}</span>
          <input
            className="field__color"
            type="color"
            value={color}
            onChange={e => {
              setColor(e.target.value);
              setResult(null);
            }}
          />
        </label>
        <label className="field">
          <span className="field__label">
            {t('Opacity')} {Math.round(opacity * 100)}%
          </span>
          <input
            className="field__range"
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={opacity}
            onChange={e => {
              setOpacity(Number(e.target.value));
              setResult(null);
            }}
          />
        </label>
        <label className="field">
          <span className="field__label">{t('Position')}</span>
          <select
            className="field__select"
            value={position}
            disabled={tile}
            onChange={e => {
              setPosition(e.target.value as WatermarkPosition);
              setResult(null);
            }}
          >
            {POSITION_VALUES.map(value => (
              <option key={value} value={value}>
                {t(POSITION_KEYS[value])}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">
            {t('Angle')} {angle}°
          </span>
          <input
            className="field__range"
            type="range"
            min={-90}
            max={90}
            step={1}
            value={angle}
            onChange={e => {
              setAngle(Number(e.target.value));
              setResult(null);
            }}
          />
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input
            type="checkbox"
            checked={tile}
            onChange={e => {
              setTile(e.target.checked);
              setResult(null);
            }}
          />
          <span className="field__label">{t('Tile repeat')}</span>
        </label>
      </div>

      <FileDropzone
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        files={markFiles}
        onChange={next => {
          setMarkFiles(next);
          setResult(null);
          setError('');
        }}
        title="Image watermark (optional)"
        hint="Logo PNG, etc."
      />

      {markFile ? (
        <div className="tool-controls">
          <label className="field">
            <span className="field__label">
              {t('Image scale')} {Math.round(imgScale * 100)}%
            </span>
            <input
              className="field__range"
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={imgScale}
              onChange={e => {
                setImgScale(Number(e.target.value));
                setResult(null);
              }}
            />
          </label>
          <label className="field">
            <span className="field__label">
              {t('Image opacity')} {Math.round(imgOpacity * 100)}%
            </span>
            <input
              className="field__range"
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={imgOpacity}
              onChange={e => {
                setImgOpacity(Number(e.target.value));
                setResult(null);
              }}
            />
          </label>
          <label className="field">
            <span className="field__label">{t('Image position')}</span>
            <select
              className="field__select"
              value={imgPosition}
              onChange={e => {
                setImgPosition(e.target.value as WatermarkPosition);
                setResult(null);
              }}
            >
              {POSITION_VALUES.map(value => (
                <option key={value} value={value}>
                  {t(POSITION_KEYS[value])}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      <div className="tool-controls">
        <label className="field">
          <span className="field__label">{t('Output format')}</span>
          <select
            className="field__select"
            value={format}
            onChange={e => {
              setFormat(e.target.value as 'image/png' | 'image/jpeg');
              setResult(null);
            }}
          >
            <option value="image/png">PNG</option>
            <option value="image/jpeg">JPG</option>
          </select>
        </label>
        {format === 'image/jpeg' ? (
          <label className="field">
            <span className="field__label">
              {t('JPG quality')} {Math.round(quality * 100)}%
            </span>
            <input
              className="field__range"
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={quality}
              onChange={e => {
                setQuality(Number(e.target.value));
                setResult(null);
              }}
            />
          </label>
        ) : null}
      </div>

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" disabled={!file || busy} onClick={run}>
          {busy ? t('Applying…') : t('Apply watermark')}
        </button>
        {result ? (
          <button type="button" className="btn btn--ghost" onClick={() => downloadBlob(result.blob, result.name)}>
            {t('Download')} ({formatBytes(result.blob.size)})
          </button>
        ) : null}
        {error ? <p className="tool-status tool-status--error">{t(error)}</p> : null}
      </div>

      {result && resultUrl ? (
        <div className="preview-box">
          <img src={resultUrl} alt={t('Result preview')} />
          <div className="preview-meta">
            <span>{formatBytes(result.blob.size)}</span>
          </div>
        </div>
      ) : null}
    </ToolPageShell>
  );
}
