const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
class Path {constructor(){this.commands=[];}moveTo(x,y){this.commands.push(['move',x,y]);}lineTo(x,y){this.commands.push(['line',x,y]);}closePath(){this.commands.push(['close']);}}
const selection={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/modules/photo/selection.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:selection,require:()=>({}),Path2D:Path});
function mask(width,height,hole=false){const data=new Uint8ClampedArray(width*height*4);for(let y=0;y<height;y++)for(let x=0;x<width;x++)data[(y*width+x)*4+3]=hole&&x===2&&y===2?0:255;return {width,height,getContext:()=>({getImageData:()=>({data})})};}
const solid=mask(5,5),outline=selection.selectionMaskOutline(solid);
assert.equal(outline.commands.filter(c=>c[0]==='move').length,1);
assert.equal(outline.commands.filter(c=>c[0]==='line').length,20);
assert.equal(outline.commands.filter(c=>c[0]==='close').length,1);
assert.equal(selection.selectionMaskOutline(solid),outline);
const ring=selection.selectionMaskOutline(mask(5,5,true));
assert.equal(ring.commands.filter(c=>c[0]==='move').length,2);
assert.equal(ring.commands.filter(c=>c[0]==='close').length,2);
console.log('PASS: continuous outer contour, interior hole, outline caching');