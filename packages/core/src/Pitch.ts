import { AsRational, Debug, Rational } from "common";
import { PitchSystem } from "./PitchSystem";
import { Interval } from "./Interval";
import { modulo } from "./Utils";

export type PitchConstructor<S extends PitchSystem, P extends Pitch<S> = Pitch<S>> = {
    new (deg: number, acci: AsRational, period?: number): P;
    readonly system: S;
}

/**
 * Represents a musical pitch in a scale system: a 3-tuple (degree_index, accidental, period_index). It can also represent a pitch class in some contexts, where the period number is ignored.
 */
export abstract class Pitch<S extends PitchSystem> {
    /** A nonnegative integer representing the degree index. */
    public readonly index: number;

    /** The accidental attached to the pitch. */
    public readonly acci: Rational;

    /** An integer representing the period index. Ignored in contexts where this doesn't exist (pitch classes). */
    public readonly period: number;

    constructor(
        public readonly system: S,
        deg: number, acci: AsRational = 0, period: number = 0
    ) {
        Debug.assert(deg >= 0 && deg < system.nDegrees && Number.isSafeInteger(deg));
        Debug.assert(Number.isSafeInteger(period));
        this.index = deg;
        this.acci = Rational.from(acci);
        this.period = period;
    }

    protected abstract _create(deg: number, acci: AsRational, period: number): this;

    abstract toString(): string;

    equals(other: Pitch<S>): boolean {
        return this.index === other.index
            && this.acci.equals(other.acci)
            && this.period === other.period;
    }

    enharmonicallyEquals(other: Pitch<S>): boolean {
        return this.ord().equals(other.ord());
    }

    add(i: Interval<S>): this {
        const totalSteps = this.period * this.system.nDegrees + this.index + i.steps * i.sign;
        const period = Math.floor(totalSteps / this.system.nDegrees);
        const index = modulo(totalSteps, this.system.nDegrees);

        const withoutAcciOrd = this._create(index, 0, period).ord();
        const targetOrd = this.ord().add(i.distance.mul(i.sign));
        const acci = targetOrd.sub(withoutAcciOrd);
        return this._create(index, acci, period);
    }

    addAccidental(n: AsRational): this {
        return this._create(this.index, this.acci.add(n), this.period);
    }

    withPeriod(p: number): this {
        return this._create(this.index, this.acci, p);
    }

    addPeriod(p: number): this {
        return this._create(this.index, this.acci, this.period + p);
    }

    /**
     * Gets the ordinal number of this pitch.
     */
    ord(): Rational {
        return this.acci
            .add(this.period * this.system.nPitchClasses)
            .add(this.system.degreeOffsets[this.index]);
    }

    /**
     * Calculates the difference between pitches in pitch class units.
     * If `this` is higher than `other`, a negative number will be returned.
     */
    distanceTo(other: Pitch<S>): Rational {
        return other.ord().sub(this.ord());
    }

    /**
     * Calculates the difference between pitches in steps, disregarding
     * accidental marks. If `this` is higher than `other`, a negative number
     * will be returned.
     */
    stepsTo(other: Pitch<S>): number {
        return other.period * this.system.nDegrees + other.index
             - (this.period * this.system.nDegrees + this.index);
    }

    /**
     * Get the interval from `this` to `other`. It will be negative if `this` is higher than `other`.
     */
    abstract intervalTo(other: Pitch<S>): Interval<S>;
}
