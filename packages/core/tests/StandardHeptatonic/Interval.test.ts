import { expect, test } from 'vitest';
import { StandardHeptatonic } from "../../src";

const I = StandardHeptatonic.Interval;

test('parse', () => {
    const a = I.parse('-m3+1/2');
    expect(a?.sign).toBe(-1);
    expect(a?.steps).toBe(2);
    expect(a?.distance.value()).toBe(3.5);

    const b = I.parse('M6');
    expect(b?.sign).toBe(1);
    expect(b?.steps).toBe(5);
    expect(b?.distance.value()).toBe(9);

    const c = I.parse('d4');
    expect(c?.sign).toBe(1);
    expect(c?.steps).toBe(3);
    expect(c?.distance.value()).toBe(4);

    const d = I.parse('d12-2');
    expect(d?.sign).toBe(1);
    expect(d?.steps).toBe(11);
    expect(d?.distance.value()).toBe(16);
});

test('parse fail', () => {
    expect(I.parse('')).toBeNull();
    expect(I.parse('4')).toBeNull();
    expect(I.parse('m3+')).toBeNull();
    expect(I.parse('m3+1.5')).toBeNull();
    expect(I.parse('m8')).toBeNull();
});

test('abbr', () => {
    const a = new I(2, 3.5, -1);
    expect(a?.toAbbreviation()).toBeOneOf(['-m3+1/2', '-M3-1/2']);

    const b = new I(11, 16);
    expect(b?.toAbbreviation()).toBe('d12-2');
    expect(b?.toAbbreviation({ alwaysSigned: true })).toBe('+d12-2');

    const c = new I(5, 9);
    expect(c?.toAbbreviation()).toBeOneOf(['M6']);
});

test('toString', () => {
    const a = new I(3, 6, -1);
    expect(a?.toString()).toBe('augmented fourth downward');

    const b = new I(11, 16);
    expect(b?.toString()).toBe('triply-diminished twelfth');
    expect(b?.toString({ alwaysSigned: true })).toBe('triply-diminished twelfth upward');

    expect(new I(5, 9).toString()).toBe('major sixth');
    expect(new I(11, 21).toString()).toBe('doubly-augmented twelfth');
    expect(new I(11, 20.5).toString()).toBe('3/2×-augmented twelfth');
    expect(new I(13, 23).toString()).toBe('major 14th');

    expect(new I(7, 12).toString()).toBe('octave');
    expect(new I(14, 24).toString()).toBe('double octave');
    expect(new I(5*7, 5*12).toString()).toBe('5-octave');
    expect(new I(14, 25).toString()).toBe('augmented double octave');
});

// common methods...

test('equality', () => {
    expect(I.parse('M3+1/4')?.equals(I.parse('M3+1/4')!)).toBe(true);
    expect(I.parse('m3+1/2')?.equals(I.parse('M3-1/2')!)).toBe(true);
    expect(I.parse('M3')?.equals(I.parse('d4')!)).toBe(false);

    expect(I.parse('M3+1/4')?.equalsEnharmonically(I.parse('M3+1/4')!)).toBe(true);
    expect(I.parse('m3+1/2')?.equalsEnharmonically(I.parse('M3-1/2')!)).toBe(true);
    expect(I.parse('M3')?.equalsEnharmonically(I.parse('d4')!)).toBe(true);
});

test('add', () => {
    expect(I.parse('m3')!.add(I.parse('m3')!).equals(I.parse('d5')!)).toBe(true);
    expect(I.parse('M3')!.add(I.parse('-m3')!).equals(I.parse('A1')!)).toBe(true);
    expect(I.parse('-M3')!.add(I.parse('m3')!).equals(I.parse('-A1')!)).toBe(true);
    expect(I.parse('P1')!.add(I.parse('-A1')!).equals(I.parse('-A1')!)).toBe(true);

    expect(I.parse('d2')!.add(I.parse('d2')!).equals(I.parse('d3-2')!)).toBe(true);
    expect(I.parse('-d2')!.add(I.parse('-d2')!).equals(I.parse('-d3-2')!)).toBe(true);
});

test('addPeriod', () => {
    expect(I.parse('A3')!.addPeriod(0).equals(I.parse('A3')!)).toBe(true);
    expect(I.parse('d3')!.addPeriod(10).equals(I.parse('d73')!)).toBe(true);
    expect(I.parse('d73')!.addPeriod(-10).equals(I.parse('d3')!)).toBe(true);
});

test('negate, abs', () => {
    const x = I.parse('M3+1/4')!;
    expect(x.negate().equals(I.parse('-M3+1/4')!)).toBe(true);
    expect(x.negate().negate().equals(x)).toBe(true);
    expect(x.negate().abs().equals(x)).toBe(true);
});

test('toSimple', () => {
    const x = I.parse('M17')!;
    expect(x.toSimple().equals(I.parse('M3')!)).toBe(true);
    expect(x.toSimple({ preserveUpToSteps: 7 }).equals(I.parse('M3')!)).toBe(true);
    expect(x.toSimple({ preserveUpToSteps: 12 }).equals(I.parse('M10')!)).toBe(true);
    expect(x.toSimple({ preserveUpToSteps: 17 }).equals(I.parse('M17')!)).toBe(true);
});

test('matches', () => {
    const x = I.parse('M10')!;
    expect(x.matches(I.parse('M3')!)).toBe(false);
    expect(x.matchesEnharmonically(I.parse('M3')!)).toBe(false);

    expect(x.matches(I.parse('M16')!)).toBe(false);
    expect(x.matchesEnharmonically(I.parse('M16')!)).toBe(false);

    expect(x.matches(I.parse('M10')!)).toBe(true);
    expect(x.matches(I.parse('d11')!)).toBe(false);
    expect(x.matchesEnharmonically(I.parse('d11')!)).toBe(true);

    expect(x.matches(I.parse('M17')!)).toBe(true);
    expect(x.matches(I.parse('d18')!)).toBe(false);
    expect(x.matchesEnharmonically(I.parse('d18')!)).toBe(true);
});
