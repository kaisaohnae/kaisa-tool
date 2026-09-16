const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const assert = require('node:assert/strict');
const paint={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/modules/photo/paint.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:paint,require:name=>name==='./color'?{hexToRgba:()=>[0,0,0]}:{}});
function context(){const calls=[];return {calls,save(){},restore(){},translate(x,y){calls.push(['translate',x,y]);},rotate(a){calls.push(['rotate',a]);},scale(x,y){calls.push(['scale',x,y]);},createRadialGradient(){return {addColorStop(){}};},beginPath(){},arc(...args){calls.push(['arc',...args]);},fill(){calls.push(['fill']);},fillRect(...args){calls.push(['square',...args]);}};}
for(const tip of ['round','square','calligraphy','spray','texture']) {
  const ctx=context();paint.drawBrushStroke(ctx,0,0,0,0,20,'#000',false,100,.5,{tip,angle:45});
  assert(ctx.calls.some(c=>c[0]===(tip==='square'?'square':'fill')));
  if(tip==='calligraphy')assert(ctx.calls.some(c=>c[0]==='scale'&&c[2]===.28));
  assert.equal(ctx.globalCompositeOperation,'source-over');
}
function stroke(segments){const ctx=context(),state={distanceToNext:0};paint.drawBrushStroke(ctx,0,0,0,0,20,'#000',false,100,1,{spacing:25,stroke:state});let from=0;for(const to of segments){paint.drawBrushStroke(ctx,from,0,to,0,20,'#000',false,100,1,{spacing:25,stroke:state});from=to;}return ctx.calls.filter(c=>c[0]==='translate').map(c=>c[1]);}
assert.deepEqual(stroke([20]),stroke([3,7,12,16,20]));
assert.deepEqual(stroke([20]),[0,5,10,15,20]);
const eraser=context();paint.drawBrushStroke(eraser,0,0,0,0,20,'#fff',true,100,1,{tip:'square'});assert.equal(eraser.globalCompositeOperation,'destination-out');
console.log('PASS: all brush tips, angle, calligraphy proportions, eraser, event-independent spacing');