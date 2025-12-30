import { Debug } from "common";
import { CandidateRule } from "../Context";

export const enforcePassingTones: CandidateRule = (_ctx, _s, cur, c) => {
    Debug.assert(c !== null);
    const p1 = cur.prevGlobal();
    const prev = p1?.value;
    if (!prev?.pitch || !prev.attrs.isPassingTone) return c;

    const p2 = p1!.prevGlobal();
    const prev2 = p2?.value;
    Debug.assert(!!(prev2?.pitch));

    const o2 = prev2.pitch.ord().value();
    const o1 = prev.pitch.ord().value();

    return c.filter((p) =>
        Math.sign(o1 - p.ord().value()) == Math.sign(o2 - o1)
     && Math.abs(prev.pitch!.stepsTo(p)) <= 1);
}

export const makePassingTone: CandidateRule = (_ctx, _s, cur, c) => {
    Debug.assert(c !== null);
    const p1 = cur.prevGlobal();
    const prev = p1?.value;
    if (!prev?.pitch) return c;

    return c.filter((p) => {
        const dist = prev.pitch!.distanceTo(p).abs().value();
        return Math.abs(prev.pitch!.stepsTo(p)) <= 1 && dist > 0 && dist <= 2;
    });
}
