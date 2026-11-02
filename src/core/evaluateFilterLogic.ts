export type FilterLogicResult =
  | { ok: true; value: boolean }
  | { ok: false; error: string };

const tokenize = (logic: string): string[] | null => {
  const tokens = logic.match(/\d+|AND|OR|\(|\)|\S/g)!;
  if (tokens.some((token) => !/^(\d+|AND|OR|\(|\))$/.test(token))) {
    return null;
  }
  return tokens;
};

const parse = (tokens: string[], results: boolean[]): boolean => {
  let pos = 0;
  const peek = (): string | undefined => tokens[pos];

  function parseAtom(): boolean {
    const token = peek();
    if (token === undefined) {
      throw new Error('Unexpected end of filter logic');
    }
    if (token === '(') {
      pos += 1;
      const value = parseExpression();
      if (peek() !== ')') {
        throw new Error('Expected a closing parenthesis');
      }
      pos += 1;
      return value;
    }
    if (/^\d+$/.test(token)) {
      pos += 1;
      const index = Number(token) - 1;
      if (index < 0 || index >= results.length) {
        throw new Error(`Filter reference out of range: ${token}`);
      }
      return results[index];
    }
    throw new Error(`Unexpected token: ${token}`);
  }

  function parseAnd(): boolean {
    let value = parseAtom();
    while (peek() === 'AND') {
      pos += 1;
      const right = parseAtom();
      value = value && right;
    }
    return value;
  }

  function parseExpression(): boolean {
    let value = parseAnd();
    while (peek() === 'OR') {
      pos += 1;
      const right = parseAnd();
      value = value || right;
    }
    return value;
  }

  const value = parseExpression();
  if (pos < tokens.length) {
    throw new Error(`Unexpected token: ${tokens[pos]}`);
  }
  return value;
};

export const evaluateFilterLogic = (
  results: boolean[],
  logic?: string
): FilterLogicResult => {
  if (logic === undefined || logic.trim() === '') {
    return { ok: true, value: results.every(Boolean) };
  }

  const tokens = tokenize(logic);
  if (tokens === null) {
    return { ok: false, error: `Invalid filter logic: ${logic}` };
  }

  try {
    return { ok: true, value: parse(tokens, results) };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
};
