import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Target, Thresholds } from '../core/types';
import { TargetInput } from './TargetInput';

const renderInput = (props: {
  target?: Target;
  thresholds?: Thresholds;
  onTargetChange?: (t: Target | undefined) => void;
  onThresholdsChange?: (t: Thresholds | undefined) => void;
}) => {
  const onTargetChange = props.onTargetChange ?? vi.fn();
  const onThresholdsChange = props.onThresholdsChange ?? vi.fn();
  render(
    <TargetInput
      target={props.target}
      thresholds={props.thresholds}
      onTargetChange={onTargetChange}
      onThresholdsChange={onThresholdsChange}
    />
  );
  return { onTargetChange, onThresholdsChange };
};

describe('TargetInput', () => {
  it('emits a target with a default direction when a goal value is entered', () => {
    const { onTargetChange } = renderInput({});
    fireEvent.change(screen.getByLabelText('Goal value'), {
      target: { value: '100' },
    });
    expect(onTargetChange).toHaveBeenLastCalledWith({
      value: 100,
      direction: 'higherIsBetter',
    });
  });

  it('clears the target when the goal value is emptied', () => {
    const { onTargetChange } = renderInput({
      target: { value: 100, direction: 'higherIsBetter' },
    });
    fireEvent.change(screen.getByLabelText('Goal value'), {
      target: { value: '' },
    });
    expect(onTargetChange).toHaveBeenLastCalledWith(undefined);
  });

  it('changes the goal direction', async () => {
    const { onTargetChange } = renderInput({
      target: { value: 100, direction: 'higherIsBetter' },
    });
    await userEvent.selectOptions(
      screen.getByLabelText('Goal direction'),
      'lowerIsBetter'
    );
    expect(onTargetChange).toHaveBeenLastCalledWith({
      value: 100,
      direction: 'lowerIsBetter',
    });
  });

  it('emits amber and green thresholds', () => {
    const { onThresholdsChange } = renderInput({
      thresholds: { amber: 0.7, green: 0.9 },
    });
    fireEvent.change(screen.getByLabelText('Amber threshold'), {
      target: { value: '0.6' },
    });
    expect(onThresholdsChange).toHaveBeenLastCalledWith({
      amber: 0.6,
      green: 0.9,
    });
  });

  it('defaults the other threshold to 0 when none are set yet', () => {
    const { onThresholdsChange } = renderInput({});
    fireEvent.change(screen.getByLabelText('Green threshold'), {
      target: { value: '0.9' },
    });
    expect(onThresholdsChange).toHaveBeenLastCalledWith({
      amber: 0,
      green: 0.9,
    });
    fireEvent.change(screen.getByLabelText('Amber threshold'), {
      target: { value: '0.5' },
    });
    expect(onThresholdsChange).toHaveBeenLastCalledWith({
      amber: 0.5,
      green: 0,
    });
  });
});
