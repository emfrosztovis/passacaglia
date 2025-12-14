import { Debug } from "common";
import { H } from "../Common";
import { CandidateRule } from "../Context";
import { HashMap } from "common";

export const enforceScaleTones: CandidateRule = (ctx, _s, v, _t, c) => {
    const scaleTones = new HashMap<H.Pitch, number>(
        ctx.scale.getDegreesInRange(v.lowerRange, v.higherRange).map((x) => [x.toPitch(), 0]));
    if (!c) return scaleTones;
    return c.intersectWith(scaleTones);
}

export type DegreeMatrix = {
    upward: HashMap<H.Degree, {
        next: PreferredIntervals,
        forbidOther?: boolean
    }>,
    downward: HashMap<H.Degree, {
        next: PreferredIntervals,
        forbidOther?: boolean
    }>,
};

export const enforceDirectionalDegreeMatrix: (m: DegreeMatrix) => CandidateRule =
(m) => (ctx, s, v, t, c) => {
    Debug.assert(c !== null);
    const prev = s.noteBefore(t, v.index);
    if (!prev?.pitch) return c;

    const prev2 = s.noteBefore(prev.globalPosition, v.index);
    if (!prev2?.pitch) return c;

    const sign = Math.sign(prev2.pitch.distanceTo(prev.pitch).value());
    if (sign == 0) return c; // well, should search instead
    const map = sign > 0 ? m.upward : m.downward;

    const deg = ctx.scale.getExactDegree(prev.pitch);
    if (!deg || !map.has(deg)) return c;
    const pref = map.get(deg)!;

    const nextMap = new HashMap([...pref.next.entries()]
        .map(([x, c]) => [prev.pitch!.add(x), c]));

    for (const [p, cost] of nextMap.entries()) {
        const oldCost = c.get(p);
        if (oldCost === undefined) continue;
        if (cost === Infinity) c.delete(p);
        else c.add(p, oldCost + cost);
    }
    if (pref.forbidOther) c.filter((p) => nextMap.has(p));
    return c;
}

export const enforcePassingTones: CandidateRule = (_ctx, s, v, t, c) => {
    Debug.assert(c !== null);
    const prev = s.noteBefore(t, v.index);
    if (!prev?.pitch || !prev?.isPassingTone) return c;

    const prev2 = s.noteBefore(prev.globalPosition, v.index);
    Debug.assert(!!(prev2?.pitch));

    const o2 = prev2.pitch.ord().value();
    const o1 = prev.pitch.ord().value();

    return c.filter((p) => {
        if (Math.sign(o1 - p.ord().value()) != Math.sign(o2 - o1)) return false;
        if (Math.abs(prev.pitch!.stepsTo(p)) <= 1) {
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
        const dist = prev.pitch!.distanceTo(p).abs().value();
        return Math.abs(prev.pitch!.stepsTo(p)) <= 1 && dist > 0 && dist <= 2;
    });
}

type PreferredIntervals = HashMap<H.Interval, number>;

export function parsePreferred(...ps: readonly [ex: string, cost: number][]): PreferredIntervals {
    return new HashMap(ps.map((x) => {
        const i = H.Interval.parse(x[0]);
        Debug.assert(i !== null);
        return [i, x[1]];
    }));
}

export const enforceMelodyIntervals: CandidateRule = (ctx, s, v, t, c, attr) =>
{
    Debug.assert(c !== null);
    if (attr.isPassingTone && ctx.allowChromaticPassingTones)
        return c;

    const prev = s.noteBefore(t, v.index);
    if (!prev?.pitch) return c;

    const prev2 = s.noteBefore(prev.globalPosition, v.index);
    let sign = 1;
    if (prev2?.pitch && prev2.pitch.ord() > prev.pitch.ord())
        sign = -1;

    const nexts = new HashMap<H.Pitch, number>(
        [...ctx.melodicIntervals.entries()].map(([x, cost]) =>
            [prev.pitch!.add(x.withSign((x.sign * sign) as -1 | 1)), cost])
    );

    return c.intersectWith(nexts, (a, b) => a + b);
};

export const enforceHarmonyIntervals: CandidateRule
    = (ctx, s, v, t, c) =>
{
    Debug.assert(c !== null);
    const otherPitches: H.Pitch[] = [];

    let bassPitch: H.Pitch | null = null;
    for (let i = 0; i < s.voices.length; i++) {
        if (i == v.index) continue;
        const n = s.noteAt(t, i);
        if (!n?.pitch) continue;
        otherPitches.push(n.pitch);
        if (i == s.voices.length - 1)
            bassPitch = n.pitch;
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

            if (v.index == s.voices.length - 1
             && ctx.forbidWithBass.find((f) => f.equals(int)))
            {
                c.delete(p);
                continue outer;
            }
        }
        c.add(p, cost + newCost);

        if (bassPitch) {
            const int = bassPitch.intervalTo(p).toSimple();
            if (ctx.forbidWithBass.find((f) => f.equals(int))) {
                c.delete(p);
                continue outer;
            }
        }
    }

    return c;
}
