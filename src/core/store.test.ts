import { describe, expect, it } from 'vitest';
import type { MetricDefinition } from './metricDefinition';
import { createMemoryStore } from './store';

const definition: MetricDefinition = {
  sourceId: 'gym',
  measure: { aggregation: 'sum', field: 'reps' },
  subjectField: 'traineeId',
};

describe('createMemoryStore', () => {
  it('saves a definition and loads it back by id', async () => {
    const store = createMemoryStore();
    const id = await store.save('Reps per trainee', definition);
    expect(await store.load(id)).toEqual({
      name: 'Reps per trainee',
      definition,
    });
  });

  it('lists nothing when empty, then the saved metric after a save', async () => {
    const store = createMemoryStore();
    expect(await store.list()).toEqual([]);
    const id = await store.save('Reps per trainee', definition);
    expect(await store.list()).toEqual([{ id, name: 'Reps per trainee' }]);
  });

  it('removes a saved metric so it no longer loads or lists', async () => {
    const store = createMemoryStore();
    const id = await store.save('Reps per trainee', definition);
    await store.remove(id);
    await expect(store.load(id)).rejects.toThrow(id);
    expect(await store.list()).toEqual([]);
  });

  it('rejects loading an unknown id', async () => {
    const store = createMemoryStore();
    await expect(store.load('nope')).rejects.toThrow('nope');
  });

  it('gives each save a distinct id that stays stable across list and load', async () => {
    const store = createMemoryStore();
    const first = await store.save('First', definition);
    const second = await store.save('Second', definition);
    expect(first).not.toBe(second);
    expect(await store.list()).toEqual([
      { id: first, name: 'First' },
      { id: second, name: 'Second' },
    ]);
    expect((await store.load(first)).name).toBe('First');
    expect((await store.load(second)).name).toBe('Second');
  });

  it('uses an injected idFactory when provided', async () => {
    const ids = ['a', 'b'];
    const store = createMemoryStore({ idFactory: () => ids.shift() ?? 'z' });
    expect(await store.save('First', definition)).toBe('a');
    expect(await store.save('Second', definition)).toBe('b');
  });
});
