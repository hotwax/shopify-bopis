import { describe, it, expect } from 'vitest';
import { run } from './run';

/**
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

describe('delivery customization function', () => {
  it('returns no operations without configuration', () => {
    const result = run({
      deliveryCustomization: {
        metafield: null
      }
    });
    const expected = /** @type {FunctionRunResult} */ ({ operations: [] });

    expect(result).toEqual(expected);
  });
});