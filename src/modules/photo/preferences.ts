export type NewDocumentFill = 'white' | 'transparent' | 'bg';

export type NewDocumentSettings = {
  width: number;
  height: number;
  fill: NewDocumentFill;
};

const NEW_DOCUMENT_SETTINGS_KEY = 'kaisa-photo:new-document-settings';
const DEFAULT_SETTINGS: NewDocumentSettings = {
  width: 1200,
  height: 800,
  fill: 'white'
};

function clampDimension(value: unknown, fallback: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(1, Math.min(8192, Math.round(number)));
}

function isFill(value: unknown): value is NewDocumentFill {
  return value === 'white' || value === 'transparent' || value === 'bg';
}

export function loadNewDocumentSettings(): NewDocumentSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;

  try {
    const raw = window.localStorage.getItem(NEW_DOCUMENT_SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const saved = JSON.parse(raw) as Partial<NewDocumentSettings>;
    return {
      width: clampDimension(saved.width, DEFAULT_SETTINGS.width),
      height: clampDimension(saved.height, DEFAULT_SETTINGS.height),
      fill: isFill(saved.fill) ? saved.fill : DEFAULT_SETTINGS.fill
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveNewDocumentSettings(settings: NewDocumentSettings) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      NEW_DOCUMENT_SETTINGS_KEY,
      JSON.stringify({
        width: clampDimension(settings.width, DEFAULT_SETTINGS.width),
        height: clampDimension(settings.height, DEFAULT_SETTINGS.height),
        fill: isFill(settings.fill) ? settings.fill : DEFAULT_SETTINGS.fill
      })
    );
  } catch {
    // Storage may be unavailable in private or restricted browser contexts.
  }
}
