import { Debug } from "common";
import { H } from "../Internal";
import { CandidateRule, LocalRule } from "../Context";
import { isConsonance } from "./Utils";

/**
 * Enforces that the candidates form consonance with voices that are moving at the same point. Forbids certain intervals if bass is involved.
 */
export const enforceVerticalConsonanceWithMovingLocal: LocalRule
    = (ctx, s, cur) =>
{
    const pitches: H.Pitch[] = [];
    let bassPitch: H.Pitch | null = null;

    const t = cur.globalTime;
    const lastVoice = s.voices.at(-1);
    for (const voice of s.voices) {
        const n1 = voice.noteAt(t);
        if (!n1?.value.pitch || !n1.globalTime.equals(t) || n1.value.type == 'suspension')
            continue; // not moving

        const n2 = n1.prevGlobal();
        if (!n2?.value.pitch || !n2.value.pitch.equals(n1.value.pitch)) {
            // moving
            pitches.push(n1.value.pitch);
            if (voice === lastVoice) bassPitch = n1.value.pitch;
        }
    }

    for (let i = 0; i < pitches.length - 1; i++)
        for (let j = i+1; j < pitches.length; j++) {
            const a = pitches[i], b = pitches[j];
            const int = a.intervalTo(b);
            if (!isConsonance(int, !!bassPitch && b.equals(bassPitch))) return Infinity;

            // const int = a.intervalTo(b).abs().toSimple({ preserveUpToSteps: 7 });
            // const c2 = ctx.harmonyIntervals.get(int);
            // if (!c2) return Infinity;
            // if (bassPitch
            //  && b.equals(bassPitch)
            //  && ctx.forbidWithBass.has(int)) return Infinity;
        }
    return 0;
};

/**
 * Enforces that the candidates form consonance with voices that are moving at the same point.
 */
export const enforceVerticalConsonanceWithMoving: CandidateRule
    = (ctx, s, cur, c) =>
{
    Debug.assert(c !== null);
    const otherPitches: H.Pitch[] = [];
    let bassPitch: H.Pitch | null = null;

    const tprev = cur.prevGlobal()?.globalTime;
    if (!tprev) return c;

    const t = cur.globalTime;
    const v = cur.parent.container;
    const lastVoice = s.voices.at(-1);
    for (const voice of s.voices) {
        if (voice == v) continue;
        const n1 = voice.noteAt(t);
        if (!n1?.value.pitch || !n1.globalTime.equals(t) || n1.value.type == 'suspension')
            continue;

        const n2 = voice.noteAt(tprev);
        if (!n2 || n2.value.pitch !== n1.value.pitch) {
            // moving
            otherPitches.push(n1.value.pitch);
            if (voice === lastVoice) bassPitch = n1.value.pitch;
        }
    }

    outer: for (const [p, cost] of c.entries()) {
        let newCost = 0;

        for (const x of otherPitches) {
            const int = x.intervalTo(p).abs().toSimple({ preserveUpToSteps: 7 });
            const c2 = ctx.harmonyIntervals.get(int);
            if (!c2 ||
                (bassPitch && (x.equals(bassPitch) || p.equals(bassPitch))
                           && ctx.forbidWithBass.has(int)))
            {
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
            const int = x.absoluteSimpleIntervalTo(p);
            const c2 = ctx.harmonyIntervals.get(int);
            if (c2 === undefined) {
                c.delete(p);
                continue outer;
            }
            newCost += c2 / otherPitches.length;

            if (v == lastVoice
             && ctx.forbidWithBass.has(int))
            {
                c.delete(p);
                continue outer;
            }
        }
        c.set(p, cost + newCost);

        if (bassPitch) {
            const int = bassPitch.absoluteSimpleIntervalTo(p);
            if (ctx.forbidWithBass.has(int)) {
                c.delete(p);
                continue;
            }
        }
    }

    return c;
}
