import { expect, test } from 'vitest';
import { modulo, randomChoice, rotateArray, shuffle } from '../src/Utils';

test('modulo', () => {
    expect(modulo(7, 7)).toBe(0);
    expect(modulo(8, 7)).toBe(1);
    expect(modulo(6, 7)).toBe(6);
    expect(modulo(-1, 7)).toBe(6);
    expect(modulo(-7, 7)).toBe(0);
    expect(modulo(-8, 7)).toBe(6);
});

test('rotateArray', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(rotateArray(arr, 0)).toEqual([1, 2, 3, 4, 5]);
    expect(rotateArray(arr, 1)).toEqual([2, 3, 4, 5, 1]);
    expect(rotateArray(arr, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(rotateArray(arr, 6)).toEqual([2, 3, 4, 5, 1]);
    expect(rotateArray(arr, -1)).toEqual([5, 1, 2, 3, 4]);
    expect(rotateArray(arr, -6)).toEqual([5, 1, 2, 3, 4]);
    expect(rotateArray([], 1)).toEqual([]);
});

test('randomChoice', () => {
    const arr = [1, 2, 3, 4, 5];
    const choice = randomChoice(arr);
    expect(arr).toContain(choice);
    expect(() => randomChoice([])).toThrow();
});

test('shuffle', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffle(arr);
    expect(shuffled).toHaveLength(arr.length);
    expect(shuffled.sort()).toEqual(arr.sort());
});
