const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
function load(file, dependencies={}) {const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:name=>dependencies[name]??{}});return exports;}
const geometry=load('src/modules/photo/selection.ts');
let box=geometry.rectFromDrag(50,50,80,70,100,100,'rect',{square:true});assert.equal(box.w,30);assert.equal(box.h,30);
box=geometry.rectFromDrag(50,50,70,60,100,100,'ellipse',{square:true,fromCenter:true});assert.equal(box.x,30);assert.equal(box.y,30);assert.equal(box.w,40);assert.equal(box.h,40);
box=geometry.rectFromDrag(10,10,90,90,100,100,'rect',{square:true,fromCenter:true});assert.equal(box.x,0);assert.equal(box.w,20);assert.equal(box.h,20);
box=geometry.rectFromDrag(80,80,40,60,100,100,'rect');assert.equal(box.x,40);assert.equal(box.y,60);assert.equal(box.w,40);assert.equal(box.h,20);
const before=new Uint8ClampedArray([255,0,0,255,255,0,0,255,255,0,0,255]);
geometry.blendMaskedPixels(before,new Uint8ClampedArray(12),new Uint8ClampedArray([0,0,0,0,0,0,0,128,0,0,0,255]));
assert.equal(before[3],255);assert.equal(before[7],127);assert.equal(before[11],0);assert.equal(before[4],255);
const opaque=new Uint8ClampedArray([255,0,0,255]);geometry.blendMaskedPixels(opaque,new Uint8ClampedArray([0,0,255,255]),new Uint8ClampedArray([0,0,0,128]));assert.equal(opaque[3],255);assert.equal(opaque[0],127);assert.equal(opaque[2],128);
const events=[];let layers=[{id:'bottom',kind:'raster'},{id:'active',kind:'raster'},{id:'top',kind:'raster'}];
const mask={}; const source={}; const buffers=new Map([['active',source]]);
const actions=load('src/components/photo/use-photo-selection-actions.ts',{'react':{useCallback:fn=>fn},'@/modules/photo':{
copySelectionArea:(canvas,selection,passedMask)=>{assert.equal(canvas,source);assert.equal(passedMask,mask);return 'pixels';},
createRasterLayer:()=>({id:'new',kind:'raster'}),createLayerCanvas:()=>({getContext:()=>({drawImage:(pixels,x,y)=>{assert.equal(pixels,'pixels');assert.equal(x,10);assert.equal(y,20);}})}),
clearSelectionArea:()=>events.push('clear')}}).usePhotoSelectionActions({hasDoc:true,width:100,height:100,selection:{x:10,y:20,w:30,h:40},activeLayerId:'active',activeLayer:layers[1],editTarget:'layer',buffersRef:{current:buffers},selectionMaskRef:{current:mask},pushHistory:()=>events.push('history'),setLayers:fn=>{layers=fn(layers);},setActiveLayerId:id=>assert.equal(id,'new'),setStatus:()=>{}});
actions.selectionToLayer(true);assert.equal(layers.map(l=>l.id).join(','),'bottom,active,new,top');assert.deepEqual(events,['history','clear']);assert(buffers.has('new'));
console.log('PASS: constrained shapes, center drawing, canvas bounds, feathered erasing, selection-to-layer ordering');