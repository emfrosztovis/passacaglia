import { Debug } from "common";
import { H } from "../Internal";
import { CandidateRule } from "../Context";

/**
 * Enforces that the candidates form consonance with voices that are moving at the same point.
 */
export const enforceVerticalConsonanceWithMoving: CandidateRule
    = (ctx, s, cur, c) =>
{
    Debug.assert(c !== null);
    const otherPitches: H.Pitch[] = [];

    const tprev = cur.prevGlobal()?.globalTime;
    if (!tprev) return c;

    const t = cur.globalTime;
    const v = cur.parent.container;
    for (const voice of s.voices) {
        if (voice == v) continue;
        const n1 = voice.noteAt(t);
        if (!n1 || !n1.value.pitch
         || (n1.value.isNonHarmonic && !n1.globalTime.equals(t))) continue;

        const n2 = voice.noteAt(tprev);
        if (!n2 || n2.value.pitch !== n1.value.pitch) {
            // moving
            otherPitches.push(n1.value.pitch);
        }
    }

    outer: for (const [p, cost] of c.entries()) {
        let newCost = 0;

        for (const x of otherPitches) {
            const int = x.absoluteIntervalTo(p).toSimple({ preserveUpToSteps: 7 }).abs();
            const c2 = ctx.harmonyIntervals.get(int);
            if (c2 === undefined) {
                c.delete(p);
                continue outer;
            }
            newCost += c2 / otherPitches.length;
        }
        c.set(p, cost + newCost);
    }
    return c;
};

/**
 * Enforces that the candidates form consonance with all other voices.
 */
export const enforceVerticalConsonanceStrict: CandidateRule
    = (ctx, s, cur, c) =>
{
    Debug.assert(c !== null);
    const otherPitches: H.Pitch[] = [];

    let bassPitch: H.Pitch | null = null;
    const t = cur.globalTime;
    const v = cur.parent.container;
    const lastVoice = s.voices.at(-1);
    for (const voice of s.voices) {
        if (voice == v) continue;
        const n = voice.noteAt(t);
        if (!n || !n.value.pitch
         || (n.value.isNonHarmonic && !n.globalTime.equals(t))) continue;

        otherPitches.push(n.value.pitch);
        if (voice == lastVoice)
            bassPitch = n.value.pitch;
    }

    outer: for (const [p, cost] of c.entries()) {
        let newCost = 0;

        for (const x of otherPitches) {
            const int = x.absoluteIntervalTo(p).toSimple().abs();
            const c2 = ctx.harmonyIntervals.get(int);
            if (c2 === undefined) {
                c.delete(p);
                continue outer;
            }
            newCost += c2 / otherPitches.length;

            if (v == lastVoice
             && ctx.forbidWithBass.find((f) => f.equals(int)))
            {
                c.delete(p);
                continue outer;
            }
        }
        c.set(p, cost + newCost);

        if (bassPitch) {
            const int = bassPitch.absoluteIntervalTo(p).toSimple();
            if (ctx.forbidWithBass.find((f) => f.equals(int))) {
                c.delete(p);
                continue;
            }
        }
    }

    return c;
}
