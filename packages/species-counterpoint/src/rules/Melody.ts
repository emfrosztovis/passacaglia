import { Debug, HashMap } from "common";
import { H } from "../Internal";
import { CandidateRule, LocalRule } from "../Context";

/**
 * Only allow melodic intervals specified in CounterpointContext in the melody.
 */
export const forbidVoiceOverlapping2: CandidateRule = (ctx, s, cur, c, type) =>
{
    Debug.assert(c !== null);

    let upper: number | undefined;
    let lower: number | undefined;

    const iv = cur.parent.container.index;
    const end = cur.globalEndTime.value();
    if (iv > 0) {
        const v = s.voices[iv - 1];
        for (let cur2 = v.noteAt(cur.globalTime);
             cur2 && cur2.globalTime.value() < end;
             cur2 = cur2.nextGlobal())
        {
            const nord = cur2.value.pitch?.ord().value();
            if (!nord) continue;
            if (upper === undefined || nord < upper)
                upper = nord;
        }
    }
    if (iv < s.voices.length - 1) {
        const v = s.voices[iv + 1];
        for (let cur2 = v.noteAt(cur.globalTime);
             cur2 && cur2.globalTime.value() < end;
             cur2 = cur2.nextGlobal())
        {
            const nord = cur2.value.pitch?.ord().value();
            if (!nord) continue;
            if (lower === undefined || nord > lower)
                lower = nord;
        }
    }

    return c.filter((p) => {
        const ord = p.ord().value();
        if (upper !== undefined && ord > upper) return false;
        if (lower !== undefined && ord < lower) return false;
        return true;
    })
}

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

/**
 * Make sure leaps greater than a thrid are prepared by stepwise opposite movement before them.
 */
export const enforceLeapPreparationBefore: CandidateRule = (ctx, _s, cur, c, attr) =>
{
    Debug.assert(c !== null);
    const p1 = cur.prevGlobal();
    const prev = p1?.value.pitch;
    if (!prev) return c;

    const p2 = p1!.prevGlobal();
    const prev2 = p2?.value.pitch;
    if (!prev2) return c;//.filter((x) => prev.intervalTo(x).steps < 3);

    const int0 = prev2.intervalTo(prev);

    return c.filter((x) => {
        const int = prev.intervalTo(x);
        if (int.steps < 3) return true;
        // it's going to be a leap
        return int0.steps == 1 && int.sign == -int0.sign;
    });
};

/**
 * Make sure leaps greater than a thrid are prepared by stepwise opposite movement after them.
 */
export const enforceLeapPreparationAfter: CandidateRule = (ctx, _s, cur, c, attr) =>
{
    Debug.assert(c !== null);

    const p1 = cur.prevGlobal();
    const prev = p1?.value.pitch;
    if (!prev) return c;

    const p2 = p1!.prevGlobal();
    const prev2 = p2?.value.pitch;
    if (!prev2) return c;

    const int0 = prev2.intervalTo(prev);
    if (int0.steps < 3) return c;

    return c.filter((x) => {
        const int = prev.intervalTo(x);
        return int.steps >= 3 || (int.steps == 1 && int.sign == -int0.sign);
    });
};

/**
 * Limit consecutive leaps according to the voice's melodic settings.
 */
export const limitConsecutiveLeaps: LocalRule = (_ctx, _s, x1) => {
    const m = x1.container.melodicContext;
    const settings = x1.parent.container.melodySettings;
    if (!settings) return 0;
    if (m.nConsecutiveLeaps - Math.min(m.n3rdLeaps, settings.maxIgnorable3rdLeaps)
            > settings.maxConsecutiveLeaps
     || m.nUnidirectionalConsecutiveLeaps - Math.min(m.nUnidirectional3rdLeaps, settings.maxUnidirectionalIgnorable3rdLeaps)
            > settings.maxUnidirectionalConsecutiveLeaps)
        return Infinity;
    return 0;
};
