const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const assert = require('node:assert/strict');
function load(file, dependencies={}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:name=>dependencies[name]??{}});
  return exports;
}
const guides=load('src/modules/photo/guides.ts');
assert.equal(guides.rulerGuideOrientation(100,10),'horizontal');
assert.equal(guides.rulerGuideOrientation(10,100),'vertical');
assert.equal(guides.rulerGuideOrientation(10,10),null);
assert.equal(guides.rulerGuideOrientation(100,100),null);
const guide={id:'g',orientation:'vertical',position:100};
assert.equal(guides.hitGuide({x:109,y:0},[guide],.5),guide);
assert.equal(guides.hitGuide({x:111,y:0},[guide],.5),null);
const calls=[];
const context={drawImage(){calls.push('draw');},fillRect(){calls.push([this.globalCompositeOperation,this.fillStyle]);}};
const mask={getContext:()=>context,width:10,height:10};
const selection=load('src/modules/photo/selection.ts',{'./canvas':{getOpaqueBounds:()=>({x:2,y:3,w:4,h:5}),createLayerCanvas:()=>mask}});
const result=selection.selectionFromLayerAlpha({width:10,height:10});
assert.equal(result.mask,mask);
assert.equal(result.selection.x,2);
assert.equal(result.selection.w,4);
assert.deepEqual(calls,['draw',['source-in','#ffffff']]);
assert.equal(context.globalCompositeOperation,'source-over');
console.log('PASS: ruler direction, corner exclusion, zoom-aware guide picking, alpha-mask selection');