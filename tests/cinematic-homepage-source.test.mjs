import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const component = readFileSync(new URL('../src/components/CinematicHomepage.astro', import.meta.url), 'utf8');
const media = readFileSync(new URL('../src/lib/cinematicMedia.ts', import.meta.url), 'utf8');
const script = readFileSync(new URL('../src/scripts/cinematic-home.ts', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/styles/cinematic-home.css', import.meta.url), 'utf8');
const indexPage = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../src/layouts/Layout.astro', import.meta.url), 'utf8');

test('cinematic homepage uses available back.mp4 and omits placeholder media paths', () => {
  assert.match(media, /mp4:\s*['"]\/back\.mp4['"]/);
  assert.doesNotMatch(media, /\/media\/cinematic\//);
  assert.match(component, /src=\{media\.desktop\.mp4\}/);
  assert.doesNotMatch(component, /<source\b/);
  assert.doesNotMatch(component, /webm/i);
});

test('video behavior and mobile playback attributes remain present', () => {
  for (const token of ['autoplay', 'muted', 'loop', 'playsinline', 'preload="auto"', 'poster={media.desktop.poster}']) {
    assert.ok(component.includes(token), `${token} should be present`);
  }
  for (const token of ['video.muted = true', 'video.defaultMuted = true', 'video.playsInline = true', 'void video.play().catch']) {
    assert.ok(script.includes(token), `${token} should be present`);
  }
});


test('video diagnostics and bounded playback retry behavior are retained', () => {
  for (const token of ['loadedmetadata', 'loadeddata', 'canplay', 'playing', 'stalled', 'error']) {
    assert.ok(script.includes(token), `${token} diagnostic should be present`);
  }
  for (const token of ['video.error?.code', 'video.currentSrc', 'visibilitychange', 'retryCount >= maxPlaybackRetries']) {
    assert.ok(script.includes(token), `${token} should be present`);
  }
  assert.doesNotMatch(script, /catch\([^)]*\)\s*=>\s*\{\s*if \(!disposed\) showPosterOnly\(\);\s*\}/);
});

test('homepage chrome is hidden while inner-page chrome remains available', () => {
  assert.match(indexPage, /hideChrome/);
  assert.match(layout, /!hideChrome && <header class="topbar">/);
  assert.match(layout, /!hideChrome && <footer class="site-footer">/);
});

test('reduced-motion fallback and video-failure fallback remain available', () => {
  assert.ok(styles.includes('@media (prefers-reduced-motion: reduce)'));
  assert.ok(script.includes('REDUCED_MOTION_QUERY'));
  assert.ok(script.includes('data-reduced-motion'));
  assert.ok(script.includes('data-video-failed'));
  assert.ok(script.includes('showPosterOnly'));
});

test('object-position is configurable for desktop and mobile without distorting video', () => {
  assert.match(media, /objectPosition:\s*['"]center center['"]/);
  assert.ok(component.includes('data-desktop-object-position'));
  assert.ok(component.includes('--cinematic-video-object-position-mobile'));
  assert.match(styles, /object-fit:\s*cover/);
  assert.match(styles, /object-position:\s*var\(--cinematic-video-object-position/);
});

test('component source does not render an empty video source literal', () => {
  assert.doesNotMatch(component, /src=\{?['"]{2}\}?/);
  assert.doesNotMatch(component, /src=""/);
});
