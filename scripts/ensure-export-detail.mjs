import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const dotNext = join(root, '.next');

if (existsSync(dotNext)) {
  const walk = (dir, out = []) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) walk(p, out);
      else if (entry.name.endsWith('.nft.json')) out.push(p);
    }
    return out;
  };

  const missing = [];
  for (const nft of walk(dotNext)) {
    const manifest = JSON.parse(readFileSync(nft, 'utf8'));
    const list = Array.isArray(manifest.files)
      ? manifest.files
      : Object.keys(manifest.files || {});
    for (const rel of list) {
      if (typeof rel !== 'string') continue;
      const abs = resolve(dirname(nft), rel);
      if (!existsSync(abs)) missing.push(abs);
    }
  }

  const materialize = (abs) => {
    if (existsSync(abs)) return;
    const within =
      relative(dotNext, abs) !== '' &&
      !relative(dotNext, abs).startsWith(`..${sep}`);
    if (!within) return;
    mkdirSync(dirname(abs), { recursive: true });
    const body = abs.endsWith('.nft.json') ? '{}' : '';
    writeFileSync(abs, body);
  };

  const exportDetail = join(dotNext, 'export-detail.json');
  writeFileSync(
    exportDetail,
    JSON.stringify({ version: 99, success: false, outDirectory: '' }, null, 2),
    'utf8'
  );
  for (const abs of missing) materialize(abs);
  console.log(`materialized ${missing.length} missing trace files`);
} else {
  console.log('No .next directory found');
}