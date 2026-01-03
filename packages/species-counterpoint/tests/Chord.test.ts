import { describe, test, expect } from "vitest";
import { Chord } from "../src/Chord";
import { H, I } from "../src/Internal";

test('chord positions', () => {
    const maj = Chord.fromIntervals([I.parse('M3')!, I.parse('m3')!]);
    const maj6 = Chord.fromIntervals([I.parse('m3')!, I.parse('P4')!]);
    expect(maj.toPosition(1).equals(maj6));
});
