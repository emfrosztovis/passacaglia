import { Debug } from "common";
import { H } from "../Internal";
import { CandidateRule } from "../Context";

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
        if (!n || !n.value.pitch) continue;

        otherPitches.push(n.value.pitch);
        if (voice == lastVoice)
            bassPitch = n.value.pitch;
    }

    outer: for (const [p, cost] of c.entries()) {
        let newCost = 0;

        for (const x of otherPitches) {
            const int = x.intervalTo(p).toSimple().abs();
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
            const int = bassPitch.intervalTo(p).toSimple();
            if (ctx.forbidWithBass.find((f) => f.equals(int))) {
                c.delete(p);
                continue;
            }
        }
    }

    return c;
}
