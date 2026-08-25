'use client';

import {useMemo, useState} from 'react';
import {ToolPageShell} from '@/components/tool/file-dropzone';
import {useT} from '@/i18n/locale-context';
import {
  BYTE_UNITS,
  convertBytes,
  convertLength,
  convertPxRem,
  convertTemperature,
  formatUnitNumber,
  type ByteUnit,
  type LengthUnit,
  type UnitCategory
} from '@/modules/util/unit';

const LENGTH_UNITS: LengthUnit[] = ['m', 'cm', 'mm', 'km', 'in', 'ft'];
const TEMP_UNITS = ['C', 'F', 'K'] as const;

export default function UnitTool() {
  const t = useT();
  const [category, setCategory] = useState<UnitCategory>('pxrem');
  const [value, setValue] = useState('16');
  const [base, setBase] = useState('16');
  const [fromPx, setFromPx] = useState<'px' | 'rem'>('px');
  const [toPx, setToPx] = useState<'px' | 'rem'>('rem');
  const [fromByte, setFromByte] = useState<ByteUnit>('MB');
  const [toByte, setToByte] = useState<ByteUnit>('KB');
  const [fromTemp, setFromTemp] = useState<(typeof TEMP_UNITS)[number]>('C');
  const [toTemp, setToTemp] = useState<(typeof TEMP_UNITS)[number]>('F');
  const [fromLen, setFromLen] = useState<LengthUnit>('m');
  const [toLen, setToLen] = useState<LengthUnit>('ft');
  const [message, setMessage] = useState<{type: 'ok' | 'error'; text: string} | null>(null);

  const result = useMemo(() => {
    const num = Number(value);
    if (category === 'pxrem') {
      return convertPxRem(num, fromPx, toPx, Number(base) || 16);
    }
    if (category === 'bytes') return convertBytes(num, fromByte, toByte);
    if (category === 'temperature') return convertTemperature(num, fromTemp, toTemp);
    return convertLength(num, fromLen, toLen);
  }, [category, value, base, fromPx, toPx, fromByte, toByte, fromTemp, toTemp, fromLen, toLen]);

  const swap = () => {
    if (category === 'pxrem') {
      setFromPx(toPx);
      setToPx(fromPx);
    } else if (category === 'bytes') {
      setFromByte(toByte);
      setToByte(fromByte);
    } else if (category === 'temperature') {
      setFromTemp(toTemp);
      setToTemp(fromTemp);
    } else {
      setFromLen(toLen);
      setToLen(fromLen);
    }
  };

  const copy = async () => {
    if (!result.ok || result.value === undefined) {
      setMessage({type: 'error', text: 'No result to copy.'});
      return;
    }
    try {
      await navigator.clipboard.writeText(formatUnitNumber(result.value));
      setMessage({type: 'ok', text: 'Copied to clipboard.'});
    } catch {
      setMessage({type: 'error', text: 'Copy failed.'});
    }
  };

  return (
    <ToolPageShell title="Unit Converter" description="Convert length, file size, temperature, and px/rem.">
      <div className="tool-controls">
        <label className="field">
          <span className="field__label">{t('Category')}</span>
          <select
            className="field__select"
            value={category}
            onChange={e => {
              setCategory(e.target.value as UnitCategory);
              setMessage(null);
            }}
          >
            <option value="pxrem">px ↔ rem</option>
            <option value="bytes">{t('Bytes')}</option>
            <option value="temperature">{t('Temperature')}</option>
            <option value="length">{t('Length')}</option>
          </select>
        </label>

        <label className="field">
          <span className="field__label">{t('Value')}</span>
          <input
            className="field__input"
            value={value}
            onChange={e => {
              setValue(e.target.value);
              setMessage(null);
            }}
            inputMode="decimal"
          />
        </label>

        {category === 'pxrem' ? (
          <>
            <label className="field">
              <span className="field__label">{t('Base (1rem)')}</span>
              <input className="field__input" value={base} onChange={e => setBase(e.target.value)} inputMode="decimal" />
            </label>
            <label className="field">
              <span className="field__label">{t('From')}</span>
              <select className="field__select" value={fromPx} onChange={e => setFromPx(e.target.value as 'px' | 'rem')}>
                <option value="px">px</option>
                <option value="rem">rem</option>
              </select>
            </label>
            <label className="field">
              <span className="field__label">{t('To')}</span>
              <select className="field__select" value={toPx} onChange={e => setToPx(e.target.value as 'px' | 'rem')}>
                <option value="px">px</option>
                <option value="rem">rem</option>
              </select>
            </label>
          </>
        ) : null}

        {category === 'bytes' ? (
          <>
            <label className="field">
              <span className="field__label">{t('From')}</span>
              <select className="field__select" value={fromByte} onChange={e => setFromByte(e.target.value as ByteUnit)}>
                {BYTE_UNITS.map(u => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">{t('To')}</span>
              <select className="field__select" value={toByte} onChange={e => setToByte(e.target.value as ByteUnit)}>
                {BYTE_UNITS.map(u => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        {category === 'temperature' ? (
          <>
            <label className="field">
              <span className="field__label">{t('From')}</span>
              <select
                className="field__select"
                value={fromTemp}
                onChange={e => setFromTemp(e.target.value as (typeof TEMP_UNITS)[number])}
              >
                {TEMP_UNITS.map(u => (
                  <option key={u} value={u}>
                    °{u}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">{t('To')}</span>
              <select
                className="field__select"
                value={toTemp}
                onChange={e => setToTemp(e.target.value as (typeof TEMP_UNITS)[number])}
              >
                {TEMP_UNITS.map(u => (
                  <option key={u} value={u}>
                    °{u}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        {category === 'length' ? (
          <>
            <label className="field">
              <span className="field__label">{t('From')}</span>
              <select className="field__select" value={fromLen} onChange={e => setFromLen(e.target.value as LengthUnit)}>
                {LENGTH_UNITS.map(u => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">{t('To')}</span>
              <select className="field__select" value={toLen} onChange={e => setToLen(e.target.value as LengthUnit)}>
                {LENGTH_UNITS.map(u => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}
      </div>

      <div className="stats-grid" style={{gridTemplateColumns: '1fr'}}>
        <div className="stats-grid__item">
          <span className="stats-grid__label">{t('Result')}</span>
          <strong className="stats-grid__value">
            {result.ok && result.value !== undefined
              ? formatUnitNumber(result.value)
              : result.error
                ? t(result.error)
                : '—'}
          </strong>
        </div>
      </div>

      <div className="tool-actions">
        <button type="button" className="btn btn--ghost" onClick={swap}>
          {t('Swap units')}
        </button>
        <button type="button" className="btn btn--primary" onClick={copy} disabled={!result.ok}>
          {t('Copy')}
        </button>
        {message ? (
          <p className={`tool-status${message.type === 'error' ? ' tool-status--error' : ' tool-status--ok'}`}>{t(message.text)}</p>
        ) : null}
        {result.error ? <p className="tool-status tool-status--error">{t(result.error)}</p> : null}
      </div>
    </ToolPageShell>
  );
}
