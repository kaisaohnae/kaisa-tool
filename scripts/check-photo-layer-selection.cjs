const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
function load(file,deps={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:name=>deps[name]??{}});return exports;}
const logic=load('src/modules/photo/layer-selection.ts');
const layers=['a','b','c','d','e'].map(id=>({id,kind:'raster'}));
assert.equal(logic.layerSelectionRange(layers,'b','e').join(','),'b,c,d,e');
assert.equal(logic.layerSelectionRange(layers,'e','b').join(','),'b,c,d,e');
const merged=logic.replaceMergedLayers(layers,['b','d'],{id:'merged',kind:'raster'});
assert.equal(merged.map(l=>l.id).join(','),'a,c,merged,e');
let state=null, active='b', documentId='doc1';
const hook=load('src/components/photo/use-photo-layer-selection.ts',{'react':{useState:()=>[state,value=>state=value]},'@/modules/photo/layer-selection':logic});
function render(){return hook.usePhotoLayerSelection({layers,activeLayerId:active,documentId,setActiveLayerId:id=>active=id});}
render().selectLayer('e',true); assert.equal(render().selectedIds.join(','),'b,c,d,e');
render().selectLayer('c',true); assert.equal(render().selectedIds.join(','),'b,c');
render().selectLayer('a'); assert.equal(render().selectedIds.join(','),'a');
render().selectLayer('d',false,false,true);assert.equal(render().selectedIds.join(','),'a,d');
render().selectLayer('d',false,false,true);assert.equal(render().selectedIds.join(','),'a');assert.equal(active,'a');
render().selectLayer('d',false,false,true);render().selectLayer('a',false,true);assert.equal(render().selectedIds.join(','),'a,d');
documentId='doc2';assert.equal(render().selectedIds.join(','),'a');
render().resetSelection('c');assert.equal(render().selectedIds.join(','),'c');
console.log('PASS: Shift range, Ctrl toggling, deselected active layer, context-menu preservation, document reset, selected-only merge ordering');