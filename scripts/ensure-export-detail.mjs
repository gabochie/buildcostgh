import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const target = join(root, '.next', 'export-detail.json');

await writeFile(
  target,
  JSON.stringify({ version: 99, success: false, outDirectory: '' }, null, 2),
  'utf8'
);

console.log(`Wrote ${target}`);