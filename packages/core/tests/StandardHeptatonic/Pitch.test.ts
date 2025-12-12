import { expect, test } from 'vitest';
import { StandardHeptatonic } from "../../src";

const I = StandardHeptatonic.Interval;
const P = StandardHeptatonic.Pitch;

test('parse', () => {
    expect(P.parse('c')?.ord().value()).eq(0);
    expect(P.parse('C10')?.ord().value()).eq(120);
    expect(P.parse('eff4')?.ord().value()).eq(48+4-2);
    expect(P.parse('esss4')?.ord().value()).eq(48+4+3);
    expect(P.parse('e5f4')?.ord().value()).eq(48+4-5);
    expect(P.parse('c1/4s4')?.ord().value()).eq(48.25);
});

test('toMidi', () => {
    expect(P.parse('C4')?.toMidi().value()).eq(60);
});

test('parse fail', () => {
    expect(P.parse('do4')).toBeNull();
    expect(P.parse('h5')).toBeNull();
    expect(P.parse('c3+1')).toBeNull();
});

test('toString', () => {
    expect(P.parse('c4')?.toString()).eq('c4');
    expect(P.parse('c3f0')?.toString()).eq('c3f0');
    expect(P.parse('gss7')?.toString()).eq('gss7');
    expect(P.parse('g6/17s7')?.toString()).eq('g6/17s7');
});

test('equality', () => {
    expect(P.parse('c4')?.equals(P.parse('c4')!)).toBe(true);
    expect(P.parse('d12/34s5')?.equals(P.parse('d6/17s5')!)).toBe(true);
    expect(P.parse('e3/8s5')?.equals(P.parse('f5/8f5')!)).toBe(false);

    expect(P.parse('d12/34s5')?.enharmonicallyEquals(P.parse('d6/17s5')!)).toBe(true);
    expect(P.parse('e3/8s5')?.enharmonicallyEquals(P.parse('f5/8f5')!)).toBe(true);
});

test('normalize', () => {
    expect(P.parse('cff4')?.normalize().toString()).toBe('cff4');
    expect(P.parse('csss4')?.normalize().toString()).toBe('ds4');
    expect(P.parse('cfff4')?.normalize().toString()).toBe('bff3');
    expect(P.parse('b12s4')?.normalize().toString()).toBe('ass5');
});

// common methods...

test('add interval', () => {
    expect(P.parse('c4')!.add(I.parse('m3')!).toString()).toBe('ef4');
    expect(P.parse('cs4')!.add(I.parse('m3')!).toString()).toBe('e4');
    expect(P.parse('c4')!.add(I.parse('M3')!).toString()).toBe('e4');
    expect(P.parse('c4')!.add(I.parse('d6')!).toString()).toBe('aff4');
    expect(P.parse('c4')!.add(I.parse('d6+1/4')!).toString()).toBe('a7/4f4');
});


test('intervalTo', () => {
    const a = P.parse('Ef4')!.intervalTo(P.parse('Gss4')!);
    expect(a.toAbbreviation()).toBe('A3+1');

    const b = P.parse('F4')!.intervalTo(P.parse('B3')!);
    expect(b.toAbbreviation()).toBe('-d5');

    const x = P.parse('G23/45s4')!;
    const y = P.parse('C45/67f3')!;
    expect(x.add(x.intervalTo(y)).equals(y)).toBe(true);
});
