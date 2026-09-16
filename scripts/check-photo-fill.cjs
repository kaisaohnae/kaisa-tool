const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const exportsForTest = {};
const code = ts.transpileModule(fs.readFileSync('src/modules/photo/selection.ts', 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText;
vm.runInNewContext(code, {exports: exportsForTest, require: () => ({})});
function context() {
  const calls = [];
  return {calls, globalAlpha: 1, globalCompositeOperation: 'source-over', save() {this.previous = [this.globalAlpha, this.globalCompositeOperation];}, restore() {[this.globalAlpha, this.globalCompositeOperation] = this.previous;}, beginPath(){}, rect(...args){calls.push(['rect', ...args]);}, clip(){calls.push(['clip']);}, fillRect(...args){calls.push(['fill', this.fillStyle, this.globalAlpha, this.globalCompositeOperation, ...args]);}};
}
let ctx = context();
let canvas = {width: 100, height: 80, getContext: () => ctx};
exportsForTest.fillSelectionArea(canvas, null, '#123456');
assert.deepEqual(ctx.calls.at(-1), ['fill','#123456',1,'source-over',0,0,100,80]);
ctx = context();
exportsForTest.fillSelectionArea(canvas, {shape:'rect',x:10,y:20,w:30,h:40}, '#ffffff', null, .5, true);
assert.deepEqual(ctx.calls[0], ['rect',10,20,30,40]);
assert.equal(ctx.calls.at(-1)[2], .5);
assert.equal(ctx.calls.at(-1)[3], 'source-atop');
assert.equal(ctx.globalCompositeOperation, 'source-over');
assert.equal(ctx.globalAlpha, 1);
console.log('PASS: whole-layer fill, selection clipping, opacity, preserve transparency, context restoration');