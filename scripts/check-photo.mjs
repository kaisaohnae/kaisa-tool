import {readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const checks = readdirSync(new URL('.', import.meta.url)).filter(name => /^check-photo-.*\.cjs$/.test(name)).sort();
for (const check of checks) {
  const result = spawnSync(process.execPath, [new URL(check, import.meta.url).pathname.replace(/^\/(\w:)/, '$1')], {stdio: 'inherit', cwd: new URL('..', import.meta.url)});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`All ${checks.length} photo editor checks passed.`);