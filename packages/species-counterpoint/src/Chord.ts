import { Debug, Hashable, HashMap, modulo, Rational, rotateArray, Serializable, Serialized } from "common";
import { H } from "./Internal";
import { DurationalElement, SequentialContainer, SequentialCursor } from "core";

/**
 * A common-practice chord, defined by a bass pitch and a list of intervals above it.
 */
export class Chord implements Serializable, Hashable {
    protected constructor(
        /**
         * The lowest pitch or pitch class of the chord.
         */
        public readonly bass: H.Pitch,
        /**
         * The list of intervals of chord tones above the bass. These should be simple intervals, and they must be sorted from smallest to largest.
         */
        public readonly intervals: H.Interval[],
        /**
         * The list of chord pitches above the bass. They must be sorted from lowest to highest.
         */
        public readonly tones: H.Pitch[],
        /**
         * The position number of the chord. This is equal to the index of the root pitch in an arrangement of the chord from the bass upwards. For example, a `position` of 0 means the root position, 1 means the first inversion, etc.
         */
        public readonly position = 0,
    ) {
        Debug.assert(position <= intervals.length);
    }

    hash(): string {
        return `${this.bass.hash()},${this.position},${this.intervals.map((x) => x.hash())}`;
    }

    serialize() {
        return [this.bass.serialize(), this.intervals.map((x) => x.serialize()), this.position] as const;
    }

    static deserialize([bass, intervals, position]: Serialized<Chord>) {
        return Chord.fromIntervals(
            H.Pitch.deserialize(bass),
            intervals.map(H.Interval.deserialize),
            position);
    }

    /**
     * Construct a chord from its tones.
     * @param ps the list of pitches. Must be sorted from lowest to highest.
     */
    static fromPitches(ps: H.Pitch[], position = 0): Chord {
        Debug.assert(ps.length > 0);
        const bass = ps[0];
        const ints: H.Interval[] = [];
        const pitches: H.Pitch[] = [];
        for (let i = 1; i < ps.length; i++) {
            const p = ps[i];
            const tone = p.withPeriod(p.index <= bass.index ? 1 : 0);
            ps.push(tone);
            ints.push(bass.intervalTo(tone));
        }
        return new Chord(bass, ints, pitches, position);
    }

    /**
     * Construct a chord from its intervals.
     * @param ps the list of intervals. Must be simple intervals and sorted from smallest to largest.
     */
    static fromIntervals(bass: H.Pitch, ints: H.Interval[], position = 0): Chord {
        Debug.assert(ints.length > 0);
        const pitches: H.Pitch[] = [];
        let tone = bass;
        for (const int of ints) {
            tone = tone.add(int);
            pitches.push(tone);
        }
        return new Chord(bass, ints, pitches, position);
    }

    contains(p: H.Pitch) {
        const p0 = p.withPeriod(0);
        if (this.bass.withPeriod(0).equals(p0)) return true;
        return !!this.tones.find((x) => x.withPeriod(0).equals(p0));
    }

    enharmonicallyContains(p: H.Pitch) {
        const p0 = p.withPeriod(0);
        if (this.bass.withPeriod(0).enharmonicallyEquals(p0)) return true;
        return !!this.tones.find((x) => x.withPeriod(0).enharmonicallyEquals(p0));
    }

    withBass(b: H.Pitch) {
        return Chord.fromIntervals(b, this.intervals, this.position);
    }

    withRoot(r: H.Pitch) {
        return this.toPosition(0).withBass(r).toPosition(this.position);
    }

    getTone(n: number) {
        return this.bass.add(this.intervals[n]);
    }

    toPosition(n: number) {
        if (n == this.position) return this;

        Debug.assert(n <= this.intervals.length);
        const tones: H.Pitch[] = [this.bass];
        for (const i of this.intervals)
            tones.push(this.bass.add(i));
        return Chord.fromPitches(rotateArray(tones, n - this.position));
    }
}

export class ChordElement implements DurationalElement, Serializable {
    constructor(
        readonly duration: Rational,
        readonly chord?: Chord
    ) {}

    serialize() {
        return [this.duration.serialize(), this.chord?.serialize()] as const;
    }

    static deserialize([d, c]: Serialized<ChordElement>) {
        return new ChordElement(Rational.deserialize(d), c ? Chord.deserialize(c) : undefined);
    }
}

export type ChordCursor = SequentialCursor<ChordElement, HarmonyBackground, never>;

export class HarmonyBackground extends SequentialContainer<ChordElement> implements Serializable {
    constructor(e: readonly ChordElement[]) {
        super(e);
    }

    serialize() {
        return this.elements.map((x) => x.serialize());
    }

    static deserialize(e: Serialized<HarmonyBackground>) {
        return new HarmonyBackground(e.map(ChordElement.deserialize));
    }

    replaceChord(i: number, c?: Chord): HarmonyBackground {
        const e = [...this.elements];
        const old = e[i];
        e.splice(i, 1, new ChordElement(old.duration, c));
        return new HarmonyBackground(e);
    }
}
