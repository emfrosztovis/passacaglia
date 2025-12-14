import { AsRational, Debug, Hashable, Rational } from "common";
import { PitchSystem } from "./PitchSystem";

export type IntervalConstructor<S extends PitchSystem, I extends Interval<S> = Interval<S>>
    = new (steps: number, distance: AsRational, sign?: 1 | -1) => I;

/**
 * Represents a signed musical interval in a scale system: a 3-tuple (steps, distance, sign).
 */
export abstract class Interval<S extends PitchSystem> implements Hashable {
    /** A nonnegative integer representing the number of steps between the two pitches. E.g. 0 means they share the same degree, 1 means the higher pitch is the next degree. */
    public readonly steps: number;

    /** Number of subdivisions between the two pitches (nonnegative). */
    public readonly distance: Rational;

    /** Sign of the interval. */
    public readonly sign: 1 | -1;

    constructor(
        public readonly system: S,
        steps: number, distance: AsRational, sign: 1 | -1 = 1
    ) {
        Debug.assert(steps >= 0 && Number.isSafeInteger(steps));
        this.steps = steps;
        this.distance = Rational.from(distance);
        Debug.assert(this.distance.num >= 0);
        this.sign = sign;
    }

    protected abstract _create(steps: number, distance: AsRational, sign: 1 | -1): this;

    abstract toAbbreviation(): string;
    abstract toString(): string;

    hash(): string {
        return `${this.sign > 0 ? '+' : '-'}${this.steps},${this.distance.hash()}`;
    }

    equals(other: Interval<S>) {
        return this.sign == other.sign
            && this.steps == other.steps
            && this.distance.equals(other.distance);
    }

    equalsEnharmonically(other: Interval<S>) {
        return this.sign == other.sign
            && this.distance.equals(other.distance);
    }

    add(other: Interval<S>): this {
        const d = this.distance.mul(this.sign).add(other.distance.mul(other.sign));
        const s = this.steps * this.sign + other.steps * other.sign;
        const mostSignful = d.num == 0 ? s : d.num;
        return this._create(Math.abs(s), d.abs(), mostSignful < 0 ? -1 : 1);
    }

    addPeriod(n: number): this {
        if (n == 0) return this;
        const absN = Math.abs(n);
        const offset = this._create(
            this.system.nDegrees * absN,
            this.system.nPitchClasses * absN,
            n < 0 ? -1 : 1
        );
        return this.add(offset);
    }

    /**
     * Reduce compound intervals (i.e. spanning more than one period in the system) to simple intervals.
     */
    toSimple(opt?: { preserveUpToSteps?: number }): this {
        if (this.steps < this.system.nDegrees) return this;
        if (opt?.preserveUpToSteps && this.steps <= opt?.preserveUpToSteps) return this;

        const preservePeriods = opt?.preserveUpToSteps
            ? Math.floor(opt.preserveUpToSteps / this.system.nDegrees)
            : 0;

        let periods = Math.max(0,
            Math.min(
                Math.floor(this.steps / this.system.nDegrees),
                Math.floor(this.distance.div(this.system.nPitchClasses).value())
            ) - preservePeriods);
        let newSteps = this.steps - periods * this.system.nDegrees;

        if (opt?.preserveUpToSteps && newSteps > opt?.preserveUpToSteps) {
            periods += 1;
            newSteps -= this.system.nDegrees;
        }
        Debug.assert(!opt?.preserveUpToSteps || newSteps <= opt.preserveUpToSteps);

        const newDistance = this.distance.sub(periods * this.system.nPitchClasses);
        return this._create(newSteps, newDistance, this.sign);
    }

    /**
     * Returns true if `other` equals `this`, or `other` is larger but reduces to the same simple interval as `this`.
     */
    matches(other: Interval<S>) {
        return other.toSimple().equals(this.toSimple())
            && other.distance.value() >= this.distance.value();
    }

    /**
     * Returns true if `other` equals `this` enharmonically, or `other` is larger but reduces to an enharmonically equivalent simple interval as `this`.
     */
    matchesEnharmonically(other: Interval<S>) {
        return other.toSimple().equalsEnharmonically(this.toSimple())
            && other.distance.value() >= this.distance.value();
    }

    withSign(other: 1 | -1): this {
        return this._create(this.steps, this.distance, other);
    }

    negate(): this {
        return this._create(this.steps, this.distance, this.sign == 1 ? -1 : 1);
    }

    abs(): this {
        return this._create(this.steps, this.distance, 1);
    }
}
