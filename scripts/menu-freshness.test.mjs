import test from 'node:test';
import assert from 'node:assert/strict';
import { menuFreshness } from './menu-freshness.mjs';
const today = '2026-11-23';
const feed = { days: [{ date: today, items: [
  { source: 'hungry-elk', diet: 'vegetarian' }, { source: 'mph', diet: 'meat' },
] }] };
test('requires today and both generated restaurant sources', () => {
  assert.equal(menuFreshness(feed, today).fresh, true);
  assert.equal(menuFreshness(feed, '2026-11-24').fresh, false);
  assert.equal(menuFreshness({ days: [{ date: today, items: [{ source: 'yellow-donkey', diet: 'vegan' }] }] }, today).fresh, false);
});
test('unknown labels cannot count as fresh', () => {
  const bad = structuredClone(feed); bad.days[0].items[0].diet = 'unknown';
  assert.equal(menuFreshness(bad, today).fresh, false);
});
