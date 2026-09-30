import { AsRational, Debug, Hashable, Rational } from "common";
import { Pitch, PitchConstructor, PitchSystem } from "core";

/**
 * Represents a pitch class in a pitch system as a rational number of subdivisions, i.e. without regard to enharmonic accidentals.
 */
export class EnharmonicPitchClass<S extends PitchSystem> implements Hashable {
    protected constructor(readonly system: S, readonly pc: Rational) {
        Debug.assert(this.pc.value() >= 0 && this.pc.value() < system.nPitchClasses);
    }

    hash(): string {
        return this.pc.hash();
    }

    static from<S extends PitchSystem>(system: S, value: AsRational) {
        return new EnharmonicPitchClass(system, Rational.from(value).modulo(system.nPitchClasses));
    }

    static fromPitch<S extends PitchSystem>(p: Pitch<S>) {
        return new EnharmonicPitchClass(p.system, p.ord().modulo(p.system.nPitchClasses));
    }

    /** Transpose. */
    transpose(by: AsRational) {
        return new EnharmonicPitchClass(this.system,
            this.pc.add(by).modulo(this.system.nPitchClasses));
    }

    /** Multiply. */
    multiply(by: AsRational) {
        return new EnharmonicPitchClass(this.system,
            this.pc.mul(by).modulo(this.system.nPitchClasses));
    }

    toPitch<P extends Pitch<S>>(P: PitchConstructor<S, P>, dir: 'flat' | 'sharp'): P {
        let deg = -1, off: Rational | undefined;
        for (const offset of this.system.degreeOffsets) {
            if (offset.value() > this.pc.value()) break;
            deg++; off = offset;
        }
        Debug.assert(deg >= 0 && !!off);
        if (this.pc.equals(off)) return new P(deg, 0, 0);
        if (dir == 'sharp') return new P(deg, this.pc.sub(off), 0);
        if (deg == this.system.nDegrees - 1)
            return new P(0, this.pc.sub(this.system.nPitchClasses), 0);
        return new P(deg + 1, this.pc.sub(this.system.degreeOffsets[deg + 1]), 0)
    }
}
