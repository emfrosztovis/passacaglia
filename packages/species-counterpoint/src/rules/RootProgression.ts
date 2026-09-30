import { HashMap } from "common";
import { Chord, Chords } from "../Chord";
import { HarmonyRule } from "../Context";
import { H } from "../Internal";

export const enforceRootProgression: (i: H.Interval[], c: Chord[]) => HarmonyRule
= (rootIntervals, chords) => (_ctx, s, cur, c) => {
    const scale = s.harmony.scale;

    const prev = cur.prev()?.value.chord;
    if (!prev) {
        // start with the tonic
        const tonicMajor = Chords.major.withRoot(scale.root);
        const tonicMinor = Chords.minor.withRoot(scale.root);
        return c
            ? c.filter((x) => x.equals(tonicMajor) || x.equals(tonicMinor))
            : new HashMap([[tonicMajor, 0], [tonicMinor, 0]]);
    }

    const newChords = new HashMap(rootIntervals.flatMap(
        (int) => chords.map((c) => [c.withRoot(prev.root.add(int)), 0] as const)
            .filter(([chord]) => !chord.tones.find((x) => !scale.getExactDegree(x)))));
    return c ? c.intersectWith(newChords) : newChords;
}
