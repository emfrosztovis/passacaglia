import { Rational } from "common";
import { H, Score } from "./Common";
import { CounterpointContext, LocalRule } from "./Context";

export const forbidVoiceOverlapping: LocalRule =
    (_ctx: CounterpointContext, s: Score, iv: number, t: Rational) =>
{
    const x1 = s.noteAt(t, iv);
    if (!x1?.pitch) return null;
    const ord = x1.pitch.ord();

    if (iv > 0) {
        const n1 = s.noteAt(x1.globalPosition, iv - 1);
        if (n1?.pitch && n1.pitch.ord() <= ord) return `voice overlap between upper, ${iv}`;
    }
    if (iv < s.voices.length - 1) {
        const n1 = s.noteAt(x1.globalPosition, iv + 1);
        if (n1?.pitch && n1.pitch.ord() >= ord) return `voice overlap between lower, ${iv}`;
    }
    return null;
};

function isPerfectConsonance(i: H.Interval) {
    const simple = i.abs().toSimple().distance;
    return simple.equals(7) || simple.equals(12);
}

export const forbidPerfectsBySimilarMotion: LocalRule =
    (_ctx: CounterpointContext, s: Score, iv: number, t: Rational) =>
{
    const x0 = s.noteBefore(t, iv);
    const x1 = s.noteAt(t, iv);
    if (!x0?.pitch || !x1?.pitch) return null;
    const sign0 = Math.sign(x0.pitch.distanceTo(x1.pitch).num);
    if (sign0 == 0) return null;

    for (let i = 0; i < s.voices.length; i++) {
        if (i == iv) continue;
        const n0 = s.noteBefore(t, i);
        const n1 = s.noteAt(t, i);
        if (!n0?.pitch || !n1?.pitch) continue;
        if (n0.globalPosition.add(n0.length).value() < x0.globalPosition.value()) continue;

        // similar motion only
        const sign1 = Math.sign(n0.pitch.distanceTo(n1.pitch).num);
        if (sign1 !== sign0) continue;

        const d0 = x0.pitch.intervalTo(n0.pitch);
        const d1 = x1.pitch.intervalTo(n1.pitch);
        if (isPerfectConsonance(d1))
            return `P5/P8 by parallel motion between ${i}, ${iv}`;
    }
    return null;
};
