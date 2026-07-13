import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const component = readFileSync(new URL('../src/components/CinematicHomepage.astro', import.meta.url), 'utf8');
const media = readFileSync(new URL('../src/lib/cinematicMedia.ts', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/styles/cinematic-home.css', import.meta.url), 'utf8');
const indexPage = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../src/layouts/Layout.astro', import.meta.url), 'utf8');

test('cinematic homepage uses responsive generated WebP artwork instead of video', () => {
  assert.match(component, /<picture/);
  assert.doesNotMatch(component, /<video|back\.mp4/);
  for (const asset of ['hero-desktop-4k.webp', 'hero-tablet.webp', 'hero-mobile-4k.webp']) {
    assert.ok(media.includes(asset), `${asset} should be configured`);
  }
});

test('all cinematic atlas subjects are rendered as linked meteor artwork', () => {
  for (const key of ['science', 'history', 'art', 'future', 'astrophysics', 'mathematics', 'jlog', 'me']) {
    assert.match(component, new RegExp(`key: ["']${key}["']`));
  }
  assert.match(component, /cinematic-home__trail/);
  assert.match(component, /\/images\/cinematic-home\/\$\{meteor\.key\}\.webp/);
});

test('homepage chrome is hidden while inner-page chrome remains available', () => {
  assert.match(indexPage, /hideChrome/);
  assert.match(layout, /!hideChrome && <header class="topbar">/);
  assert.match(layout, /!hideChrome && <footer class="site-footer">/);
});

test('animation is clipped to the window and respects reduced motion', () => {
  assert.match(styles, /\.cinematic-home__sky\s*\{/);
  assert.match(styles, /overflow:\s*hidden/);
  assert.match(styles, /@keyframes meteor-flight/);
  assert.match(styles, /animation-play-state:\s*paused/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});

test('background and meteor artwork preserve their aspect ratios', () => {
  assert.match(styles, /object-fit:\s*cover/);
  assert.match(styles, /object-fit:\s*contain/);
});
