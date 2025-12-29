import { Debug } from "common";
import { H, Scales } from "../Common";
import { CandidateRule } from "../Context";
import { HashMap } from "common";

export const enforceScaleTones: (scale: H.Scale) => CandidateRule =
(scale) => (_ctx, _s, cur, c) => {
    const v = cur.parent.container;
    const scaleTones = new HashMap<H.Pitch, number>(
        scale.getDegreesInRange(v.lowerRange, v.higherRange).map((x) => [x.toPitch(), 0]));
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

export const DegreeMatrixPreset = {
    major: {
        upward: new HashMap([
            [ Scales.C.major.at(6), {
                next: parsePreferred(['m2', -50]),
            } ],
        ]),
        downward: new HashMap([
            [ Scales.C.major.at(6), {
                next: parsePreferred(['m2', -30]),
            } ],
            [ Scales.C.major.at(5), {
                next: parsePreferred(['-M2', -20]),
            } ],
            [ Scales.C.major.at(3), {
                next: parsePreferred(['-m2', -10]),
            } ]
        ]),
    } satisfies DegreeMatrix,
}

export const enforceDirectionalDegreeMatrix: (scale: H.Scale, m: DegreeMatrix) => CandidateRule =
(scale, m) => (ctx, s, cur, c) => {
    Debug.assert(c !== null);
    const prev = cur.prev();
    if (!prev?.value.pitch) return c;

    const prev2 = prev.prev();
    if (!prev2?.value.pitch) return c;

    const sign = Math.sign(prev2.value.pitch.distanceTo(prev.value.pitch).value());
    if (sign == 0) return c; // well, should search instead
    const map = sign > 0 ? m.upward : m.downward;

    const deg = scale.getExactDegree(prev.value.pitch);
    if (!deg || !map.has(deg)) return c;
    const pref = map.get(deg)!;

    const nextMap = new HashMap([...pref.next.entries()]
        .map(([x, c]) => [prev.value.pitch!.add(x), c]));

    for (const [p, cost] of nextMap.entries()) {
        const oldCost = c.get(p);
        if (oldCost === undefined) continue;
        if (cost === Infinity) c.delete(p);
        else c.set(p, oldCost + cost);
    }
    if (pref.forbidOther) c.filter((p) => nextMap.has(p));
    return c;
}

export const enforceMinor: (root: H.Pitch) => CandidateRule =
(root) => (_ctx, s, cur, c) => {
    const v = cur.parent.container;
    const scale = H.Scales.completeMinor(root);
    const scaleTones = new HashMap<H.Pitch, number>(
        scale.getDegreesInRange(v.lowerRange, v.higherRange).map((x) => [x.toPitch(), 0]));
    if (c === null) c = scaleTones;

    const n1 = cur.value;
    if (!n1?.pitch) return scaleTones;
    const d1 = scale.getExactDegree(n1.pitch);
    if (!d1) return scaleTones;

    const n0 = cur.prevGlobal()?.value;
    if (!n0?.pitch) return scaleTones;
    const d0 = scale.getExactDegree(n0.pitch);
    if (!d0) return scaleTones;

    if (d1.index == 6) {
        // V - [VI#] - VII#
        if (n0.pitch.intervalTo(n1.pitch).toString() !== 'M2') return new HashMap();
        const target = n1.pitch.add(H.Interval.parse('M2')!);
        return c.filter((x) => x.equals(target));
    }

    if (d1.index == 7) {
        // I - [VIIn] - VIn
        if (n0.pitch.intervalTo(n1.pitch).toString() !== '-M2') return new HashMap();
        const target = n1.pitch.add(H.Interval.parse('-M2')!);
        return c.filter((x) => x.equals(target));
    }

    return c;
}

export const enforcePassingTones: CandidateRule = (_ctx, _s, cur, c) => {
    Debug.assert(c !== null);
    const p1 = cur.prevGlobal();
    const prev = p1?.value;
    if (!prev?.pitch || !prev.attrs.isPassingTone) return c;

    const p2 = p1!.prevGlobal();
    const prev2 = p2?.value;
    Debug.assert(!!(prev2?.pitch));

    const o2 = prev2.pitch.ord().value();
    const o1 = prev.pitch.ord().value();

    return c.filter((p) =>
        Math.sign(o1 - p.ord().value()) == Math.sign(o2 - o1)
     && Math.abs(prev.pitch!.stepsTo(p)) <= 1);
}

export const makePassingTone: CandidateRule = (_ctx, _s, cur, c) => {
    Debug.assert(c !== null);
    const p1 = cur.prevGlobal();
    const prev = p1?.value;
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

export const enforceMelodyIntervals: CandidateRule = (ctx, s, cur, c, attr) =>
{
    Debug.assert(c !== null);
    if (attr.isPassingTone && ctx.allowChromaticPassingTones)
        return c;

    const p1 = cur.prevGlobal();
    const prev = p1?.value;
    if (!prev?.pitch) return c;

    const p2 = p1!.prevGlobal();
    const prev2 = p2?.value;

    const sign = (prev2?.pitch && prev2.pitch.ord() > prev.pitch.ord()) ? -1 : 1;
    const nexts = new HashMap<H.Pitch, number>(
        [...ctx.melodicIntervals.entries()].map(([x, cost]) =>
            [prev.pitch!.add(x.withSign((x.sign * sign) as -1 | 1)), cost])
    );

    return c.intersectWith(nexts, (a, b) => a + b);
};

/**
 * Enforces that the candidates form consonance with voices that are moving at the same point.
 */
export const enforceVerticalConsonanceWithMoving: CandidateRule
    = (ctx, s, cur, c) =>
{
    Debug.assert(c !== null);
    const otherPitches: H.Pitch[] = [];

    const t = cur.globalTime;
    const v = cur.parent.container;
    for (const voice of s.voices) {
        if (voice == v) continue;
        const n = voice.noteAt(t);
        if (!n || !n.value.pitch) continue;

        const prev = n.prev();
        if (!prev || prev.value.pitch !== n.value.pitch) {
            // moving
            otherPitches.push(n.value.pitch);
        }
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

