import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { create } from 'zustand';

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

function pageStore() {
  const source = stripTypeScriptTypes(read('hooks/use-page-store.ts'))
    .replace(/import .* from 'zustand';/, '')
    .replace('export const usePageStore', 'const usePageStore');
  return runInNewContext(`${source}\nusePageStore;`, { create });
}

test('unchanged routes do not notify subscribers or replace the path', () => {
  const store = pageStore();
  store.getState().updateFromUrl(new URL('https://hikka.io/anime/example'));
  const previous = store.getState();
  let notifications = 0;
  store.subscribe(() => notifications++);
  for (let i = 0; i < 1000; i++) {
    store
      .getState()
      .updateFromUrl(new URL('https://hikka.io/anime/example?tab=1#top'));
  }
  assert.equal(notifications, 0);
  assert.equal(store.getState(), previous);
  store
    .getState()
    .updateFromUrl(new URL('https://hikka.io/anime/example/watch'));
  assert.equal(notifications, 1);
  assert.deepEqual([...store.getState().path], ['anime', 'example', 'watch']);
  store.getState().updateFromUrl(new URL('https://hikka.io/manga/other'));
  assert.equal(store.getState().contentType, 'manga');
  assert.equal(store.getState().slug, 'other');
  store.getState().updateFromUrl(new URL('https://hikka.io/'));
  assert.equal(store.getState().slug, undefined);
});

function managerHarness(hydrated = Promise.resolve()) {
  let mutate;
  let scans = 0;
  let mounts = 0;
  let attached = true;
  const frames = new Map();
  const settings = create(() => ({ features: { test: { enabled: true } } }));
  const feature = {
    id: 'test-feature',
    shouldMount: true,
    isMounted: true,
    init() {},
    mount() {
      mounts++;
      this.isMounted = true;
      attached = true;
    },
    unmount() {
      this.isMounted = false;
    },
  };
  // Substitute Vite's build-time glob; exercise the real manager methods.
  const source = stripTypeScriptTypes(
    read('entrypoints/content/core/feature-manager.ts'),
  )
    .replace(/import .* from '.\/base-feature';/, '')
    .replace('void preloadContentCss();', '')
    .replace(/import .* from '@\/utils\/hikka-router';/, '')
    .replace('export class FeatureManager', 'class FeatureManager')
    .replace(/import\.meta\.glob\s*\([\s\S]*?\);/, '({});');
  const manager = runInNewContext(`${source}\nnew FeatureManager();`, {
    usePageStore: pageStore(),
    useSettings: settings,
    whenHydrated: () => hydrated,
    URL,
    location: { href: 'https://hikka.io/anime/test' },
    document: {
      body: {
        querySelector() {
          scans++;
          return attached ? {} : null;
        },
      },
    },
    MutationObserver: class {
      constructor(callback) {
        mutate = callback;
      }
      observe() {}
      disconnect() {}
    },
    requestAnimationFrame(callback) {
      frames.set(1, callback);
      return 1;
    },
    cancelAnimationFrame(id) {
      frames.delete(id);
    },
  });
  manager.features = [feature];
  const started = manager.init();
  return {
    started,
    manager,
    feature,
    settings,
    frames,
    mutate: () => mutate(),
    detach: () => {
      attached = false;
    },
    scans: () => scans,
    mounts: () => mounts,
    flush() {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((cb) => cb());
    },
  };
}

test('nothing goes on the page until the site has hydrated', async () => {
  let hydrate;
  const h = managerHarness(new Promise((resolve) => (hydrate = resolve)));
  await Promise.resolve();
  assert.equal(h.scans(), 0);
  assert.equal(h.mounts(), 0);
  hydrate();
  await h.started;
  assert.equal(h.scans(), 1);
});

test('stopping before hydration keeps the features off', async () => {
  let hydrate;
  const h = managerHarness(new Promise((resolve) => (hydrate = resolve)));
  h.manager.stop();
  hydrate();
  await h.started;
  assert.equal(h.scans(), 0);
});

