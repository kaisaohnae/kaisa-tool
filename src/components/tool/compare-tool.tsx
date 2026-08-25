'use client';

import {useMemo, useState} from 'react';
import {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {compareTexts, type CompareOptions} from '@/modules/edit/compare';

const DEFAULT_OPTIONS: CompareOptions = {
  ignoreEmpty: false,
  trim: true,
  ignoreCase: false
};

export default function CompareTool() {
  const t = useT();
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [options, setOptions] = useState<CompareOptions>(DEFAULT_OPTIONS);
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [ran, setRan] = useState(false);

  const result = useMemo(() => {
    if (!ran) return null;
    return compareTexts(left, right, options);
  }, [left, right, options, ran]);

  const rows = useMemo(() => {
    if (!result) return [];
    return onlyDiff ? result.rows.filter(row => row.kind !== 'same') : result.rows;
  }, [result, onlyDiff]);

  const patch = <K extends keyof CompareOptions>(key: K, value: CompareOptions[K]) => {
    setOptions(prev => ({...prev, [key]: value}));
  };

  const swap = () => {
    setLeft(right);
    setRight(left);
  };

  const clear = () => {
    setLeft('');
    setRight('');
    setRan(false);
  };

  return (
    <ToolPageShell title="Compare" description="Diff two texts line by line.">
      <div className="tool-controls">
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={options.trim} onChange={e => patch('trim', e.target.checked)} />
          <span className="field__label">{t('Ignore leading/trailing spaces')}</span>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={options.ignoreEmpty} onChange={e => patch('ignoreEmpty', e.target.checked)} />
          <span className="field__label">{t('Ignore blank lines')}</span>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={options.ignoreCase} onChange={e => patch('ignoreCase', e.target.checked)} />
          <span className="field__label">{t('Ignore case')}</span>
        </label>
        <label className="field" style={{flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 'auto'}}>
          <input type="checkbox" checked={onlyDiff} onChange={e => setOnlyDiff(e.target.checked)} />
          <span className="field__label">{t('Show differences only')}</span>
        </label>
      </div>

      <div className="compare-grid">
        <label className="field field--block">
          <span className="field__label">{t('Left (original)')}</span>
          <textarea
            className="field__textarea field__textarea--sm"
            value={left}
            onChange={e => {
              setLeft(e.target.value);
              setRan(false);
            }}
            placeholder={t('Original text')}
            spellCheck={false}
            rows={12}
          />
        </label>
        <label className="field field--block">
          <span className="field__label">{t('Right (compare)')}</span>
          <textarea
            className="field__textarea field__textarea--sm"
            value={right}
            onChange={e => {
              setRight(e.target.value);
              setRan(false);
            }}
            placeholder={t('Text to compare')}
            spellCheck={false}
            rows={12}
          />
        </label>
      </div>

      <div className="tool-actions">
        <button type="button" className="btn btn--primary" onClick={() => setRan(true)} disabled={!left && !right}>
          {t('Compare')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={swap} disabled={!left && !right}>
          {t('Swap left/right')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={clear} disabled={!left && !right && !ran}>
          {t('Clear')}
        </button>
        {result ? (
          <p className="tool-status">
            {t('Same')} {result.same} · {t('Added')} {result.added} · {t('Removed')} {result.removed}
          </p>
        ) : null}
      </div>

      {result ? (
        <div className="diff-table-wrap">
          <table className="diff-table">
            <thead>
              <tr>
                <th className="diff-table__no">#</th>
                <th>{t('Left')}</th>
                <th className="diff-table__no">#</th>
                <th>{t('Right')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="diff-table__empty">
                    {t('No differences to show.')}
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={index} className={`diff-row diff-row--${row.kind}`}>
                    <td className="diff-table__no">{row.leftNo ?? ''}</td>
                    <td className="diff-table__code">{row.left ?? ''}</td>
                    <td className="diff-table__no">{row.rightNo ?? ''}</td>
                    <td className="diff-table__code">{row.right ?? ''}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </ToolPageShell>
  );
}
