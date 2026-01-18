import { LocalRule } from "../Context";

/**
 * Assign heuristic costs according to motion type, based on the settings in CounterpointContext.
 */
export const prioritizeVoiceMotion: LocalRule = (ctx, s, x1) => {
    if (s.voices.length <= 1) return 0;

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
    return cost / (s.voices.length - 1);
}
