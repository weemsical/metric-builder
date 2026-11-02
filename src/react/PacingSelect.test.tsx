import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Pacing } from '../core/types';
import { PacingSelect } from './PacingSelect';

const renderSelect = (pacing?: Pacing, onPacingChange = vi.fn()) => {
  render(<PacingSelect pacing={pacing} onPacingChange={onPacingChange} />);
  return { onPacingChange };
};

describe('PacingSelect', () => {
  it('emits a pacing strategy when selected', async () => {
    const { onPacingChange } = renderSelect();
    await userEvent.selectOptions(screen.getByLabelText('Pacing'), 'rampUp');
    expect(onPacingChange).toHaveBeenCalledWith({ strategy: 'rampUp' });
  });

  it('clears pacing when set to none', async () => {
    const { onPacingChange } = renderSelect({ strategy: 'steady' });
    await userEvent.selectOptions(screen.getByLabelText('Pacing'), '');
    expect(onPacingChange).toHaveBeenCalledWith(undefined);
  });

  it('toggles exclude weekends when pacing is set', async () => {
    const { onPacingChange } = renderSelect({ strategy: 'steady' });
    await userEvent.click(screen.getByLabelText('Exclude weekends'));
    expect(onPacingChange).toHaveBeenCalledWith({
      strategy: 'steady',
      excludeWeekends: true,
    });
  });

  it('hides the exclude-weekends toggle when no pacing is set', () => {
    renderSelect();
    expect(screen.queryByLabelText('Exclude weekends')).not.toBeInTheDocument();
  });
});
