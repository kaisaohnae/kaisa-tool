import QRCode from 'qrcode';

export type QrErrorLevel = 'L' | 'M' | 'Q' | 'H';
export type QrSize = 128 | 256 | 512 | 1024;

export interface QrOptions {
  size: QrSize;
  errorCorrectionLevel: QrErrorLevel;
  margin: number;
  darkColor: string;
  lightColor: string;
}

export const DEFAULT_QR_OPTIONS: QrOptions = {
  size: 256,
  errorCorrectionLevel: 'M',
  margin: 2,
  darkColor: '#000000',
  lightColor: '#ffffff'
};

function toQrCodeOptions(options: QrOptions) {
  return {
    width: options.size,
    margin: options.margin,
    errorCorrectionLevel: options.errorCorrectionLevel,
    color: {
      dark: options.darkColor,
      light: options.lightColor
    }
  };
}

export async function generateQrDataUrl(text: string, options: QrOptions): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Enter text.');
  }
  return QRCode.toDataURL(trimmed, toQrCodeOptions(options));
}

export async function generateQrPngBlob(text: string, options: QrOptions): Promise<Blob> {
  const dataUrl = await generateQrDataUrl(text, options);
  const res = await fetch(dataUrl);
  return res.blob();
}
