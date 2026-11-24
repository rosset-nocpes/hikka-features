import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const source = stripTypeScriptTypes(
  readFileSync(
    new URL(
      '../entrypoints/content/features/player/queue/queue-order.ts',
      import.meta.url,
    ),
    'utf8',
  ),
).replaceAll(/^export /gm, '');
const { insertedInOrder, restoredOrder, roomInsertion } = runInNewContext(
  `${source}\n({ insertedInOrder, restoredOrder, roomInsertion });`,
);

const item = (name) => ({
  slug: name[0],
  episode: Number(name.slice(1)),
  provider: 'p',
  team: 't',
});
const items = (names) => names.split(' ').filter(Boolean).map(item);
const names = (list) =>
  list.map(({ slug, episode }) => `${slug}${episode}`).join(' ');

/** The room's queue after appending `fresh`, up to `max`, then the moves. */
const applyRoom = (queue, { fresh, moves }, max) => {
  const result = [...queue, ...fresh].slice(0, max);
  for (const { item: moved, index } of moves) {
    const from = result.findIndex(
      (queued) =>
        queued.slug === moved.slug && queued.episode === moved.episode,
    );
    if (from === -1) continue;
    result.splice(from, 1);
    result.splice(Math.min(index, result.length), 0, moved);
  }
  return result;
};

test('inserting episodes keeps each anime in order', () => {
  assert.equal(names(insertedInOrder(items('a5 b1'), items('a3'))), 'a3 a5 b1');
  assert.equal(names(insertedInOrder(items('a6'), items('a3'))), 'a3 a6');
  assert.equal(names(insertedInOrder(items('b1'), items('a2'))), 'b1 a2');
});

test('a range around queued episodes fills in around them', () => {
  assert.equal(
    names(insertedInOrder(items('a3 b1'), items('a1 a2 a3 a4'))),
    'a1 a2 a3 b1 a4',
  );
});

test('ticking in reverse order still plays in order', () => {
  let queue = [];
  for (const name of ['a5', 'a4', 'a3']) {
    queue = insertedInOrder(queue, [item(name)]);
  }
  assert.equal(names(queue), 'a3 a4 a5');
});

test('duplicates are added once and queued episodes stay put', () => {
  const queue = items('b1 a2');
  const result = insertedInOrder(queue, items('a2 a1 a1'));
  assert.equal(names(result), 'b1 a1 a2');
  assert.equal(result[2], queue[1]);
});

test('restoring puts removed episodes back where they were', () => {
  const before = items('a1 b1 a2 c1');
  const removed = items('a1 a2');
  assert.equal(
    names(restoredOrder(before, items('b1 c1'), removed)),
    'a1 b1 a2 c1',
  );
  // An episode added meanwhile keeps its place.
  assert.equal(
    names(restoredOrder(before, items('b1 c1 d1'), removed)),
    'a1 b1 a2 c1 d1',
  );
});

test('a room is only sent moves for episodes not landing at the end', () => {
  const plan = roomInsertion(items('a1 b1'), items('a2 a3 a4'), 100);
  assert.equal(names(plan.fresh), 'a2 a3 a4');
  assert.equal(plan.moves.length, 0);
});

test('a room ends up in the same order as the own queue', () => {
  const cases = [
    ['a5 b1', 'a3'],
    ['a3 b1', 'a1 a2 a3 a4'],
    ['a6 b1 a9', 'a2 a7 a10 c1'],
    ['', 'a3 a1 a2'],
    ['b1 b2', 'b0 b3 a1'],
  ];
  for (const [queued, added] of cases) {
    const queue = items(queued);
    const plan = roomInsertion(queue, items(added), 100);
    assert.equal(
      names(applyRoom(queue, plan, 100)),
      names(insertedInOrder(queue, items(added))),
      `${queued} + ${added}`,
    );
  }
});

test('a full room only takes what fits', () => {
  const queue = items('a1 a5');
  const plan = roomInsertion(queue, items('a2 a3 a4'), 4);
  assert.equal(names(plan.fresh), 'a2 a3');
  assert.equal(names(applyRoom(queue, plan, 4)), 'a1 a2 a3 a5');
});
