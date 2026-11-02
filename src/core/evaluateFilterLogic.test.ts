import { describe, expect, it } from 'vitest';
import { evaluateFilterLogic } from './evaluateFilterLogic';

describe('evaluateFilterLogic', () => {
  it('ANDs all results when no logic is given or it is blank', () => {
    expect(evaluateFilterLogic([true, true])).toEqual({
      ok: true,
      value: true,
    });
    expect(evaluateFilterLogic([true, false])).toEqual({
      ok: true,
      value: false,
    });
    expect(evaluateFilterLogic([true, true], '   ')).toEqual({
      ok: true,
      value: true,
    });
  });

  it('evaluates 1-based references with parentheses', () => {
    expect(evaluateFilterLogic([true, false, true], '1 AND (2 OR 3)')).toEqual({
      ok: true,
      value: true,
    });
    expect(evaluateFilterLogic([true, false, false], '1 AND (2 OR 3)')).toEqual({
      ok: true,
      value: false,
    });
  });

  it('binds AND tighter than OR', () => {
    expect(evaluateFilterLogic([false, true, true], '1 OR 2 AND 3')).toEqual({
      ok: true,
      value: true,
    });
    expect(evaluateFilterLogic([false, true, false], '1 OR 2 AND 3')).toEqual({
      ok: true,
      value: false,
    });
  });

  it('surfaces a validation error for malformed logic, never throws', () => {
    expect(evaluateFilterLogic([true], '1 AND').ok).toBe(false);
    expect(evaluateFilterLogic([true, false], '1 AND (2').ok).toBe(false);
    expect(evaluateFilterLogic([true], 'banana').ok).toBe(false);
    expect(evaluateFilterLogic([true, true], '1 2').ok).toBe(false);
    expect(evaluateFilterLogic([true, true], '1 OR )').ok).toBe(false);
  });

  it('surfaces an error for an out-of-range reference', () => {
    expect(evaluateFilterLogic([true], '2').ok).toBe(false);
  });
});
