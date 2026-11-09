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

function managerHarness() {
  let mutate;
  let scans = 0;
  let mounts = 0;
  let attached = true;
  const frames = new Map();
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
    .replace('export class FeatureManager', 'class FeatureManager')
    .replace(/import\.meta\.glob\s*\([\s\S]*?\);/, '({});');
  const manager = runInNewContext(`${source}\nnew FeatureManager();`, {
    usePageStore: pageStore(),
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
  manager.init();
  return {
    manager,
    feature,
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

test('mutation bursts share one scan and detached features remount in that scan', () => {
  const h = managerHarness();
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
  h.feature.shouldMount = false;
  await h.manager.reconcile();
  assert.equal(h.feature.isMounted, false);
  h.mutate();
  h.manager.stop();
  assert.equal(h.frames.size, 0);
  h.flush();
  assert.equal(h.mounts(), 0);
});
