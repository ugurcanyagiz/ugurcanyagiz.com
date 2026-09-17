import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const shell = readFileSync(new URL('../src/components/SiteLayout.astro', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
const home = readFileSync(new URL('../src/components/CinematicHomepage.astro', import.meta.url), 'utf8');

test('every homepage destination uses the shared cinematic inner-page shell', () => {
  for (const route of ['/blog', '/science', '/history', '/art', '/future']) {
    assert.ok(home.includes(`href: "${route}"`), `${route} should remain reachable`);
  }
  assert.match(shell, /data-section=\{resolvedActive\}/);
  assert.match(shell, /site-page__cosmos/);
  assert.match(shell, /site-page__home-link/);
});

test('inner-page system keeps navigation accessible and section-aware', () => {
  assert.match(shell, /site-skip-link/);
  assert.match(shell, /id="site-content"/);
  assert.match(styles, /site-page--science/);
  assert.match(styles, /site-page--history/);
  assert.match(styles, /site-page--art/);
  assert.match(styles, /site-page--future/);
  assert.match(styles, /prefers-reduced-motion/);
});
