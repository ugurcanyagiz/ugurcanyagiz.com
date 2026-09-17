import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['src/pages/science', 'src/pages/history', 'src/pages/art', 'src/pages/future'];
const pages = roots.flatMap((root) => readdirSync(root).filter((f) => f.endsWith('.astro')).map((f) => join(root, f)));

test('all classic article routes use shared ArticleLayout', () => {
  for (const file of pages) {
    const source = readFileSync(file, 'utf8');
    assert.match(source, /import\s+ArticleLayout\s+from\s+['"][^'"]*ArticleLayout\.astro['"]/u, file);
    assert.match(source, /<ArticleLayout\b/u, file);
  }
});

test('external article images do not request small widths', () => {
  for (const file of pages) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/<img\b[^>]*src=["'](https?:\/\/[^"']+)["'][^>]*>/giu)) {
      const url = new URL(match[1]);
      const width = Number(url.searchParams.get('w') || url.searchParams.get('width') || url.searchParams.get('maxwidth') || 0);
      assert.ok(width >= 1200, `${file} requests external image below 1200px: ${url}`);
    }
  }
});

test('shared article h1 desktop max is not above 5.5rem', () => {
  const layout = readFileSync('src/components/ArticleLayout.astro', 'utf8');
  const h1Rule = layout.match(/h1\{[^}]*font-size:\s*clamp\([^)]*\)/u)?.[0] ?? '';
  assert.match(h1Rule, /clamp\(3rem,6vw,5\.5rem\)/u);
  assert.doesNotMatch(layout, /h1\{[^}]*font-size:\s*clamp\([^)]*,\s*(?:[6-9]|\d{2,})rem\)/u);
});

test('article images include alt text and dimensions or aspect ratio', () => {
  for (const file of pages) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/<img\b([^>]*)>/giu)) {
      const attrs = match[1];
      assert.match(attrs, /\salt=("[^"]+"|'[^']+')/u, `${file} image missing meaningful alt`);
      const hasDimensions = /\swidth=("\d+"|'\d+'|\{\d+\})/u.test(attrs) && /\sheight=("\d+"|'\d+'|\{\d+\})/u.test(attrs);
      const hasAspect = /aspect-ratio/u.test(attrs);
      assert.ok(hasDimensions || hasAspect, `${file} image missing dimensions/aspect-ratio`);
    }
  }
});
