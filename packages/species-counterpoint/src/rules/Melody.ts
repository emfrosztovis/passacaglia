import { Debug, HashMap } from "common";
import { H } from "../Internal";
import { CandidateRule, LocalRule } from "../Context";

/**
 * Only allow melodic intervals specified in CounterpointContext in the melody.
 */
export const enforceMelodyIntervals: CandidateRule = (ctx, _s, cur, c, type) =>
{
    Debug.assert(c !== null);
    if (type == 'suspension') return c;

    const p1 = cur.prevGlobal();
    const prev = p1?.value;
    if (!prev?.pitch) return c;

    const p2 = p1!.prevGlobal();
    const prev2 = p2?.value;

    const v = cur.parent.container;
    let ints = [...ctx.melodicIntervals.entries()];
    if (v.melodySettings?.forbidRepeatedNotes)
        ints = ints.filter(([x, _]) => x.distance.num > 0);

    const sign = (prev2?.pitch && prev2.pitch.ord() > prev.pitch.ord()) ? -1 : 1;

    const nexts = new HashMap<H.Pitch, number>(
        ints.map(([x, cost]) =>
            [prev.pitch!.add(x.withSign((x.sign * sign) as -1 | 1)), cost])
    );

    return c.intersectWith(nexts, (a, b) => a + b);
};

/**
 * Only allow stepwise motion around notes shorter than a quarter note.
 */
export const enforceStepwiseAroundShortNotes: CandidateRule = (ctx, _s, cur, c, type) =>
{
    Debug.assert(c !== null);

    const p1 = cur.prevGlobal();
    const prev = p1?.value.pitch;
    if (!prev) return c;

    if (cur.duration.value() >= 1 && p1.duration.value() >= 1) return c;
    return c.filter((p) => Math.abs(prev.stepsTo(p)) == 1);
};

export const avoidRepeat2: CandidateRule = (ctx, _s, cur, c, attr) =>
{
    Debug.assert(c !== null);

    const p1 = cur.prevGlobal();
    const prev = p1?.value.pitch;
    if (!prev) return c;

    const p2 = p1!.prevGlobal();
    const prev2 = p2?.value.pitch;
    if (!prev2) return c;

    const p3 = p2!.prevGlobal();
    const prev3 = p3?.value.pitch;
    if (!prev3 /*|| !p3.duration.equals(p2.duration)*/) return c;

    if (prev3.equals(prev) /*&& p3.duration.equals(p1.duration)*/) {
        return c.filter((x) => !x.equals(prev2));
    }
    return c;
}
