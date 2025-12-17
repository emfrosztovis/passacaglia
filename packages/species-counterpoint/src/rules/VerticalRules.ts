import { H } from "../Common";
import { LocalRule } from "../Context";

export const forbidVoiceOverlapping: LocalRule = (ctx, s, v, t) => {
    const x1 = s.noteAt(t, v.index);
    if (!x1?.pitch) return 0;
    const end = x1.globalPosition.add(x1.length);
    const ord = x1.pitch.ord();

    if (v.index > 0) {
        const ns = s.noteBetween(x1.globalPosition, end, v.index - 1);
        for (const n1 of ns) {
            const nord = n1.pitch?.ord();
            if (nord && (nord < ord || (!ctx.allowUnison && nord == ord)))
                return Infinity;
        }
    }
    if (v.index < s.voices.length - 1) {
        const ns = s.noteBetween(x1.globalPosition, end, v.index + 1);
        for (const n1 of ns) {
            const nord = n1.pitch?.ord();
            if (nord && (nord > ord || (!ctx.allowUnison && nord == ord)))
                return Infinity;
        }
    }
    return 0;
};

function isPerfectConsonance(i: H.Interval) {
    const simple = i.abs().toSimple().distance;
    return simple.equals(0) || simple.equals(7) || simple.equals(12);
}

export const forbidPerfectsBySimilarMotion: LocalRule = (_ctx, s, v, t) => {
    const x0 = s.noteBefore(t, v.index);
    const x1 = s.noteAt(t, v.index);
    if (!x0?.pitch || !x1?.pitch) return 0;
    const sign0 = Math.sign(x0.pitch.distanceTo(x1.pitch).num);

    for (let i = 0; i < s.voices.length; i++) {
        if (i == v.index) continue;
        const n0 = s.noteBefore(t, i);
        const n1 = s.noteAt(t, i);
        if (!n0?.pitch || !n1?.pitch) continue;
        if (n0.globalPosition.add(n0.length).value() < x0.globalPosition.value()) continue;

        // similar motion?
        const sign1 = Math.sign(n0.pitch.distanceTo(n1.pitch).num);
        if (sign0 == sign1 && sign0 == 0) continue;

        const d0 = x0.pitch.intervalTo(n0.pitch);
        const d1 = x1.pitch.intervalTo(n1.pitch);
        if ((sign0 == sign1 || isPerfectConsonance(d0)) && isPerfectConsonance(d1))
            return Infinity;
    }
    return 0;
};

export const prioritizeVoiceMotion: LocalRule = (ctx, s, v, t) => {
    const x0 = s.noteBefore(t, v.index);
    const x1 = s.noteAt(t, v.index);
    if (!x0?.pitch || !x1?.pitch) return 0;
    const sign0 = Math.sign(x0.pitch.distanceTo(x1.pitch).num);

    let cost = 0;
    for (let i = 0; i < s.voices.length; i++) {
        if (i == v.index) continue;
        const n0 = s.noteBefore(t, i);
        const n1 = s.noteAt(t, i);
        if (!n0?.pitch || !n1?.pitch) continue;

        const sign1 = Math.sign(n0.pitch.distanceTo(n1.pitch).num);
        if (sign0 == sign1) cost += ctx.similarMotionCost;
        else if (sign0 == 0 || sign1 == 0) cost += ctx.obliqueMotionCost;
        else cost += ctx.contraryMotionCost;
    }
    return cost;
}