test('mutation bursts share one scan and detached features remount in that scan', async () => {
  const h = managerHarness();
  await h.started;
  assert.equal(h.scans(), 1);
  h.detach();
  for (let i = 0; i < 1000; i++) h.mutate();
  assert.equal(h.frames.size, 1);
  assert.equal(h.scans(), 1);
  h.flush();
  assert.equal(h.scans(), 2);
  assert.equal(h.mounts(), 1);
  assert.equal(h.feature.isMounted, true);
});

test('stopping cancels pending work and leaving a supported route unmounts', async () => {
  const h = managerHarness();
  await h.started;
  h.feature.shouldMount = false;
  await h.manager.reconcile();
  assert.equal(h.feature.isMounted, false);
  h.mutate();
  h.manager.stop();
  assert.equal(h.frames.size, 0);
  h.flush();
  assert.equal(h.mounts(), 0);
});

test('feature settings changes reconcile in the next frame until stopped', async () => {
  const h = managerHarness();
  await h.started;
  // The frame the features' init schedules.
  h.flush();
  h.settings.setState({ unrelated: true });
  assert.equal(h.frames.size, 0);
  h.feature.shouldMount = false;
  h.settings.setState({ features: { test: { enabled: false } } });
  assert.equal(h.frames.size, 1);
  h.flush();
  assert.equal(h.feature.isMounted, false);
  h.manager.stop();
  h.settings.setState({ features: { test: { enabled: true } } });
  assert.equal(h.frames.size, 0);
});

function resetHarness(features) {
  const source = stripTypeScriptTypes(
    read('entrypoints/popup/_base/reset-settings.ts'),
  ).replaceAll('export const', 'const');
  const store = create(() => ({ teamPrioritySyncedAt: 5, features }));
  const defaults = store.getInitialState();
  store.getInitialState = () => ({
    ...defaults,
    features: {
      player: {
        enabled: true,
        autoplayNext: true,
        favoriteTeams: {},
        teamPriority: [],
        teamPriorityTranslation: 'dub',
      },
      reader: { enabled: true },
      friendsActivity: {
        hidden: false,
        side: 'left',
        after: 'tracker',
        before: 'list',
      },
      devOptions: { enabled: false, devTools: false },
    },
  });
  const reset = runInNewContext(
    `${source}\n({ resetPreferences, resetSettings });`,
    { useSettings: store },
  );
  return { store, ...reset };
}

const customized = () => ({
  player: {
    enabled: false,
    autoplayNext: false,
    favoriteTeams: { naruto: { team: 'A' } },
    teamPriority: [{ id: 't1', title: 'T1' }],
    teamPriorityTranslation: 'sub',
  },
  reader: { enabled: false },
  friendsActivity: {
    hidden: true,
    side: 'right',
    after: null,
    before: 'list',
  },
  devOptions: { enabled: true, devTools: true },
});

test('resetting preferences keeps teams, placement and developer options', () => {
  const { store, resetPreferences } = resetHarness(customized());
  resetPreferences();
  // Plain objects: the store's came from another realm.
  const { features, teamPrioritySyncedAt } = JSON.parse(
    JSON.stringify(store.getState()),
  );
  assert.equal(teamPrioritySyncedAt, 5);
  assert.deepEqual(features.reader, { enabled: true });
  assert.equal(features.player.enabled, true);
  assert.equal(features.player.autoplayNext, true);
  assert.deepEqual(features.player.favoriteTeams, { naruto: { team: 'A' } });
  assert.deepEqual(features.player.teamPriority, [{ id: 't1', title: 'T1' }]);
  assert.equal(features.player.teamPriorityTranslation, 'sub');
  assert.deepEqual(features.friendsActivity, {
    hidden: false,
    side: 'right',
    after: null,
    before: 'list',
  });
  assert.deepEqual(features.devOptions, { enabled: true, devTools: true });
});

test('resetting everything keeps only developer options', () => {
  const { store, resetSettings } = resetHarness(customized());
  resetSettings();
  // Plain objects: the store's came from another realm.
  const { features, teamPrioritySyncedAt } = JSON.parse(
    JSON.stringify(store.getState()),
  );
  assert.equal(teamPrioritySyncedAt, 0);
  assert.deepEqual(features.player.favoriteTeams, {});
  assert.deepEqual(features.player.teamPriority, []);
  assert.equal(features.friendsActivity.side, 'left');
  assert.deepEqual(features.devOptions, { enabled: true, devTools: true });
});
