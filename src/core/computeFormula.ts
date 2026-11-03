import type { FormulaOp, SubjectValue } from './types';

const combine = (
  values: Array<number | undefined>,
  op: FormulaOp
): number | null => {
  switch (op) {
    case 'add':
      return values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
    case 'subtract':
      return values
        .slice(1)
        .reduce<number>((acc, value) => acc - (value ?? 0), values[0] ?? 0);
    case 'multiply':
      return values.reduce<number>((product, value) => product * (value ?? 0), 1);
    case 'divide': {
      let acc = values[0] ?? 0;
      for (const value of values.slice(1)) {
        if (value === undefined || value === 0) {
          return null;
        }
        acc = acc / value;
      }
      return acc;
    }
  }
};

export const computeFormula = (
  componentResults: SubjectValue[][],
  op: FormulaOp
): SubjectValue[] => {
  const subjects = new Set<string>();
  const byComponent = componentResults.map((result) => {
    const map = new Map<string, number>();
    for (const row of result) {
      map.set(row.subject, row.value);
      subjects.add(row.subject);
    }
    return map;
  });

  const out: SubjectValue[] = [];
  for (const subject of subjects) {
    const values = byComponent.map((map) => map.get(subject));
    const combined = combine(values, op);
    if (combined !== null) {
      out.push({ subject, value: combined });
    }
  }

  return out.sort((a, b) => b.value - a.value);
};
