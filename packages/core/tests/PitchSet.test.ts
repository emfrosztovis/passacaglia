import { expect, test } from 'vitest';
import { PitchMap, StandardHeptatonic } from "../src";

const P = StandardHeptatonic.Pitch;

test('add, has, delete', () => {
    const set = new PitchMap<StandardHeptatonic.Pitch>();
    const p1 = P.parse('c4')!;
    const p2 = P.parse('d4')!;
    const p3 = P.parse('c4')!; // Same as p1

    set.add(p1);
    expect(set.has(p1)).toBe(true);
    expect(set.has(p2)).toBe(false);
    expect(set.size).toBe(1);

    set.add(p2);
    expect(set.has(p2)).toBe(true);
    expect(set.size).toBe(2);

    set.add(p3); // Adding duplicate should not increase size
    expect(set.size).toBe(2);

    set.delete(p1);
    expect(set.has(p1)).toBe(false);
    expect(set.size).toBe(1);

    set.delete(p2);
    expect(set.has(p2)).toBe(false);
    expect(set.size).toBe(0);
});

test('clone', () => {
    const set1 = new PitchMap<StandardHeptatonic.Pitch>();
    set1.add(P.parse('c4')!);
    set1.add(P.parse('d4')!);

    const set2 = set1.clone();
    expect(set2.size).toBe(set1.size);
    expect(set2.has(P.parse('c4')!)).toBe(true);
    expect(set2.has(P.parse('d4')!)).toBe(true);

    // Ensure it's a deep clone for the set structure, not the pitches themselves
    set2.delete(P.parse('c4')!);
    expect(set1.has(P.parse('c4')!)).toBe(true);
    expect(set2.has(P.parse('c4')!)).toBe(false);
});

test('intersectWith', () => {
    const set1 = new PitchMap<StandardHeptatonic.Pitch>();
    set1.add(P.parse('c4')!);
    set1.add(P.parse('d4')!);
    set1.add(P.parse('e4')!);

    const set2 = new PitchMap<StandardHeptatonic.Pitch>();
    set2.add(P.parse('d4')!);
    set2.add(P.parse('e4')!);
    set2.add(P.parse('f4')!);

    set1.intersectWith(set2);
    expect(set1.size).toBe(2);
    expect(set1.has(P.parse('c4')!)).toBe(false);
    expect(set1.has(P.parse('d4')!)).toBe(true);
    expect(set1.has(P.parse('e4')!)).toBe(true);
    expect(set1.has(P.parse('f4')!)).toBe(false);
});

test('unionWith', () => {
    const set1 = new PitchMap<StandardHeptatonic.Pitch>();
    set1.add(P.parse('c4')!);
    set1.add(P.parse('d4')!);

    const set2 = new PitchMap<StandardHeptatonic.Pitch>();
    set2.add(P.parse('d4')!);
    set2.add(P.parse('e4')!);

    set1.unionWith(set2);
    expect(set1.size).toBe(3);
    expect(set1.has(P.parse('c4')!)).toBe(true);
    expect(set1.has(P.parse('d4')!)).toBe(true);
    expect(set1.has(P.parse('e4')!)).toBe(true);
});
