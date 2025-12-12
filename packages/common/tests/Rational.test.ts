import { expect, test } from 'vitest';
import { Rational } from '../src/index';

test('construction and simplification', () => {
    const r1 = new Rational(1, 2);
    expect(r1.num).toBe(1);
    expect(r1.den).toBe(2);

    const r2 = new Rational(2, 4);
    expect(r2.num).toBe(1);
    expect(r2.den).toBe(2);

    const r3 = new Rational(3, 1);
    expect(r3.num).toBe(3);
    expect(r3.den).toBe(1);

    const r4 = new Rational(6, 2);
    expect(r4.num).toBe(3);
    expect(r4.den).toBe(1);

    const r5 = new Rational(-1, 2);
    expect(r5.num).toBe(-1);
    expect(r5.den).toBe(2);

    const r6 = new Rational(1, -2);
    expect(r6.num).toBe(-1);
    expect(r6.den).toBe(2);

    const r7 = new Rational(0, 5);
    expect(r7.num).toBe(0);
    expect(r7.den).toBe(1);
});

test('addition', () => {
    const r1 = new Rational(1, 2);
    const r2 = new Rational(1, 3);
    const sum = r1.add(r2);
    expect(sum.num).toBe(5);
    expect(sum.den).toBe(6);

    const r3 = new Rational(1, 2);
    const r4 = new Rational(-1, 2);
    const sum2 = r3.add(r4);
    expect(sum2.num).toBe(0);
    expect(sum2.den).toBe(1);
});

test('subtraction', () => {
    const r1 = new Rational(1, 2);
    const r2 = new Rational(1, 3);
    const diff = r1.sub(r2);
    expect(diff.num).toBe(1);
    expect(diff.den).toBe(6);

    const r3 = new Rational(1, 2);
    const r4 = new Rational(1, 2);
    const diff2 = r3.sub(r4);
    expect(diff2.num).toBe(0);
    expect(diff2.den).toBe(1);
});

test('multiplication', () => {
    const r1 = new Rational(1, 2);
    const r2 = new Rational(2, 3);
    const prod = r1.mul(r2);
    expect(prod.num).toBe(1);
    expect(prod.den).toBe(3);
});

test('division', () => {
    const r1 = new Rational(1, 2);
    const r2 = new Rational(3, 4);
    const quot = r1.div(r2);
    expect(quot.num).toBe(2);
    expect(quot.den).toBe(3);
});

test('negation, absolute value', () => {
    const r1 = new Rational(-3, 4);
    const n = r1.negate();
    expect(n.num).toBe(3);
    expect(n.den).toBe(4);

    const a = r1.abs();
    expect(a.num).toBe(3);
    expect(a.den).toBe(4);
});

test('modulo', () => {
    const r1 = new Rational(17, 6);
    const r2 = new Rational(5, 4);
    const mod = r1.modulo(r2);
    expect(mod.num).toBe(1);
    expect(mod.den).toBe(3);

    const r3 = new Rational(-6, 5);
    const r4 = new Rational(1, 2);
    const mod2 = r3.modulo(r4);
    expect(mod2.num).toBe(3);
    expect(mod2.den).toBe(10);
});

test('from', () => {
    const r1 = Rational.from(0.5)
    expect(r1.num).toBe(1);
    expect(r1.den).toBe(2);

    const r2 = Rational.from(-0.75)
    expect(r2.num).toBe(-3);
    expect(r2.den).toBe(4);

    const r3 = Rational.from(6789)
    expect(r3.num).toBe(6789);
    expect(r3.den).toBe(1);

    const array = Rational.array([0.5, -0.75, 6789]);
    expect(array[0].equals(r1)).toBe(true);
    expect(array[1].equals(r2)).toBe(true);
    expect(array[2].equals(r3)).toBe(true);
});

test('parse', () => {
    expect(Rational.parse('1/2')?.equals(new Rational(1, 2))).toBe(true);
    expect(Rational.parse('5')?.equals(new Rational(5))).toBe(true);
    expect(Rational.parse('-3/4')?.equals(new Rational(-3, 4))).toBe(true);
    expect(Rational.parse('+7/2')?.equals(new Rational(7, 2))).toBe(true);
    expect(Rational.parse('0/1')?.equals(new Rational(0))).toBe(true);
    expect(Rational.parse('1/0')).toBe(null);
    expect(Rational.parse('12/')).toBe(null);
    expect(Rational.parse('/34')).toBe(null);
    expect(Rational.parse('')).toBe(null);
    expect(Rational.parse('foo')).toBe(null);
})

test('equals', () => {
    const r1 = new Rational(1, 2);
    const r2 = new Rational(1, 2);
    const r3 = new Rational(2, 4);
    const r4 = new Rational(1, 3);
    expect(r1.equals(r2)).toBe(true);
    expect(r1.equals(r3)).toBe(true);
    expect(r1.equals(r4)).toBe(false);
});

test('max, min', () => {
    const max = Rational.from(0).max(3.5, -1.1, 0, 2);
    expect(max.toString()).toBe('7/2');

    const min = Rational.from(0).min(3.9, -1.5, 0, 2);
    expect(min.toString()).toBe('-3/2');
})

test('value', () => {
    const r1 = new Rational(1, 2);
    expect(r1.value()).toBe(0.5);

    const r2 = new Rational(3, 4);
    expect(r2.value()).toBe(0.75);
});

test('toString', () => {
    const r1 = new Rational(1, 2);
    expect(r1.toString()).toBe('1/2');
    expect(r1.toString({ mixedFraction: true })).toBe('1/2');

    const r2 = new Rational(3, 1);
    expect(r2.toString({ alwaysSigned: true })).toBe('+3');
    expect(r2.toString({ mixedFraction: true })).toBe('3');

    const r3 = new Rational(7, 3);
    expect(r3.toString({ alwaysSigned: true, mixedFraction: true })).toBe('+2 1/3');
});

test.fails('error: unsafe integer', () => {
    new Rational(Math.pow(2, 53)-1, Math.pow(2, 53));
});

test.fails('error: zero denominator', () => {
    new Rational(1, 0);
});

test.fails('error: divide by zero', () => {
    new Rational(2).div(0);
});
