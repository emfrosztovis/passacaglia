import { LocalRule } from "../Context";

/**
 * Forbid voice crossing, and optionally (if `allowUnison` is set in the context) also forbid unison.
 */
export const forbidVoiceOverlapping: LocalRule = (ctx, s, cur) => {
    if (!cur.value.pitch) return 0;
    const end = cur.globalEndTime.value();
    const ord = cur.value.pitch.ord().value();

    const iv = cur.parent.container.index;
    if (iv > 0) {
        const v = s.voices[iv - 1];
        for (let cur2 = v.noteAt(cur.globalTime);
             cur2 && cur2.globalTime.value() < end;
             cur2 = cur2.nextGlobal())
        {
            const nord = cur2.value.pitch?.ord().value();
            if (!nord) continue;
            if (nord < ord || (!ctx.allowUnison && nord == ord))
                return Infinity;
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
            if (nord > ord || (!ctx.allowUnison && nord == ord))
                return Infinity;
        }
    }
    return 0;
};

/**
 * Assign heuristic costs according to motion type, based on the settings in CounterpointContext.
 */
export const prioritizeVoiceMotion: LocalRule = (ctx, s, x1) => {
    const x0 = x1.prevGlobal();
    if (!x0?.value.pitch || !x1?.value.pitch) return 0;
    const sign0 = Math.sign(x0.value.pitch.distanceTo(x1.value.pitch).num);

    let cost = 0;
    const v = x1.parent.container;
    for (const voice of s.voices) {
        if (voice == v) continue;
        const n1 = voice.noteAt(x1.globalTime);
        const n0 = n1?.prevGlobal();
        if (!n0?.value.pitch || !n1?.value.pitch) continue;

        const sign1 = Math.sign(n0.value.pitch.distanceTo(n1.value.pitch).num);
        if (sign0 == sign1) cost += ctx.similarMotionCost;
        else if (sign0 == 0 || sign1 == 0) cost += ctx.obliqueMotionCost;
        else cost += ctx.contraryMotionCost;
    }
    return cost;
}
