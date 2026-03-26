import { Debug, HashMap } from "common";
import { HarmonyRule } from "../Context";
import { Chord, Chords } from "../Chord";
import { H } from "../Internal";

function getDegreeTriads(i: number, scale: H.Scale) {
    const t1 = scale.at(i),
          t2 = t1.next().next(),
          t3 = t2.next().next();
    const chord = Chord.fromPitches([t1.toPitch(), t2.toPitch(), t3.toPitch()]);
    return [chord, chord.toPosition(1)];
}

function triads(array: number[], scale: H.Scale, c: HashMap<Chord, number> | null) {
    const map = new HashMap(array.flatMap((x) => getDegreeTriads(x, scale)).map((x) => [x, 0]));
    return c ? c.intersectWith(map) : map;
}

export const enforceFunctionalProgressionMajor: HarmonyRule = (_ctx, s, cur, c) => {
    const scale = s.harmony.scale;

    const prev = cur.prev()?.value.chord;
    if (!prev) {
        // start with the tonic
        const tonic = Chords.major.withRoot(scale.root)
        return c ? c.filter((x) => x.equals(tonic)) : new HashMap([[tonic, 0]]);
    }

    const deg = scale.getExactDegree(prev.root);
    if (!deg)
        return new HashMap();

    switch (deg.index) {
        case 0: return triads([0, 1, 2, 3, 4, 5], scale, c); // I
        case 1: return triads([4, 6], scale, c); // ii
        case 2: return triads([3, 5], scale, c); // iii
        case 3: return triads([0, 1, 4, 6], scale, c); // IV
        case 4: return triads([0, 5], scale, c); // V
        case 5: return triads([1, 3, 4], scale, c); // vi
        case 6: return triads([0, 5], scale, c); // vii
        default:
            Debug.assert(false);
    }
}
