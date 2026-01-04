import { Debug, HashMap } from "common";
import { CandidateRule, HarmonyRule, LocalRule } from "../Context";
import { Chord, Chords } from "../Chord";
import { H, P } from "../Internal";

const permittedChords = [Chords.major, Chords.major6, Chords.minor, Chords.minor6, Chords.dim6];

export const enforceValidChords: HarmonyRule = (_ctx, s, cur, c) => {
    const scale = s.harmony.scale;
    const map = new HashMap<Chord, number>();
    let basses = scale.degrees;
    let notes: H.Pitch[] = [];

    for (const v of s.voices) {
        const m = v.at(cur.index)?.value;
        if (!m) continue;
        let bass: H.Pitch | undefined;
        for (const n of m.elements)
            if (!n.isNonHarmonic && n.pitch) {
                const p = n.pitch.withPeriod(0);
                if (v.index == s.voices.length - 1) {
                    // known bass note
                    if (!bass || bass.ord().value() > p.ord().value())
                        bass = p;
                } else {
                    notes.push(p);
                }
            }
        if (bass) basses = [bass];
    }

    for (const bass of basses) {
        for (const ch of permittedChords) {
            const chord = ch.withBass(bass);
            if (chord.tones.find((x) => !scale.getExactDegree(x))
             || notes.find((x) => !chord.contains(x))) continue;
            map.set(chord, 0);
        }
    }
    if (!c) return map;
    return c.intersectWith(map, (a, b) => a + b);
}

export const enforceChordTone: CandidateRule = (_ctx, s, cur, c) => {
    Debug.assert(c !== null);

    const ch = s.harmony.at(cur.parent.index)?.value.chord;
    Debug.assert(!!ch);

    if (cur.parent.container.index === s.voices.length - 1) {
        // bass voice
        const bass = ch.bass.withPeriod(0);
        return c.filter((p) => p.withPeriod(0).equals(bass));
    }

    // other voices
    return c.filter((p) => ch.contains(p));
}
