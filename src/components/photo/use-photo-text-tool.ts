import {type Dispatch, type SetStateAction, useCallback} from 'react';
import {type PhotoLayer, type PhotoTool, type TextLayerData} from '@/modules/photo';

type TextEditingState = {
  layerId: string;
  isNew: boolean;
  original: TextLayerData;
} | null;

// Text-layer editing lifecycle: entering edit mode captures the pre-edit snapshot of the
// layer's text data (for cancel), committing prunes empty new layers and derives the layer's
// display name from its first line, and cancelling restores the snapshot. Pulled out of
// PhotoEditor as a pure move (no behavior change).
export function usePhotoTextTool({
  layers,
  setLayers,
  textEditing,
  setTextEditing,
  setActiveLayerId,
  setEditTarget,
  setTool,
  setTextFontFamily,
  setTextFontSize,
  setTextFontWeight,
  setTextFontStyle,
  setTextAlign,
  setTextTracking,
  setTextLineHeight,
  setTextUnderline,
  setTextStrokeWidth,
  setTextStrokeColor,
  pushHistory,
  setStatus
}: {
  layers: PhotoLayer[];
  setLayers: Dispatch<SetStateAction<PhotoLayer[]>>;
  textEditing: TextEditingState;
  setTextEditing: Dispatch<SetStateAction<TextEditingState>>;
  setActiveLayerId: Dispatch<SetStateAction<string>>;
  setEditTarget: (target: 'layer' | 'mask') => void;
  setTool: (tool: PhotoTool) => void;
  setTextFontFamily: (value: string) => void;
  setTextFontSize: (value: number) => void;
  setTextFontWeight: (value: 'normal' | 'bold') => void;
  setTextFontStyle: (value: 'normal' | 'italic') => void;
  setTextAlign: (value: 'left' | 'center' | 'right') => void;
  setTextTracking: (value: number) => void;
  setTextLineHeight: (value: number) => void;
  setTextUnderline: (value: boolean) => void;
  setTextStrokeWidth: (value: number) => void;
  setTextStrokeColor: (value: string) => void;
  pushHistory: (label: string) => void;
  setStatus: (status: string) => void;
}) {
  const updateTextLayer = useCallback((id: string, changes: Partial<TextLayerData>) => {
    setLayers(prev => prev.map(layer =>
      layer.id === id && layer.kind === 'text' && layer.text
        ? {...layer, text: {...layer.text, ...changes}}
        : layer
    ));
  }, []);

  const startTextEditing = useCallback((layer: PhotoLayer, isNew = false) => {
    if (layer.kind !== 'text' || !layer.text || layer.locked) return;
    if (!isNew) pushHistory('Edit Text');
    setActiveLayerId(layer.id);
    setEditTarget('layer');
    setTool('text');
    setTextFontFamily(layer.text.fontFamily);
    setTextFontSize(layer.text.fontSize);
    setTextFontWeight(layer.text.fontWeight);
    setTextFontStyle(layer.text.fontStyle);
    setTextAlign(layer.text.align);
    setTextTracking(layer.text.tracking);
    setTextLineHeight(layer.text.lineHeight);
    setTextUnderline(layer.text.underline);
    setTextStrokeWidth(layer.text.strokeWidth);
    setTextStrokeColor(layer.text.strokeColor);
    setTextEditing({layerId: layer.id, isNew, original: {...layer.text}});
  }, [pushHistory]);

  const commitTextEditing = useCallback(() => {
    if (!textEditing) return;
    const layer = layers.find(item => item.id === textEditing.layerId);
    if (textEditing.isNew && !layer?.text?.content.trim()) {
      setLayers(prev => prev.filter(item => item.id !== textEditing.layerId));
      setActiveLayerId(prev => prev === textEditing.layerId ? layers.find(item => item.id !== textEditing.layerId)?.id ?? '' : prev);
    } else if (layer?.text?.content.trim()) {
      const label = layer.text.content.split('\n')[0].trim().slice(0, 36);
      setLayers(prev => prev.map(item => item.id === layer.id && item.name === 'Text' ? {...item, name: label || 'Text'} : item));
    }
    setTextEditing(null);
    setStatus('Text committed');
  }, [layers, textEditing]);

  const cancelTextEditing = useCallback(() => {
    if (!textEditing) return;
    if (textEditing.isNew) {
      setLayers(prev => prev.filter(item => item.id !== textEditing.layerId));
      setActiveLayerId(prev => prev === textEditing.layerId ? layers.find(item => item.id !== textEditing.layerId)?.id ?? '' : prev);
    } else {
      updateTextLayer(textEditing.layerId, textEditing.original);
    }
    setTextEditing(null);
    setStatus('Text editing cancelled');
  }, [layers, textEditing, updateTextLayer]);

  return {updateTextLayer, startTextEditing, commitTextEditing, cancelTextEditing};
}
