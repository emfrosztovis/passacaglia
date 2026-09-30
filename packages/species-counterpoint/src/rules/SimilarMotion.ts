import { LocalRule } from "../Context";
import { isPerfectConsonance } from "./Utils";

/**
 * Forbid arriving at perfect consonances 1) by similar motion or 2) immediately from perfect consonances.
 */
export const forbidPefectsBySimilarMotion: LocalRule = (_ctx, s, x1) => {
    const x0 = x1.prevGlobal();
    if (!x0?.value.pitch || !x1?.value.pitch) return 0;

    const v = x1.parent.container;
    const sign0 = x0.value.pitch.distanceTo(x1.value.pitch).sign();
    for (const voice of s.voices) {
        if (voice == v) continue;
        const n1 = voice.noteAt(x1.globalTime);
        if (!n1?.value.pitch) continue;

        const d1 = x1.value.pitch.intervalTo(n1.value.pitch);
        if (!isPerfectConsonance(d1)) continue;

        const n0 = n1.globalTime.value() < x1.globalTime.value() ? n1 : n1.prevGlobal();
        if (!n0?.value.pitch) continue;

        const sign1 = n0.value.pitch.distanceTo(n1.value.pitch).sign();
        if (sign0 == sign1) {
            if (sign0 == 0) continue; // skip if they're both repeated
            return Infinity;
        }

        const d0 = x0.value.pitch.intervalTo(n0.value.pitch);
        if (isPerfectConsonance(d0))
            return Infinity;
    }
    return 0;
};
