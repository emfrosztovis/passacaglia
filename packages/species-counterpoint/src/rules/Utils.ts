import { NoteCursor } from "../Common";
import { H } from "../Internal";

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
