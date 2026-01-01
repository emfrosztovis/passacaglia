import { Debug, HashMap } from "common";
import { CandidateRule } from "../Context";

/**
 * Enforce that neighbor tones resolve to the pitch before it.
 */
export const enforceNeighborTones: CandidateRule = (_ctx, _s, cur, c) => {
    Debug.assert(c !== null);
    const p1 = cur.prevGlobal();
    const prev = p1?.value;
    if (!prev?.pitch || prev.type != 'neighbor') return c;

    const p2 = p1!.prevGlobal();
    const prev2 = p2?.value.pitch;
    Debug.assert(!!prev2);

    return c.filter((p) => p.equals(prev2));
}

export const makeNeighborTone: CandidateRule = (_ctx, _s, cur, c) => {
    Debug.assert(c !== null);
    const p1 = cur.prevGlobal();
    const prev = p1?.value;
    if (!prev?.pitch || prev.isNonHarmonic) return new HashMap();

    return c.filter((p) => {
        const dist = prev.pitch!.distanceTo(p).abs().value();
        return Math.abs(prev.pitch!.stepsTo(p)) <= 1 && dist > 0 && dist <= 2;
    });
}
