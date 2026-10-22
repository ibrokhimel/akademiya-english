import assert from 'node:assert/strict';
import test from 'node:test';
import { withNavigationParents } from '../src/lib/navigationState.ts';

const names = ['index', 'onboarding', 'account', '(tabs)', 'settings', 'recordings', 'phrases', 'practice/[id]', 'lesson/[id]'];
const route = (name, params) => ({ name, key: name + '-key', ...(params && { params }) });
const stack = (routes, routeNames = names) => ({ stale: false, type: 'stack', key: 'root', index: routes.length - 1, routeNames, routes, preloadedRoutes: [] });
const chain = state => state.routes.map(r => r.name);

test('a cold Recordings link backs through Settings, then the tabs', () => {
  const recording = route('recordings');
  const result = withNavigationParents(stack([recording]));
  assert.deepEqual(chain(result), ['(tabs)', 'settings', 'recordings']);
  assert.equal(result.routes[result.index], recording);
  assert.equal(result.routes[0].state.routes[0].name, 'profile');
});

test('a cold Practice link keeps the phrase ID and supplies its list', () => {
  const practice = route('practice/[id]', { id: 'hello' });
  const result = withNavigationParents(stack([route('(tabs)'), practice]));
  assert.deepEqual(chain(result), ['(tabs)', 'phrases', 'practice/[id]']);
  assert.equal(result.routes[result.index], practice);
  assert.equal(result.routes[0].state.routes[0].name, 'progress');
});

test('normal return paths retain mounted tab and screen state', () => {
  const tabs = { ...route('(tabs)'), state: { index: 2, routes: [{ name: 'index' }, { name: 'progress' }, { name: 'profile' }] } };
  const state = stack([tabs, route('settings'), route('recordings')]);
  assert.equal(withNavigationParents(state), state);
  assert.equal(state.routes[0], tabs);
});

test('entering the first lesson after onboarding supplies a Home beneath it', () => {
  const lesson = route('lesson/[id]', { id: 'l1' });
  assert.deepEqual(chain(withNavigationParents(stack([route('onboarding'), lesson]))), ['(tabs)', 'lesson/[id]']);
});

test('returning to a new Home removes obsolete navigation history', () => {
  const home = { ...route('(tabs)'), key: 'new-home' };
  const result = withNavigationParents(stack([route('(tabs)'), route('account'), home]));
  assert.deepEqual(result.routes, [home]);
  assert.equal(result.index, 0);
});

test('unauthenticated onboarding never receives protected pages', () => {
  const state = stack([route('onboarding')], ['index', 'onboarding', 'account']);
  assert.equal(withNavigationParents(state), state);
});

test('normalizing a restored child stack twice does not duplicate its parents', () => {
  const first = withNavigationParents(stack([route('recordings')]));
  assert.equal(withNavigationParents(first), first);
});
