import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createMockProvider, type MockSourceSeed } from '../core/mockProvider';
import type { MetricDataProvider } from '../core/provider';
import type { MetricDefinition } from '../core/metricDefinition';
import { MetricBuilderProvider } from './MetricBuilderProvider';
import { MetricStage } from './MetricStage';

const seed: MockSourceSeed = {
  source: { id: 'gym', name: 'Gym Sessions', enabled: true },
  describe: {
    type: 'session',
    fields: [
      { apiName: 'traineeId', label: 'Trainee', type: 'text', isPrimaryKey: false },
      { apiName: 'reps', label: 'Reps', type: 'number', isPrimaryKey: false },
    ],
  },
  rows: [{ traineeId: 'ana', reps: 10 }],
};

const renderStage = (
  provider: MetricDataProvider,
  definition: MetricDefinition,
  onChange = vi.fn()
) =>
  render(
    <MetricBuilderProvider dataProvider={provider}>
      <MetricStage definition={definition} onChange={onChange} />
    </MetricBuilderProvider>
  );

describe('MetricStage', () => {
  it('shows an error when sources fail to load', async () => {
    const failing: MetricDataProvider = {
      listSources: () => Promise.reject(new Error('down')),
      describeSource: () => Promise.resolve(seed.describe),
      queryData: () => Promise.resolve([]),
    };
    renderStage(failing, {});
    expect(await screen.findByRole('alert')).toHaveTextContent(/load sources/i);
  });

  it('lists sources and hints to pick one', async () => {
    renderStage(createMockProvider([seed]), {});
    expect(
      await screen.findByRole('option', { name: 'Gym Sessions' })
    ).toBeInTheDocument();
    expect(screen.getByText(/pick a source/i)).toBeInTheDocument();
  });

  it('emits a source selection', async () => {
    const onChange = vi.fn();
    renderStage(createMockProvider([seed]), {}, onChange);
    await screen.findByRole('option', { name: 'Gym Sessions' });
    await userEvent.selectOptions(
      screen.getByLabelText('Source'),
      'gym'
    );
    expect(onChange).toHaveBeenCalledWith({ sourceId: 'gym' });
  });

  it('shows a loading state while fields load', () => {
    const pending: MetricDataProvider = {
      listSources: () => Promise.resolve([seed.source]),
      describeSource: () => new Promise(() => {}),
      queryData: () => Promise.resolve([]),
    };
    renderStage(pending, { sourceId: 'gym' });
    expect(screen.getByText(/loading fields/i)).toBeInTheDocument();
  });

  it('shows an error when fields fail to load', async () => {
    const failing: MetricDataProvider = {
      listSources: () => Promise.resolve([seed.source]),
      describeSource: () => Promise.reject(new Error('nope')),
      queryData: () => Promise.resolve([]),
    };
    renderStage(failing, { sourceId: 'gym' });
    expect(await screen.findByRole('alert')).toHaveTextContent(/load fields/i);
  });

  it('lets you build a measure and pick a subject', async () => {
    const onChange = vi.fn();
    renderStage(
      createMockProvider([seed]),
      { sourceId: 'gym', measure: { aggregation: 'sum' } },
      onChange
    );
    await screen.findByLabelText('Field');

    await userEvent.selectOptions(screen.getByLabelText('Aggregation'), 'avg');
    await userEvent.selectOptions(screen.getByLabelText('Field'), 'reps');
    await userEvent.selectOptions(screen.getByLabelText('Subject'), 'traineeId');

    expect(onChange).toHaveBeenCalledWith({
      sourceId: 'gym',
      measure: { aggregation: 'avg' },
    });
    expect(onChange).toHaveBeenCalledWith({
      sourceId: 'gym',
      measure: { aggregation: 'sum', field: 'reps' },
    });
    expect(onChange).toHaveBeenCalledWith({
      sourceId: 'gym',
      measure: { aggregation: 'sum' },
      subjectField: 'traineeId',
    });
  });

  it('hides the field picker for a count measure', async () => {
    renderStage(createMockProvider([seed]), {
      sourceId: 'gym',
      measure: { aggregation: 'count' },
    });
    await screen.findByLabelText('Subject');
    expect(screen.queryByLabelText('Field')).not.toBeInTheDocument();
  });

  it('offers and selects a Count Distinct aggregation', async () => {
    const onChange = vi.fn();
    renderStage(
      createMockProvider([seed]),
      { sourceId: 'gym', measure: { aggregation: 'sum' } },
      onChange
    );
    expect(
      await screen.findByRole('option', { name: 'Count Distinct' })
    ).toBeInTheDocument();

    await userEvent.selectOptions(
      screen.getByLabelText('Aggregation'),
      'countDistinct'
    );
    expect(onChange).toHaveBeenCalledWith({
      sourceId: 'gym',
      measure: { aggregation: 'countDistinct' },
    });
  });

  it('adds a filter with the first field and a default operator', async () => {
    const onChange = vi.fn();
    renderStage(
      createMockProvider([seed]),
      { sourceId: 'gym', measure: { aggregation: 'count' } },
      onChange
    );
    await screen.findByLabelText('Subject');
    await userEvent.click(screen.getByRole('button', { name: /add filter/i }));
    expect(onChange).toHaveBeenCalledWith({
      sourceId: 'gym',
      measure: { aggregation: 'count' },
      filters: [{ field: 'traineeId', operator: 'equals', value: '' }],
    });
  });

  it('renders a row per existing filter with type-valid operators', async () => {
    renderStage(createMockProvider([seed]), {
      sourceId: 'gym',
      measure: { aggregation: 'count' },
      filters: [{ field: 'reps', operator: 'gte', value: 30 }],
    });
    const operator = await screen.findByLabelText('Operator');
    expect(operator).toHaveTextContent('Greater than or equal');
    expect(operator).not.toHaveTextContent('Contains');
  });

  it('changes and removes an existing filter', async () => {
    const onChange = vi.fn();
    renderStage(
      createMockProvider([seed]),
      {
        sourceId: 'gym',
        measure: { aggregation: 'count' },
        filters: [{ field: 'reps', operator: 'gte', value: 30 }],
      },
      onChange
    );
    await userEvent.selectOptions(await screen.findByLabelText('Operator'), 'lt');
    expect(onChange).toHaveBeenCalledWith({
      sourceId: 'gym',
      measure: { aggregation: 'count' },
      filters: [{ field: 'reps', operator: 'lt', value: 30 }],
    });

    await userEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(onChange).toHaveBeenCalledWith({
      sourceId: 'gym',
      measure: { aggregation: 'count' },
      filters: [],
    });
  });

  it('renders empty selections when no measure is set yet', async () => {
    renderStage(createMockProvider([seed]), { sourceId: 'gym' });
    expect(await screen.findByLabelText('Aggregation')).toHaveValue('');
    expect(screen.getByLabelText('Field')).toHaveValue('');
    expect(screen.getByLabelText('Subject')).toHaveValue('');
  });
});
