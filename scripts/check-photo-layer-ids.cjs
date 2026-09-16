const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
function load(file, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText;
  vm.runInNewContext(code, {exports, crypto: globalThis.crypto, require: name => dependencies[name] ?? {} });
  return exports;
}
(async () => {
  const layers = load('src/modules/photo/layers.ts');
  const existing = new Set(['layer-2', 'layer-3']);
  for (let i = 0; i < 1000; i++) {
    const id = layers.nextLayerId();
    assert(!existing.has(id));
    existing.add(id);
  }
  // A module reload must not reuse any previous document or layer ID.
  const reloaded = load('src/modules/photo/layers.ts');
  assert(!existing.has(reloaded.nextLayerId()));
  assert.notEqual(layers.nextDocId(), reloaded.nextDocId());
  const persistence = load('src/modules/photo/persistence.ts', {'./layers': layers});
  const restored = await persistence.deserializeDocument({id: 'doc-2', docName: 'Recovered', width: 100, height: 100, activeLayerId: 'layer-2', zoom: 1, pan: {x:0,y:0}, guides: [], dirty: true, layers: [
    {id:'layer-2', name:'First', kind:'text', text:{content:'A'}},
    {id:'layer-2', name:'Second', kind:'text', text:{content:'B'}}
  ]});
  assert.equal(restored.layers.length, 2);
  assert.notEqual(restored.layers[0].id, restored.layers[1].id);
  assert.equal(restored.layers[0].text.content, 'A');
  assert.equal(restored.layers[1].text.content, 'B');
  assert.equal(restored.activeLayerId, restored.layers[0].id);
  console.log('PASS: ID uniqueness, module reload, duplicate autosave recovery');
})().catch(error => {console.error(error); process.exitCode = 1;});