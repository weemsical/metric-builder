import type { MetricDefinition } from './metricDefinition';

export type SavedMetric = {
  id: string;
  name: string;
  definition: MetricDefinition;
};

export type MetricStore = {
  save: (name: string, definition: MetricDefinition) => Promise<string>;
  load: (
    id: string
  ) => Promise<{ name: string; definition: MetricDefinition }>;
  list: () => Promise<Array<{ id: string; name: string }>>;
  remove: (id: string) => Promise<void>;
};

export type MemoryStoreOptions = {
  idFactory?: () => string;
};

export const createMemoryStore = (
  options: MemoryStoreOptions = {}
): MetricStore => {
  const saved = new Map<string, SavedMetric>();
  let counter = 0;
  const nextId = options.idFactory ?? (() => `m${(counter += 1)}`);

  return {
    save: async (name, definition) => {
      const id = nextId();
      saved.set(id, { id, name, definition });
      return id;
    },

    load: async (id) => {
      const metric = saved.get(id);
      if (!metric) {
        throw new Error(`Unknown saved metric: ${id}`);
      }
      return { name: metric.name, definition: metric.definition };
    },

    list: async () =>
      Array.from(saved.values(), ({ id, name }) => ({ id, name })),

    remove: async (id) => {
      saved.delete(id);
    },
  };
};
