import {filesFromClipboard} from '@/modules/shared/file';

type PasteTarget = {
  accept: string;
  addFiles: (files: File[]) => void;
};

let activePasteTarget: PasteTarget | null = null;
let pasteListenerAttached = false;

function isEditablePasteTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;

  const tag = target.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag !== 'INPUT') return !!target.closest('[contenteditable="true"]');

  const input = target as HTMLInputElement;
  const type = (input.type || 'text').toLowerCase();
  return type === 'text' || type === 'search' || type === 'url' || type === 'email' || type === 'password' || type === 'number';
}

function onWindowPaste(event: ClipboardEvent) {
  if (isEditablePasteTarget(event.target) || !activePasteTarget) return;

  const files = filesFromClipboard(event.clipboardData, activePasteTarget.accept);
  if (!files.length) return;

  event.preventDefault();
  activePasteTarget.addFiles(files);
}

export function registerPasteTarget(target: PasteTarget) {
  if (!pasteListenerAttached && typeof window !== 'undefined') {
    window.addEventListener('paste', onWindowPaste);
    pasteListenerAttached = true;
  }
  activePasteTarget = target;
}

export function unregisterPasteTarget(target: PasteTarget) {
  if (activePasteTarget === target) {
    activePasteTarget = null;
  }
}
