import { expect, test } from 'vitest';
import { EqualTemperamentTuning, StandardHeptatonic } from "../../src";

const P = StandardHeptatonic.Pitch;
const A440 = new EqualTemperamentTuning(StandardHeptatonic.System, 440, P.parse('a4')!);

test('ET tuning', () => {
    expect(A440.frequencyOf(P.parse('c4')!)).toBeCloseTo(261.63);
    expect(A440.frequencyOf(P.parse('bf6')!)).toBeCloseTo(1864.66);

    expect(A440.ratioBetween(P.parse('g5')!, P.parse('g6')!)).toBe(2);
    expect(A440.ratioBetween(P.parse('c5')!, P.parse('g5')!)).toBeCloseTo(1.498, 3);

    expect(A440.centBetween(P.parse('c5')!, P.parse('d5')!)).toBeCloseTo(200, 4);
});
