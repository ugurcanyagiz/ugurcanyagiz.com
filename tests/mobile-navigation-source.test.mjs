import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/components/ScrollCinemaHome.astro', import.meta.url), 'utf8');

test('mobile navigation defines deterministic buffered swipe state', () => {
  for (const token of [
    "let currentScene = 0",
    "let targetScene = 0",
    "let gestureDirection = 0",
    "let transitionState = 'idle'",
    "let pendingDirection = 0",
    "let dragProgress = 0",
    "let velocity = 0",
  ]) {
    assert.ok(source.includes(token), `${token} should be present`);
  }
});

test('touch swipes during settling are queued rather than dropped', () => {
  assert.match(source, /function requestSceneNavigation\(direction, \{ allowQueue = false \} = \{\}\)/);
  assert.match(source, /if \(isTransitioning\(\)\) \{[\s\S]*pendingDirection = normalizedDirection;[\s\S]*transitionState = 'queued';[\s\S]*root\.dataset\.pendingDirection = String\(pendingDirection\);[\s\S]*return true;/);
  assert.match(source, /requestSceneNavigation\(deltaY < 0 \? 1 : -1, \{ allowQueue: true \}\)/);
});

test('only one queued swipe intent is retained and consumed on completion', () => {
  const pendingAssignments = source.match(/(?<!\.)pendingDirection = /g) ?? [];
  assert.equal(pendingAssignments.length, 3, 'pending direction should only be initialized, overwritten, and cleared');
  assert.match(source, /const queuedDirection = pendingDirection;[\s\S]*pendingDirection = 0;/);
  assert.match(source, /startSceneTransition\(currentScene \+ queuedDirection, queuedDirection\)/);
});

test('scene index is committed only when the active transition finishes', () => {
  const goToSceneBody = source.match(/function goToScene\(index\) \{[\s\S]*?\n    \}/)?.[0] ?? '';
  assert.ok(!goToSceneBody.includes('currentScene ='), 'goToScene must not commit currentScene before completion');
  assert.match(source, /function finishTransition\(\) \{[\s\S]*currentScene = targetScene;/);
});

test('fast flicks and accidental touches are distinguished', () => {
  assert.ok(source.includes('const SWIPE_DISTANCE_THRESHOLD = 52'));
  assert.ok(source.includes('const SWIPE_VELOCITY_THRESHOLD = 0.42'));
  assert.match(source, /const hasDistance = Math\.abs\(deltaY\) >= SWIPE_DISTANCE_THRESHOLD;/);
  assert.match(source, /const hasVelocity = Math\.abs\(velocity\) >= SWIPE_VELOCITY_THRESHOLD && Math\.abs\(deltaY\) >= TOUCH_INTENT_THRESHOLD;/);
});

test('touchcancel and resize reset transient input safely', () => {
  assert.match(source, /function onTouchCancel\(\) \{[\s\S]*touchTracking = false;[\s\S]*dragProgress = 0;[\s\S]*velocity = 0;[\s\S]*\}/);
  assert.match(source, /function onResize\(\) \{[\s\S]*if \(isTransitioning\(\)\) transitionTargetTop = sceneScrollTop\(targetScene\);[\s\S]*measure\(\);[\s\S]*\}/);
});

test('desktop wheel behavior remains guarded by existing one-gesture lock', () => {
  assert.match(source, /function onWheel\(event\) \{[\s\S]*if \(wheelGestureTriggered \|\| isTransitioning\(\)\) return;[\s\S]*goToScene\(currentScene \+ Math\.sign\(wheelDelta\)\);[\s\S]*\}/);
});

test('mobile menu links and route hrefs remain rendered from existing nav buttons', () => {
  assert.ok(source.includes('<SectionNavButton'));
  assert.ok(source.includes('href={item.href}'));
  assert.ok(source.includes('className={`section-nav-button--${item.sectionId}`}'));
});

test('event listeners still have matching cleanup hooks for repeated route visits', () => {
  for (const eventName of ['wheel', 'touchstart', 'touchmove', 'touchend', 'touchcancel']) {
    assert.ok(source.includes(`root.addEventListener('${eventName}'`), `${eventName} listener should be added`);
    assert.ok(source.includes(`root.removeEventListener('${eventName}'`), `${eventName} listener should be removed`);
  }
  assert.ok(source.includes("document.addEventListener('astro:before-swap', cleanup)"));
  assert.ok(source.includes("document.removeEventListener('astro:before-swap', cleanup)"));
});

test('reduced-motion mode still bypasses scripted scene gestures', () => {
  assert.match(source, /function requestSceneNavigation\(direction, \{ allowQueue = false \} = \{\}\) \{[\s\S]*if \(reduceQuery\.matches \|\| !direction\) return false;/);
  assert.match(source, /function onTouchStart\(event\) \{[\s\S]*if \(reduceQuery\.matches \|\| event\.touches\.length !== 1\)/);
  assert.ok(source.includes('@media (prefers-reduced-motion: reduce)'));
});
