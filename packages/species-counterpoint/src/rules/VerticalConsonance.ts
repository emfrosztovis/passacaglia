import { Debug } from "common";
import { H } from "../Internal";
import { CandidateRule, LocalRule } from "../Context";
import { isConsonance } from "./Utils";

/**
 * Enforces that the candidates form consonance with voices that are moving at the same point. Forbids certain intervals if bass is involved.
 */
export const enforceVerticalConsonanceWithMovingLocal: LocalRule
    = (_ctx, s, cur) =>
{
    const pitches: H.Pitch[] = [];
    let bassPitch: H.Pitch | null = null;

    const t = cur.globalTime;
    const lastVoice = s.voices.at(-1);
    for (const voice of s.voices) {
        const n1 = voice.noteAt(t);
        if (!n1?.value.pitch || !n1.globalTime.equals(t) || n1.value.type == 'suspension')
            continue; // not moving

        const n2 = n1.prevGlobal();
        if (!n2?.value.pitch || !n2.value.pitch.equals(n1.value.pitch)) {
            // moving
            pitches.push(n1.value.pitch);
            if (voice === lastVoice) bassPitch = n1.value.pitch;
        }
    }

    for (let i = 0; i < pitches.length - 1; i++)
        for (let j = i+1; j < pitches.length; j++) {
            const a = pitches[i], b = pitches[j];
            const int = a.intervalTo(b);
            if (!isConsonance(int, !!bassPitch && b.equals(bassPitch))) return Infinity;
        }
    return 0;
};
