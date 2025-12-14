import { AsRational, Debug } from "common";
import { Interval } from "./Interval";
import { Pitch } from "./Pitch";
import { PitchSystem } from "./PitchSystem";
import { Degree } from "./Degree";
import { rotateArray } from "./Utils";

/**
 * Represents a scale in a pitch system, starting from a given pitch class (the root) and consisting of several degrees. Notably, we allow enharmonically equal tones in the scale. This is to accomodate spelling alternatives (as in the chromatic scale).
 */
export abstract class Scale<S extends PitchSystem> {
    /** List of degrees. Always non-decreasing and spans less than the system's period. The first degree is the root. */
    public readonly degrees: readonly Pitch<S>[];

    /** List of intervals. Always nonnegative. */
    public readonly intervals: readonly Interval<S>[];

    public get root() {
        return this.degrees[0];
    }

    protected constructor(
        public readonly system: S,
        ints: readonly Interval<S>[],
        degs: readonly Pitch<S>[],
    ) {
        Debug.assert(ints.length > 0 && ints.length == degs.length)
        this.intervals = ints;
        this.degrees = degs;
    }

    protected abstract _create(ints: readonly Interval<S>[], degs: readonly Pitch<S>[]): this;
    protected abstract _createDegree(index: number, acci: AsRational, period: number): Degree<S>;

    abstract parseDegree(ex: string): Degree<S> | null;

    equals(other: Scale<S>): boolean {
        return this.root.equals(other.root) && this.intervalEquals(other);
    }

    intervalEquals(other: Scale<S>): boolean {
        return other.intervals.length == this.intervals.length
            && other.intervals.findIndex((x, i) => !x.equals(this.intervals[i])) < 0;
    }

    /**
     * Get the degree at an index and optionally with an accidental.
     */
    at(i: number, acci: AsRational = 0) {
        return this._createDegree(i, acci, 0);
    }

    getDegreesInRange(l: Pitch<S>, h: Pitch<S>): Degree<S>[] {
        const result: Degree<S>[] = [];
        let current = this.at(0).withPeriod(l.period - 1);
        while (current.toPitch().ord().value() < l.ord().value()) {
            current = current.next();
        }
        while (current.toPitch().ord().value() <= h.ord().value()) {
            result.push(current);
            current = current.next();
        }
        return result;
    }

    getExactDegree(p: Pitch<S>, opt?: { allowEnharmonic?: boolean }): Degree<S> | null {
        p = p.withPeriod(0);
        const i = opt?.allowEnharmonic
            ? this.degrees.findIndex((x) => x.withPeriod(0).enharmonicallyEquals(p))
            : this.degrees.findIndex((x) => x.withPeriod(0).equals(p));
        if (i < 0) return null;
        return this.at(i);
    }

    rotate(n: number, opt?: { moveRoot?: boolean }) {
        Debug.assert(Number.isSafeInteger(n));
        const newIntervals = rotateArray(this.intervals, n);

        let current = this.root;
        if (opt?.moveRoot) {
            n = Math.abs(n) % this.degrees.length * (n < 0 ? -1 : 1);
            current = this.degrees.at(n)!.withPeriod(0);
        }
        const newDegs = [current];
        for (const int of newIntervals.slice(0, newIntervals.length - 1)) {
            current = current.add(int);
            newDegs.push(current);
        }
        return this._create(newIntervals, newDegs);
    }

    /**
     * Transpose the scale by an interval.
     */
    transpose(int: Interval<S>): this {
        const newRoot = this.root.add(int);
        if (newRoot.period != 0)
            int = int.addPeriod(-newRoot.period);

        // the intervals don't change
        return this._create(this.intervals, this.degrees.map((x) => x.add(int)));
    }

    /**
     * Transpose the scale so that its root becomes `newRoot`.
     */
    transposeTo(newRoot: Pitch<S>): this {
        const int = this.root.intervalTo(newRoot.withPeriod(0));
        return this.transpose(int);
    }
}
