import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Range, SourceField, Window } from '../core/types';
import { WindowControls } from './WindowControls';

const dateFields: SourceField[] = [
  { apiName: 'closedAt', label: 'Closed At', type: 'date', isPrimaryKey: false },
  { apiName: 'createdAt', label: 'Created At', type: 'date', isPrimaryKey: false },
];

const renderControls = (props: {
  window?: Window;
  range?: Range;
  onWindowChange?: (w: Window | undefined) => void;
  onRangeChange?: (r: Range | undefined) => void;
}) => {
  const onWindowChange = props.onWindowChange ?? vi.fn();
  const onRangeChange = props.onRangeChange ?? vi.fn();
  render(
    <WindowControls
      dateFields={dateFields}
      window={props.window}
      range={props.range}
      onWindowChange={onWindowChange}
      onRangeChange={onRangeChange}
    />
  );
  return { onWindowChange, onRangeChange };
};

describe('WindowControls', () => {
  it('lists date fields for the window', () => {
    renderControls({});
    expect(
      screen.getAllByRole('option', { name: 'Closed At' }).length
    ).toBeGreaterThan(0);
  });

  it('emits a window with a default granularity when a field is picked', async () => {
    const { onWindowChange } = renderControls({});
    await userEvent.selectOptions(
      screen.getByLabelText('Trend over which date?'),
      'closedAt'
    );
    expect(onWindowChange).toHaveBeenCalledWith({
      field: 'closedAt',
      granularity: 'daily',
    });
  });

  it('changes the granularity of an existing window', async () => {
    const { onWindowChange } = renderControls({
      window: { field: 'closedAt', granularity: 'daily' },
    });
    await userEvent.selectOptions(
      screen.getByLabelText('Timeframe'),
      'weekly'
    );
    expect(onWindowChange).toHaveBeenCalledWith({
      field: 'closedAt',
      granularity: 'weekly',
    });
  });

  it('clears the window when the field is unset', async () => {
    const { onWindowChange } = renderControls({
      window: { field: 'closedAt', granularity: 'daily' },
    });
    await userEvent.selectOptions(screen.getByLabelText('Trend over which date?'), '');
    expect(onWindowChange).toHaveBeenCalledWith(undefined);
  });

  it('emits a range and a changed lastDays', async () => {
    const { onRangeChange } = renderControls({});
    await userEvent.selectOptions(
      screen.getByLabelText('Range field'),
      'closedAt'
    );
    expect(onRangeChange).toHaveBeenCalledWith({
      field: 'closedAt',
      lastDays: 30,
    });
  });

  it('changes lastDays and clears the range', async () => {
    const { onRangeChange } = renderControls({
      range: { field: 'closedAt', lastDays: 30 },
    });
    fireEvent.change(screen.getByLabelText('Last days'), {
      target: { value: '7' },
    });
    expect(onRangeChange).toHaveBeenLastCalledWith({
      field: 'closedAt',
      lastDays: 7,
    });

    await userEvent.selectOptions(screen.getByLabelText('Range field'), '');
    expect(onRangeChange).toHaveBeenCalledWith(undefined);
  });
});
