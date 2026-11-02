import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { operatorsForFieldType } from '../core/operators';
import type { Filter, SourceField } from '../core/types';
import { FilterRow } from './FilterRow';

const fields: SourceField[] = [
  { apiName: 'reps', label: 'Reps', type: 'number', isPrimaryKey: false },
  { apiName: 'traineeId', label: 'Trainee', type: 'text', isPrimaryKey: false },
  { apiName: 'completed', label: 'Completed', type: 'bool', isPrimaryKey: false },
  { apiName: 'closedAt', label: 'Closed At', type: 'date', isPrimaryKey: false },
];

const operatorsFor = (field: string) =>
  operatorsForFieldType(
    fields.find((f) => f.apiName === field)?.type ?? 'unknown'
  );

const renderRow = (filter: Filter, onChange = vi.fn(), onRemove = vi.fn()) => {
  render(
    <FilterRow
      filter={filter}
      fields={fields}
      operatorsFor={operatorsFor}
      onChange={onChange}
      onRemove={onRemove}
    />
  );
  return { onChange, onRemove };
};

describe('FilterRow', () => {
  it('offers only operators valid for the selected field type', () => {
    renderRow({ field: 'reps', operator: 'gte', value: 30 });
    const operators = screen.getByLabelText('Operator');
    expect(operators).toHaveTextContent('Greater than or equal');
    expect(operators).not.toHaveTextContent('Contains');
  });

  it('emits a changed operator', async () => {
    const { onChange } = renderRow({ field: 'reps', operator: 'gte', value: 30 });
    await userEvent.selectOptions(screen.getByLabelText('Operator'), 'lt');
    expect(onChange).toHaveBeenCalledWith({
      field: 'reps',
      operator: 'lt',
      value: 30,
    });
  });

  it('emits a changed value', async () => {
    const { onChange } = renderRow({ field: 'reps', operator: 'gte' });
    await userEvent.type(screen.getByLabelText('Value'), '5');
    expect(onChange).toHaveBeenLastCalledWith({
      field: 'reps',
      operator: 'gte',
      value: '5',
    });
  });

  it('hides the value input for operators that need no value', () => {
    renderRow({ field: 'completed', operator: 'isTrue' });
    expect(screen.queryByLabelText('Value')).not.toBeInTheDocument();
  });

  it('renders a date input for a date field', () => {
    renderRow({ field: 'closedAt', operator: 'gte', value: '2024-01-01' });
    expect(screen.getByLabelText('Value')).toHaveAttribute('type', 'date');
  });

  it('renders a text input for a text field', () => {
    renderRow({ field: 'traineeId', operator: 'contains', value: 'an' });
    expect(screen.getByLabelText('Value')).toHaveAttribute('type', 'text');
  });

  it('resets the operator to a valid one when the field changes', async () => {
    const { onChange } = renderRow({ field: 'reps', operator: 'gte', value: 30 });
    await userEvent.selectOptions(
      screen.getByLabelText('Filter field'),
      'traineeId'
    );
    expect(onChange).toHaveBeenCalledWith({
      field: 'traineeId',
      operator: 'equals',
      value: 30,
    });
  });

  it('removes the row', async () => {
    const { onRemove } = renderRow({ field: 'reps', operator: 'gte', value: 30 });
    await userEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(onRemove).toHaveBeenCalled();
  });
});
