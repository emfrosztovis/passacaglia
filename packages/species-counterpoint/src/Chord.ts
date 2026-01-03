import { Debug, Hashable, HashMap, modulo, Rational, rotateArray, Serializable, Serialized } from "common";
import { H, I, PC } from "./Internal";
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
         * The list of chord pitches INCLUDING the bass. They must be sorted from lowest to highest.
         */
        public readonly tones: H.Pitch[],
        /**
         * The position number of the chord. This is equal to the index of the root pitch in an arrangement of the chord from the bass upwards. For example, a `position` of 0 means the root position, 1 means the first inversion, etc.
         */
        public readonly position = 0,
        /**
         * A text label showing the quality of the chord.
         */
        public label?: string
    ) {
        Debug.assert(position <= intervals.length);
        Debug.assert(position < tones.length);
        Debug.assert(bass.equals(tones[0]));
    }

    get root() {
        return this.tones[this.position];
    }

    equals(other: Chord) {
        return this.bass.equals(other.bass)
            && this.intervals.length == other.intervals.length
            && !this.intervals.find((x, i) => !x.equals(other.intervals[i]))
            && this.position == other.position;
    }

    hash(): string {
        return `${this.bass.hash()},${this.position},${this.intervals.map((x) => x.hash())}`;
    }

    serialize() {
        return [this.bass.serialize(), this.intervals.map((x) => x.serialize()), this.position, this.label] as const;
    }

    static deserialize([bass, intervals, position, label]: Serialized<Chord>) {
        return Chord.fromIntervals(
            intervals.map(H.Interval.deserialize),
            position,
            H.Pitch.deserialize(bass)).withLabel(label);
    }

    /**
     * Construct a chord from its tones.
     * @param ps the list of pitches. Must be sorted from lowest to highest.
     */
    static fromPitches(ps: H.Pitch[], position = 0): Chord {
        Debug.assert(ps.length > 0);
        const bass = ps[0];
        const ints: H.Interval[] = [];
        const tones: H.Pitch[] = [bass];
        for (const p of ps.slice(1)) {
            const tone = p.withPeriod(p.index <= bass.index ? 1 : 0);
            tones.push(tone);
            ints.push(bass.intervalTo(tone));
        }
        return new Chord(bass, ints, tones, position);
    }

    /**
     * Construct a chord from its intervals.
     * @param ps the list of intervals. Must be simple intervals and sorted from smallest to largest.
     */
    static fromIntervalsStacking(ints: H.Interval[], position = 0, bass: H.Pitch = PC.c): Chord {
        Debug.assert(ints.length > 0);
        const tones: H.Pitch[] = [bass];
        let tone = bass;
        for (const int of ints)
            tones.push(tone = tone.add(int));
        return Chord.fromPitches(tones, position);
    }

    /**
     * Construct a chord from its intervals.
     * @param ps the list of intervals. Must be simple intervals and sorted from smallest to largest.
     */
    static fromIntervals(ints: H.Interval[], position = 0, bass: H.Pitch = PC.c): Chord {
        Debug.assert(ints.length > 0);
        const tones: H.Pitch[] = [bass];
        for (const int of ints)
            tones.push(bass.add(int));
        return new Chord(bass, ints, tones, position);
    }

    contains(p: H.Pitch) {
        const p0 = p.withPeriod(0);
        return !!this.tones.find((x) => x.withPeriod(0).equals(p0));
    }

    enharmonicallyContains(p: H.Pitch) {
        const p0 = p.withPeriod(0);
        return !!this.tones.find((x) => x.withPeriod(0).enharmonicallyEquals(p0));
    }

    withBass(b: H.Pitch) {
        return Chord.fromIntervals(this.intervals, this.position, b).withLabel(this.label);
    }

    withRoot(r: H.Pitch) {
        return this.toPosition(0).withBass(r).toPosition(this.position);
    }

    withLabel(l?: string) {
        this.label = l;
        return this;
    }

    toPosition(n: number) {
        if (n == this.position) return this;

        Debug.assert(n <= this.intervals.length);
        const rotated = rotateArray(this.tones, n - this.position);
        return Chord.fromPitches(rotated, n).withLabel(this.label);
    }

    toString() {
        return this.tones.map((x) => x.toString({ noPeriod: true })).join('|');
        // return this.root.toString({ noPeriod: true }) + (this.label ?? '');
    }
}

export const Chords = {
    major:     Chord.fromIntervalsStacking([I.parse('M3')!, I.parse('m3')!])
                .withLabel(''),
    major6:    Chord.fromIntervalsStacking([I.parse('M3')!, I.parse('m3')!])
                .toPosition(1).withLabel('6'),
    minor:     Chord.fromIntervalsStacking([I.parse('m3')!, I.parse('M3')!])
                .withLabel('m'),
    minor6:    Chord.fromIntervalsStacking([I.parse('m3')!, I.parse('M3')!])
                .toPosition(1).withLabel('m6'),
    dim:       Chord.fromIntervalsStacking([I.parse('m3')!, I.parse('m3')!])
                .withLabel('dim'),
    dim6:      Chord.fromIntervalsStacking([I.parse('m3')!, I.parse('m3')!])
                .toPosition(1).withLabel('dim6'),
    aug:       Chord.fromIntervalsStacking([I.parse('M3')!, I.parse('M3')!])
                .withLabel('aug'),
    dominant7: Chord.fromIntervalsStacking([I.parse('M3')!, I.parse('m3')!, I.parse('m3')!])
                .withLabel('7'),
};

export class ChordElement
    implements DurationalElement, Serializable, Hashable
{
    constructor(
        readonly duration: Rational,
        readonly chord?: Chord
    ) {}

    hash(): string {
        return `${this.duration.hash}:${this.chord?.hash()}`;
    }

    serialize() {
        return [this.duration.serialize(), this.chord?.serialize()] as const;
    }

    static deserialize([d, c]: Serialized<ChordElement>) {
        return new ChordElement(Rational.deserialize(d), c ? Chord.deserialize(c) : undefined);
    }

    toString() {
        return this.chord?.toString() ?? '';
    }
}

export type ChordCursor = SequentialCursor<ChordElement, HarmonyBackground, never>;

export class HarmonyBackground
    extends SequentialContainer<ChordElement>
    implements Serializable, Hashable
{
    constructor(
        readonly scale: H.Scale,
        e: readonly ChordElement[]
    ) {
        super(e);
    }

    hash(): string {
        return this.elements.map((x) => x.hash()).join(';');
    }

    serialize() {
        return [this.scale.serialize(), this.elements.map((x) => x.serialize())] as const;
    }

    static deserialize([scale, e]: Serialized<HarmonyBackground>) {
        return new HarmonyBackground(H.Scale.deserialize(scale), e.map(ChordElement.deserialize));
    }

    replaceChord(i: number, c?: Chord): HarmonyBackground {
        const e = [...this.elements];
        const old = e[i];
        e.splice(i, 1, new ChordElement(old.duration, c));
        return new HarmonyBackground(this.scale, e);
    }
}
