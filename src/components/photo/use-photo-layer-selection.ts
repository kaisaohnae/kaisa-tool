import {useState} from 'react';
import {layerSelectionRange} from '@/modules/photo/layer-selection';
import type {PhotoLayer} from '@/modules/photo';

export function usePhotoLayerSelection({layers, activeLayerId, documentId, setActiveLayerId}: {
  layers: PhotoLayer[]; activeLayerId: string; documentId: string; setActiveLayerId: (id: string) => void;
}) {
  const [selection, setSelection] = useState<{activeId: string; documentId: string; anchor: string; ids: string[]} | null>(null);
  const selectedIds = selection?.activeId === activeLayerId && selection.documentId === documentId
    ? selection.ids.filter(id => layers.some(layer => layer.id === id))
    : layers.some(layer => layer.id === activeLayerId) ? [activeLayerId] : [];
  const selectLayer = (id: string, shift = false, preserve = false, toggle = false) => {
    const anchor = shift ? selection?.documentId === documentId && selection.activeId === activeLayerId ? selection.anchor : activeLayerId : id;
    const ids = shift ? layerSelectionRange(layers, anchor, id) : toggle
      ? selectedIds.includes(id) ? selectedIds.filter(selected => selected !== id) : [...selectedIds, id]
      : preserve && selectedIds.includes(id) ? selectedIds : [id];
    const nextActive = ids.includes(id) ? id : ids[ids.length - 1] ?? '';
    setSelection({activeId: nextActive, documentId, anchor, ids});
    setActiveLayerId(nextActive);
  };
  const resetSelection = (id: string) => {
    setSelection({activeId: id, documentId, anchor: id, ids: [id]});
    setActiveLayerId(id);
  };
  return {selectedIds, selectLayer, resetSelection};
}