import test from 'node:test';
import assert from 'node:assert/strict';
import { createSaveGuard } from '../dist/save-guard.js';

test('a stale tab cannot replace newer progress, even on page exit', () => {
  let raw = 'old', writes = 0;
  const guard = createSaveGuard({ read: () => raw, write: value => { raw = value; writes++; }, initialRaw: raw, initialState: raw });
  raw = 'newer';
  assert.deepEqual(guard.save('old'), { ok: false, conflict: true });
  assert.deepEqual(guard.save('local draft'), { ok: false, conflict: true });
  assert.equal(raw, 'newer'); assert.equal(writes, 0);
  guard.replace('explicit imported adventure');
  assert.equal(guard.conflicted, false); assert.equal(raw, 'explicit imported adventure');
});

test('clean tabs accept external changes while dirty tabs preserve their unsaved work', () => {
  let raw = 'old';
  const make = () => createSaveGuard({ read: () => raw, write: value => { raw = value; }, initialRaw: raw, initialState: 'normalized old' });
  const clean = make(), dirty = make(); raw = 'newer';
  assert.deepEqual(clean.observe('normalized old'), { changed: true, raw: 'newer' });
  assert.deepEqual(dirty.observe('unsaved Python'), { changed: true, conflict: true });
  clean.accept(raw, 'normalized newer');
  assert.deepEqual(clean.save('normalized newer'), { ok: true, unchanged: true });
  assert.equal(raw, 'newer');
  raw = null;
  assert.deepEqual(clean.observe('normalized newer'), { changed: true, raw: null });
});

test('failed writes do not advance the guard and a fresh adventure can be saved', () => {
  let raw = null, fail = true;
  const guard = createSaveGuard({ read: () => raw, write: text => { if (fail) throw Error('quota'); raw = text; }, initialState: 'fresh' });
  assert.throws(() => guard.save('fresh'), /quota/);
  fail = false; assert.equal(guard.save('fresh').ok, true); assert.equal(raw, 'fresh');
  assert.equal(guard.save('earned progress').ok, true); assert.equal(raw, 'earned progress');
});
