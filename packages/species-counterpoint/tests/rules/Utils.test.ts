import { describe, test, expect } from "vitest";
import { Chord } from "../../src/Chord";
import { H, I } from "../../src/Internal";
import { isPerfectConsonance } from "../../src/rules/Utils";

test('isPerfectConsonance', () => {
    expect(isPerfectConsonance(H.Interval.parse('P1')!)).toBe(true);
    expect(isPerfectConsonance(H.Interval.parse('P5')!)).toBe(true);
    expect(isPerfectConsonance(H.Interval.parse('P8')!)).toBe(true);
    expect(isPerfectConsonance(H.Interval.parse('d2')!)).toBe(true);

    expect(isPerfectConsonance(H.Interval.parse('P4')!)).toBe(false);
    expect(isPerfectConsonance(H.Interval.parse('M3')!)).toBe(false);

    expect(isPerfectConsonance(H.Interval.parse('P12')!)).toBe(true);
    expect(isPerfectConsonance(H.Interval.parse('-P19')!)).toBe(true);
});
