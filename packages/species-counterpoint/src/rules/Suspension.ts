import { Debug, HashMap } from "common";
import { CandidateRule } from "../Context";
import { isConsonance } from "./Utils";

/**
 * Enforce that notes surrounding a passing tone are its neighbors in ascending or descending order.
 */
export const enforceSuspension: CandidateRule = (_ctx, s, cur, c) => {
    Debug.assert(c !== null);
    const p1 = cur.prevGlobal();
    const prev = p1?.value;
    if (!prev?.pitch || prev.type != 'suspension') return c;

    const v = cur.parent.container;
    let isChordTone = true;
    for (const voice of s.voices) {
        if (voice == v) continue;
        const n = voice.noteAt(p1!.globalTime)?.value.pitch;
        if (!n) continue;

        if (!isConsonance(n.absoluteIntervalTo(prev.pitch))) {
            isChordTone = false;
            break;
        }
    }

    return c.filterMap((p, v) =>
        prev.pitch!.stepsTo(p) == -1 ? v
      : isChordTone && prev.pitch!.stepsTo(p) == 1 ? v + 100
      : undefined
    );
}

export const makeSuspension: CandidateRule = (_ctx, _s, cur, c) => {
    Debug.assert(c !== null);

    if (cur.index !== 0) return new HashMap();

    const p1 = cur.prevGlobal();
    const prev = p1?.value;
    if (!prev?.pitch || prev.isNonHarmonic) return new HashMap();

    return c.filter((p) => p.equals(prev.pitch!));
}
