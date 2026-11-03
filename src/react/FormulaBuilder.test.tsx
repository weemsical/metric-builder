import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Formula } from '../core/metricDefinition';
import { FormulaBuilder } from './FormulaBuilder';

const renderComponent = (_c: unknown, _onChange: unknown, index: number) => (
  <div data-testid={`comp-${index}`}>component {index}</div>
);

const renderBuilder = (formula: Formula, onChange = vi.fn()) => {
  render(
    <FormulaBuilder
      formula={formula}
      onChange={onChange}
      renderComponent={renderComponent}
    />
  );
  return { onChange };
};

describe('FormulaBuilder', () => {
  it('shows the operation and renders a slot per component', () => {
    renderBuilder({ op: 'divide', components: [{}, {}] });
    expect(screen.getByLabelText('Operation')).toHaveValue('divide');
    expect(screen.getByTestId('comp-0')).toBeInTheDocument();
    expect(screen.getByTestId('comp-1')).toBeInTheDocument();
  });

  it('changes the operation', async () => {
    const { onChange } = renderBuilder({ op: 'divide', components: [{}, {}] });
    await userEvent.selectOptions(screen.getByLabelText('Operation'), 'add');
    expect(onChange).toHaveBeenCalledWith({ op: 'add', components: [{}, {}] });
  });

  it('adds a component', async () => {
    const { onChange } = renderBuilder({ op: 'divide', components: [{}, {}] });
    await userEvent.click(
      screen.getByRole('button', { name: /add component/i })
    );
    expect(onChange).toHaveBeenCalledWith({
      op: 'divide',
      components: [{}, {}, {}],
    });
  });

  it('updates a component through its onChange', async () => {
    const onChange = vi.fn();
    render(
      <FormulaBuilder
        formula={{ op: 'divide', components: [{}, {}] }}
        onChange={onChange}
        renderComponent={(_c, oc, index) => (
          <button type="button" onClick={() => oc({ sourceId: `s${index}` })}>
            edit {index}
          </button>
        )}
      />
    );
    await userEvent.click(screen.getByText('edit 0'));
    expect(onChange).toHaveBeenCalledWith({
      op: 'divide',
      components: [{ sourceId: 's0' }, {}],
    });
  });

  it('removes a component', async () => {
    const { onChange } = renderBuilder({
      op: 'divide',
      components: [{ sourceId: 'a' }, { sourceId: 'b' }],
    });
    await userEvent.click(screen.getAllByRole('button', { name: /remove/i })[0]);
    expect(onChange).toHaveBeenCalledWith({
      op: 'divide',
      components: [{ sourceId: 'b' }],
    });
  });
});
