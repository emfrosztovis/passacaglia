import { AsRational, Debug, Rational } from "common";
import { PitchSystem } from "./PitchSystem";
import { Scale } from "./Scale";
import { Pitch } from "./Pitch";

/**
 * Represents a degree in a scale, in a pitch system.
 */
export abstract class Degree<S extends PitchSystem> {
    /** The index of the degree. */
    public readonly index: number;

    /** The accidental attached to the degree. */
    public readonly acci: Rational;

    /** An integer representing the period index. Ignored in contexts where this doesn't exist. */
    public readonly period: number;

    constructor(
        public readonly pitchSystem: S,
        public readonly scale: Scale<S>,
        index: number,
        acci: AsRational,
        period: number,
    ) {
        Debug.assert(Number.isSafeInteger(index));
        Debug.assert(index >= 0 && index < scale.degrees.length);
        this.index = index;
        this.acci = Rational.from(acci);
        this.period = period;
    }

    protected abstract _create(index: number, acci: AsRational, period: number): this;

    abstract toString(): string;

    withPeriod(p: number) {
        return this._create(this.index, this.acci, p);
    }

    toPitch(): Pitch<S> {
        return this.scale.degrees[this.index]
            .addAccidental(this.acci).addPeriod(this.period);
    }

    next(): Degree<S> {
        const i = this.index + 1;
        if (i >= this.scale.degrees.length)
            return this._create(i - this.scale.degrees.length, this.acci, this.period + 1);
        else
            return this._create(i, this.acci, this.period);
    }

    previous(): Degree<S> {
        const i = this.index - 1;
        if (i < 0)
            return this._create(i + this.scale.degrees.length, this.acci, this.period - 1);
        else
            return this._create(i, this.acci, this.period);
    }
}
