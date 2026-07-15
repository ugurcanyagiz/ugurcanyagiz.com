import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const component = readFileSync(new URL('../src/components/CinematicHomepage.astro', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/styles/cinematic-home.css', import.meta.url), 'utf8');
const indexPage = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../src/layouts/Layout.astro', import.meta.url), 'utf8');

test('cosmic library renders the five destination routes as a focused menu', () => {
  assert.match(component, /cinematic-home\.css\?inline/);
  assert.match(component, /<style is:global set:html=\{cinematicHomeStyles\}>/);
  for (const href of ['/blog', '/science', '/history', '/art', '/future']) {
    assert.ok(component.includes(`href: "${href}"`), `${href} should be configured`);
  }
  assert.doesNotMatch(component, /href: "\/me"/);
  assert.match(component, /label: "JLOG"/);
  assert.match(component, /data-menu-item/);
  assert.match(component, /aria-current/);
  assert.match(component, /setAttribute\("aria-current", "page"\)/);
  assert.match(component, /removeAttribute\("aria-current"\)/);
});

test('scroll progress drives menu selection and scene depth', () => {
  assert.match(component, /syncFromScroll/);
  assert.match(component, /--scroll-progress/);
  assert.match(component, /window\.scrollTo/);
  assert.match(component, /active \/ \(items\.length - 1\)/);
  assert.match(styles, /var\(--scroll-progress\)/);
  assert.match(styles, /cosmic-library__backdrop/);
  assert.match(styles, /cosmic-library__papers/);
  assert.match(styles, /library-wind/);
  assert.match(styles, /paper-drift/);
});

test('menu supports keyboard, touch, and click interaction', () => {
  assert.match(component, /ArrowDown/);
  assert.match(component, /ArrowUp/);
  assert.match(component, /touchstart/);
  assert.match(component, /touchend/);
  assert.match(component, /item\.addEventListener\("click"/);
});

test('homepage chrome is hidden while inner-page chrome remains available', () => {
  assert.match(indexPage, /hideChrome/);
  assert.match(layout, /!hideChrome && <header class="topbar">/);
  assert.match(layout, /!hideChrome && <footer class="site-footer">/);
});

test('animation has responsive and reduced-motion treatments', () => {
  assert.match(styles, /@media \(max-width: 700px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /transition: none/);
});
