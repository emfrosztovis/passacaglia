import { AsRational, Debug, Rational } from "common";
import { PitchSystem } from "./PitchSystem";
import { Scale } from "./Scale";
import { Pitch } from "./Pitch";

/**
 * Represents a degree in a scale, in a pitch system. It has no period information attached.
 */
export abstract class Degree<S extends PitchSystem> {
    /** The index of the degree. */
    public readonly index: number;

    /** The accidental attached to the degree. */
    public readonly acci: Rational;

    constructor(
        public readonly pitchSystem: S,
        public readonly scale: Scale<S>,
        index: number,
        acci: AsRational
    ) {
        Debug.assert(Number.isSafeInteger(index));
        Debug.assert(index >= 0 && index < scale.degrees.length);
        this.index = index;
        this.acci = Rational.from(acci);
    }

    protected abstract _create(index: number, acci: AsRational): this;

    abstract toString(): string;

    toPitch(p = 0): Pitch<S> {
        return this.scale.degrees[this.index]
            .addAccidental(this.acci).withPeriod(p);
    }
}
