import { expect, test } from 'vitest';
import { StandardHeptatonic } from "../../src";

const I = StandardHeptatonic.Interval;
const P = StandardHeptatonic.Pitch;
const PC = StandardHeptatonic.PitchClasses;
const Scales = StandardHeptatonic.Scales;
const Scale = StandardHeptatonic.Scale;

// scales

test('simple well-known scales', () => {
    let s = Scales.major(PC.b);
    expect(s.at(2).toPitch().toString()).toBe('ds1');

    s = Scales.harmonicMinor(PC.c);
    expect(s.at(2).toPitch().toString()).toBe('ef0');

    s = Scales.major(PC.e);
    expect(s.at(2).withPeriod(4).toPitch().toString()).toBe('gs4');

    s = Scales.harmonicMinor(PC.e);
    expect(s.at(2).withPeriod(4).toPitch().toString()).toBe('g4');
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

test('getDegreesInRange', () => {
    const s = Scales.major(P.parse('fs')!);
    expect(s.getDegreesInRange(P.parse('c4')!, P.parse('g4')!)
        .map((x) => x.toPitch().toString())).toEqual(['cs4', 'ds4', 'es4', 'fs4']);

    const s2 = Scales.major(P.parse('b')!);
    expect(s2.getDegreesInRange(P.parse('c4')!, P.parse('g4')!)
        .map((x) => x.toPitch().toString())).toEqual(['cs4', 'ds4', 'e4', 'fs4']);
});

test('getExactDegree', () => {
    expect(Scales.major(PC.c).getExactDegree(P.parse('es')!)).toBeNull();
    expect(Scales.major(PC.c).getExactDegree(P.parse('es')!, { allowEnharmonic: true })!.toString()).toBe('iv');
    expect(Scales.harmonicMinor(PC.c).getExactDegree(P.parse('ef')!)!.toString()).toBe('iii');
});

test('rotate', () => {
    expect(Scales.C.major.rotate(2, { moveRoot: false }).equals(Scales.phrygian(PC.c))).toBe(true);
    expect(Scales.C.major.rotate(2, { moveRoot: true }).equals(Scales.phrygian(PC.e))).toBe(true);
});

test('transpose', () => {
    expect(Scales.C.major.transpose(I.parse('m3')!).equals(Scales.major(P.parse('ef')!))).toBe(true);
    expect(Scales.C.major.transpose(I.parse('-m2')!).equals(Scales.major(PC.b))).toBe(true);
});

test('Degree.next, Degree.previous', () => {
    const s = Scales.major(P.parse('b')!);
    expect(s.at(0).next().toPitch().toString()).toBe('cs1');
    expect(s.at(6).next().toPitch().toString()).toBe('b1');
    expect(s.at(0).previous().toPitch().toString()).toBe('as0');
    expect(s.at(6).previous().toPitch().toString()).toBe('gs1');
});
