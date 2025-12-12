import { expect, test } from 'vitest';
import { StandardHeptatonic } from "../../src";

const I = StandardHeptatonic.Interval;
const P = StandardHeptatonic.Pitch;
const PC = StandardHeptatonic.PitchClasses;
const Scales = StandardHeptatonic.Scales;
const Scale = StandardHeptatonic.Scale;

// scales

test('simple well-known scales', () => {
    let s = Scales.major(PC.c);
    expect(s.at(2).toPitch(4).toString()).toBe('e4');

    s = Scales.harmonicMinor(PC.c);
    expect(s.at(2).toPitch(4).toString()).toBe('ef4');

    s = Scales.major(PC.e);
    expect(s.at(2).toPitch(4).toString()).toBe('gs4');

    s = Scales.harmonicMinor(PC.e);
    expect(s.at(2).toPitch(4).toString()).toBe('g4');
});

test('parseDegree', () => {
    let d = Scales.C.major.parseDegree('iii')!;
    expect(d.index).toBe(2);
    expect(d.acci.value()).toBe(0);

    d = Scales.C.major.parseDegree('[4]f')!;
    expect(d.index).toBe(3);
    expect(d.acci.value()).toBe(-1);

    d = Scales.C.major.parseDegree('iv5/4s')!;
    expect(d.index).toBe(3);
    expect(d.acci.value()).toBe(1.25);
});

test('parseDegree fail', () => {
    expect(Scales.C.major.parseDegree('?')).toBeNull();
    expect(Scales.C.major.parseDegree('iiii')).toBeNull();
    expect(Scales.C.major.parseDegree('[0]')).toBeNull();
    expect(Scales.C.major.parseDegree('[2]+1')).toBeNull();
});

test('Degree.toString', () => {
    expect(Scales.C.major.at(5).toString()).toBe('vi');
    expect(Scales.C.major.at(5).toString({ preferArabic: true })).toBe('[6]');

    expect(Scales.C.major.at(4, -1.5).toString()).toBe('v3/2f');
    expect(Scales.C.major.at(5, -1.5).toString({ preferArabic: true })).toBe('[6]3/2f');
});

// common methods...

test('equality', () => {
    expect(Scales.C.major.equals(Scale.fromIntervals(PC.c,
        ['M2', 'M2', 'm2', 'M2', 'M2', 'M2', 'm2'].map((x) => I.parse(x)!))));

    expect(Scales.major(PC.d).intervalEquals(Scales.major(PC.b)));
});

test('getExactDegree', () => {
    expect(Scales.major(PC.c).getExactDegree(P.parse('ef')!)).toBeNull();
    expect(Scales.harmonicMinor(PC.c).getExactDegree(P.parse('ef')!)!.toString()).toBe('iii');
});
