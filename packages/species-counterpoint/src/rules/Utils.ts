import { NoteCursor } from "../Voice";
import { H } from "../Internal";
import { CounterpointNoteCursor } from "../Basic";
import { Debug } from "common";

export function isStepwiseBefore(c: NoteCursor): boolean | undefined {
    const pc = c.value.pitch;
    if (!pc) return undefined;

    const b = c.prevGlobal();
    const pb = b?.value.pitch;
    if (!pb) return undefined;

    return Math.abs(pb.stepsTo(pc)) == 1;
}

export function isStepwiseAfter(c: NoteCursor): boolean | undefined {
    const pc = c.value.pitch;
    if (!pc) return undefined;

    const b = c.nextGlobal();
    const pb = b?.value.pitch;
    if (!pb) return undefined;

    return Math.abs(pb.stepsTo(pc)) == 1;
}

export function isStepwiseAround(c: NoteCursor): boolean | undefined {
    const a = isStepwiseBefore(c);
    if (a === undefined) return undefined;
    const b = isStepwiseAfter(c);
    if (b === undefined) return undefined;
    return a && b;
}

export function isPerfectConsonance(i: H.Interval) {
    const simple = i.abs().toSimple().distance.value();
    return simple == 0 || simple == 7 || simple == 12;
}

export function isConsonance(i: H.Interval) {
    const simple = i.abs().toSimple().distance.value();
    return simple == 0 || simple == 3 || simple == 4 || simple == 7
        || simple == 8 || simple == 9 || simple == 12;
}

export function isLeadingTone(p: H.Pitch, s: H.Scale) {
    const deg = s.getExactDegree(p);
    if (!deg) return false;
    return deg.index == s.degrees.length - 1;
}

export function prevDifferent(c: CounterpointNoteCursor) {
    Debug.assert(!!c.value.pitch);
    let n: CounterpointNoteCursor | undefined;
    while (n = c.prevGlobal())
        if (!n.value.pitch || !n.value.pitch.equals(c.value.pitch))
            return n;
    return undefined;
}

export function nextDifferent(c: CounterpointNoteCursor) {
    Debug.assert(!!c.value.pitch);
    let n: CounterpointNoteCursor | undefined;
    while (n = c.nextGlobal())
        if (!n.value.pitch || !n.value.pitch.equals(c.value.pitch))
            return n;
    return undefined;
}
