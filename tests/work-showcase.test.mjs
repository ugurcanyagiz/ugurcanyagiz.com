import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('../src/pages/work.astro', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../src/layouts/Layout.astro', import.meta.url), 'utf8');
const nav = readFileSync(new URL('../src/lib/navigation.ts', import.meta.url), 'utf8');
const home = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/styles/work.css', import.meta.url), 'utf8');

test('work showcase stays unlisted and opts out of indexing', () => {
  assert.match(page, /robots="noindex, nofollow"/);
  assert.match(page, /hideChrome/);
  assert.match(layout, /<meta name="robots" content=\{robots\}/);
  assert.doesNotMatch(nav, /\/work/);
  assert.doesNotMatch(home, /\/work/);
});

test('work showcase labels fictional data and includes requested interactions', () => {
  assert.match(page, /All companies, transactions, and financial values.*fictional sample data/);
  assert.match(page, /data-reconcile-button/);
  assert.match(page, /data-ar-filter/);
  assert.match(page, /data-sheet-filter/);
  assert.match(page, /SAP Business One HANA/);
  assert.match(page, /Automation supports judgment/);
});

test('work showcase includes responsive and reduced-motion treatment', () => {
  assert.match(styles, /@media\(max-width:600px\)/);
  assert.match(styles, /prefers-reduced-motion:reduce/);
});
