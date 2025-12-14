import { Debug } from "common";
import { H } from "../Common";
import { CandidateRule } from "../Context";
import { PitchMap } from "core";

export const enforceScaleTones: CandidateRule = (ctx, _s, v, _t, c) => {
    const scaleTones = new PitchMap<H.Pitch, number>(
        ctx.scale.getDegreesInRange(v.lowerRange, v.higherRange).map((x) => [x.toPitch(), 0]));
    if (!c) return scaleTones;
    return c.intersectWith(scaleTones);
}

export const enforcePassingTones: CandidateRule = (_ctx, s, v, t, c) => {
    Debug.assert(c !== null);
    const prev = s.noteBefore(t, v.index);
    if (!prev?.pitch || !prev?.isPassingTone) return c;

    const prev2 = s.noteBefore(prev.globalPosition, v.index);
    Debug.assert(!!(prev2?.pitch));

    const o2 = prev2.pitch.ord().value();
    const o1 = prev.pitch.ord().value();

    const d = prev2.pitch.stepsTo(prev.pitch);
    Debug.assert(Math.abs(d) == 1);

    return c.filter((p) => {
        if (Math.sign(o1 - p.ord().value()) != Math.sign(o2 - o1)) return false;
        if (prev.pitch!.stepsTo(p) == d) {
            // Debug.info(`passing tone from ${prev2.pitch} thru ${prev.pitch} to ${p}`);
            return true;
        }
        return false;
    });
}

export const makePassingTone: CandidateRule = (_ctx, s, v, t, c) => {
    Debug.assert(c !== null);
    const prev = s.noteBefore(t, v.index);
    if (!prev?.pitch) return c;

    return c.filter((p) => {
        return Math.abs(prev.pitch!.stepsTo(p)) == 1;
    });
}

type PreferredInterval = readonly [p: H.Interval, cost: number];

export function parsePreferred(...ps: readonly [ex: string, cost: number][]): PreferredInterval[] {
    return ps.map((x) => {
        const i = H.Interval.parse(x[0]);
        Debug.assert(i !== null);
        return [i, x[1]];
    });
}

export const enforceMelodyIntervals: CandidateRule = (ctx, s, v, t, c) =>
{
    Debug.assert(c !== null);
    const prev = s.noteBefore(t, v.index);
    if (!prev?.pitch) return c;

    const prev2 = s.noteBefore(prev.globalPosition, v.index);
    let sign = 1;
    if (prev2?.pitch && prev2.pitch.ord() > prev.pitch.ord())
        sign = -1;

    const nexts = new PitchMap<H.Pitch, number>(
        ctx.melodicIntervals.map(([x, cost]) =>
            [prev.pitch!.add(x.withSign((x.sign * sign) as -1 | 1)), cost])
    );

    return c.intersectWith(nexts, (a, b) => a + b);
};

export const enforceHarmonyIntervals: CandidateRule
    = (ctx, s, v, t, c) =>
{
    Debug.assert(c !== null);
    const otherPitches: H.Pitch[] = [];
    let bassPitch: H.Pitch | undefined;
    for (let i = 0; i < s.voices.length; i++) {
        if (i == v.index) continue;
        const n = s.noteAt(t, i);
        if (!n?.pitch) continue;
        otherPitches.push(n.pitch);
        if (i == s.voices.length - 1)
            bassPitch = n.pitch;
    }
    for (const [p, _] of c.entries()) {
        if (otherPitches.find((x) => !ctx.harmonyIntervals.find(
            ([i, _]) => x.intervalTo(p).toSimple().equals(i))))
                c.delete(p);

        if (bassPitch) {
            const int = bassPitch.intervalTo(p).toSimple();
            if (ctx.forbidWithBass.find((x) => x.equals(int)))
                c.delete(p);
        }
    }

    return c;
}
