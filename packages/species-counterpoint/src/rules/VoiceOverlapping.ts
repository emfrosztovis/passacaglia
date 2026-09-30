import { Debug } from "common";
import { CandidateRule } from "../Context";

/**
 * Forbid voice crossing, and optionally (if `allowUnison` is set in the context) also forbid unison.
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

        const before = v.noteAt(cur.globalTime)?.prevGlobal();
        if (before) {
            const v = before.value.pitch?.ord().value();
            if (v && (upper === undefined || v < upper))
                upper = v - (ctx.allowUnison ? 1 : 0);
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

        const before = v.noteAt(cur.globalTime)?.prevGlobal();
        if (before) {
            const v = before.value.pitch?.ord().value();
            if (v && (lower === undefined || v > lower))
                lower = v + (ctx.allowUnison ? 1 : 0);
        }
    }

    return c.filter((p) => {
        const ord = p.ord().value();
        if (upper !== undefined && (ord > upper || (!ctx.allowUnison && ord == upper)))
            return false;
        if (lower !== undefined && (ord < lower || (!ctx.allowUnison && ord == lower)))
            return false;
        return true;
    })
}
