import JSZip from 'jszip';
import {canvasFromImageFile} from './canvas';
import type {PhotoGuide} from './guides';
import type {PhotoLayer} from './types';

const PROJECT_VERSION = 1;

export type PhotoProjectSettings = {
  foreground: string;
  background: string;
  showGrid: boolean;
  showRulers: boolean;
  snapEnabled: boolean;
  gridSize: number;
  guides: PhotoGuide[];
};

export type PhotoProject = {
  name: string;
  width: number;
  height: number;
  activeLayerId: string;
  layers: PhotoLayer[];
  buffers: Map<string, HTMLCanvasElement>;
  masks: Map<string, HTMLCanvasElement>;
  settings: PhotoProjectSettings;
};

type ProjectManifest = {
  format: 'kaisa-photo';
  version: number;
  name: string;
  width: number;
  height: number;
  activeLayerId: string;
  settings: PhotoProjectSettings;
  layers: Array<PhotoLayer & {bufferFile?: string; maskFile?: string}>;
};

function canvasToPng(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not encode a layer.')), 'image/png');
  });
}

export async function serializePhotoProject(project: PhotoProject): Promise<Blob> {
  const zip = new JSZip();
  const manifest: ProjectManifest = {
    format: 'kaisa-photo',
    version: PROJECT_VERSION,
    name: project.name,
    width: project.width,
    height: project.height,
    activeLayerId: project.activeLayerId,
    settings: project.settings,
    layers: []
  };

  for (const layer of project.layers) {
    const entry: ProjectManifest['layers'][number] = {...layer};
    const buffer = project.buffers.get(layer.id);
    if (buffer) {
      entry.bufferFile = `layers/${layer.id}.png`;
      zip.file(entry.bufferFile, await canvasToPng(buffer));
    }
    const mask = project.masks.get(layer.id);
    if (mask) {
      entry.maskFile = `masks/${layer.id}.png`;
      zip.file(entry.maskFile, await canvasToPng(mask));
    }
    manifest.layers.push(entry);
  }

  zip.file('project.json', JSON.stringify(manifest));
  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {level: 6},
    mimeType: 'application/x-kaisa-photo'
  });
}

async function loadCanvas(zip: JSZip, path?: string) {
  if (!path) return null;
  const entry = zip.file(path);
  if (!entry) throw new Error(`Missing project asset: ${path}`);
  const blob = await entry.async('blob');
  return canvasFromImageFile(new File([blob], path, {type: 'image/png'}));
}

export async function deserializePhotoProject(file: File): Promise<PhotoProject> {
  const zip = await JSZip.loadAsync(file);
  const manifestEntry = zip.file('project.json');
  if (!manifestEntry) throw new Error('This is not a Kaisa Photo project.');
  const manifest = JSON.parse(await manifestEntry.async('text')) as ProjectManifest;
  if (manifest.format !== 'kaisa-photo' || manifest.version !== PROJECT_VERSION) {
    throw new Error('Unsupported Kaisa Photo project version.');
  }
  if (!Number.isFinite(manifest.width) || !Number.isFinite(manifest.height) || !Array.isArray(manifest.layers)) {
    throw new Error('The project file is damaged.');
  }

  const buffers = new Map<string, HTMLCanvasElement>();
  const masks = new Map<string, HTMLCanvasElement>();
  const layers: PhotoLayer[] = [];
  for (const entry of manifest.layers) {
    const {bufferFile, maskFile, ...layer} = entry;
    const buffer = await loadCanvas(zip, bufferFile);
    const mask = await loadCanvas(zip, maskFile);
    if (buffer) buffers.set(layer.id, buffer);
    if (mask) masks.set(layer.id, mask);
    layers.push(layer);
  }

  return {
    name: manifest.name || file.name.replace(/\.kphoto$/i, ''),
    width: Math.max(1, Math.round(manifest.width)),
    height: Math.max(1, Math.round(manifest.height)),
    activeLayerId: layers.some(layer => layer.id === manifest.activeLayerId)
      ? manifest.activeLayerId
      : layers[layers.length - 1]?.id ?? '',
    layers,
    buffers,
    masks,
    settings: manifest.settings ?? {
      foreground: '#000000',
      background: '#ffffff',
      showGrid: false,
      showRulers: false,
      snapEnabled: true,
      gridSize: 50,
      guides: []
    }
  };
}
