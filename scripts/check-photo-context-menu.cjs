const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
const layout={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/modules/photo/context-menu.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:layout});
const normal=layout.fitContextMenu(100,100,180,300,800,600);
assert.equal(normal.left,100); assert.equal(normal.top,100);
const corner=layout.fitContextMenu(790,590,180,300,800,600);
assert.equal(corner.left,610); assert.equal(corner.top,290);
for(const [vw,vh] of [[800,600],[320,240],[200,100]]) {
 const width=Math.min(180,vw-16),height=Math.min(400,vh-16);
 for(const x of [0,8,vw/2,vw-2]) for(const y of [0,8,vh/2,vh-2]) {
  const p=layout.fitContextMenu(x,y,width,height,vw,vh);
  assert(p.left>=8 && p.top>=8);
  assert(p.left+width<=vw-8 && p.top+height<=vh-8);
 }
}
console.log('PASS: normal placement, left/up flipping, viewport corners, small screens');