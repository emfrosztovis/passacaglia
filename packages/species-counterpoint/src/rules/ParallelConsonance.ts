import { H } from "../Internal";
import { LocalRule } from "../Context";
import { isPerfectConsonance, isStepwiseAround } from "./Utils";

/**
 * Forbid arriving at perfect consonances 1) by similar motion or 2) immediately from perfect consonances.
 */
export const forbidPerfectsBySimilarMotion: LocalRule = (_ctx, s, x1) => {
    const x0 = x1.prevGlobal();
    if (!x0?.value.pitch || !x1?.value.pitch) return 0;

    const v = x1.parent.container;
    const sign0 = Math.sign(x0.value.pitch.distanceTo(x1.value.pitch).num);
    for (const voice of s.voices) {
        if (voice == v) continue;
        const n1 = voice.noteAt(x1.globalTime);
        if (!n1?.value.pitch) continue;
        const n0 = n1.globalTime.value() < x1.globalTime.value() ? n1 : n1.prevGlobal();
        if (!n0?.value.pitch) continue;

        const sign1 = Math.sign(n0.value.pitch.distanceTo(n1.value.pitch).num);
        // skip if they're both repeated
        if (sign0 == sign1 && sign0 == 0) continue;

        const d0 = x0.value.pitch.absoluteIntervalTo(n0.value.pitch).toSimple();
        const d1 = x1.value.pitch.absoluteIntervalTo(n1.value.pitch).toSimple();
        const isSimilarMotion = sign0 == sign1;
        if ((isSimilarMotion || isPerfectConsonance(d0)) && isPerfectConsonance(d1))
            return Infinity;
    }
    return 0;
};


/**
 * Forbid perfect consonances that are near each other.
 *
 * Specifically, if the second consonance is on the first beat of the measure:
 * - all perfect consonances that is less a measure apart from it
 *
 * If the second consonance is not so:
 * - only when the first consonance is on the same beat at the second
 * - and NO notes are non-harmonic tones, or surrounded by stepwise motion
 * - (NOT IMPLEMENTED) and IF the two notes of the second consonance don't start simultaneously, only when they are NOT in contrary motion.
 */
export const forbidNearbyPerfects: LocalRule = (ctx, s, x1) => {
    const px1 = x1?.value.pitch;
    if (!px1) return 0;

    const measureLen = ctx.parameters.measureLength.value();
    const v = x1.parent.container;
    if (x1.index == 0) {
        // first beat
        const t1 = x1.globalTime;

        for (const voice of s.voices) {
            if (voice == v) continue;
            const y1 = voice.noteAt(t1);
            const py1 = y1?.value.pitch;
            if (!py1) continue;

            const int1 = px1.absoluteIntervalTo(py1);
            if (!isPerfectConsonance(int1)) continue;

            // check notes from all other voices against this voice
            let py2: H.Pitch | null = null;
            for (
                let y2 = y1.prevGlobal();
                y2 && !!(py2 = y2.value.pitch) && t1.sub(y2.globalTime).value() < measureLen;
                y2 = y2?.prevGlobal()
            ) {
                const x2 = v.noteAt(y2.globalTime);
                const px2 = x2?.value.pitch;
                if (!px2) continue;

                const int2 = px2.intervalTo(py2);
                if (int2.equals(int1)) return Infinity;
            }

            // check notes from this voice against all other voices
            let px2: H.Pitch | null = null;
            for (
                let x2 = x1.prevGlobal();
                x2 && !!(px2 = x2.value.pitch) && t1.sub(x2.globalTime).value() < measureLen;
                x2 = x2?.prevGlobal()
            ) {
                const y2 = voice.noteAt(x2.globalTime);
                const py2 = y2?.value.pitch;
                if (!py2) continue;

                const int2 = px2.intervalTo(py2);
                if (int2.equals(int1)) return Infinity;
            }
        }
    } else {
        // not first beat, just check the same beat one measure before in each voice
        if (x1.value.type) return 0;
        if (isStepwiseAround(x1)) return 0;

        const t1 = x1.globalTime;
        const t2 = t1.sub(ctx.parameters.measureLength);

        const x2 = v.noteAt(t2);
        const px2 = x2?.value.pitch;
        if (!px2 || !x2.globalTime.equals(t2)) return 0;
        if (x2.value.type) return 0;
        if (isStepwiseAround(x2)) return 0;

        for (const voice of s.voices) {
            if (voice == v) continue;

            const y1 = voice.noteAt(t1);
            const py1 = y1?.value.pitch;
            if (!py1 || y1.value.type) continue;
            if (isStepwiseAround(y1)) continue;

            const int1 = px1.intervalTo(py1);
            if (!isPerfectConsonance(int1)) continue;

            const y2 = voice.noteAt(t2);
            const py2 = y2?.value.pitch;
            if (!py2 || y2.value.type) continue;
            if (isStepwiseAround(y2)) continue;

            const int2 = px2.intervalTo(py2);
            if (int1.equals(int2)) return Infinity;
        }
    }
    return 0;
};
