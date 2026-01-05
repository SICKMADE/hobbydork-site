// Example Jest unit test for a utility function
// Place this in __tests__/sum.test.ts

import { sum } from '../src/lib/utils';

describe('sum', () => {
  it('adds two numbers', () => {
    expect(sum(2, 3)).toBe(5);
    expect(sum(-1, 1)).toBe(0);
  });
});
