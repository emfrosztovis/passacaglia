import { Debug, HashMap } from "common";
import { CandidateRule } from "../Context";
import { isConsonance, isLeadingTone } from "./Utils";

/**
 * Enforce that suspensions are resolved correctly.
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
      : isLeadingTone(prev.pitch!, s.harmony.scale) && prev.pitch!.distanceTo(p).value() == 1 ? v
      : isChordTone && prev.pitch!.stepsTo(p) == 1 ? v + 100
      : undefined
    );
}

export const makeSuspension: CandidateRule = (_ctx, _s, cur, c) => {
    Debug.assert(c !== null);

    if (cur.index !== 0) return new HashMap();
    const p1 = cur.prevGlobal();
    const prev = p1?.value;
    if (!prev?.pitch
      || prev.isNonHarmonic
      || prev.duration.value() < cur.duration.value()
    ) return new HashMap();

    return c.filterMap((p) => p.equals(prev.pitch!) ? 0 : undefined);
}
