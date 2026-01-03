import { AsRational, Rational, Serializable, Serialized } from "common";
import { _System, StandardHeptatonicSystem } from "./System";
import { _Interval } from "./Interval";
import { ET12Pitch } from "../ET12/Pitch";
import { Accidental } from "./Accidental";

/**
 * A pitch in the standard heptatonic system. The `period` corresponds to the octave number in scientific notation.
 */
export class _Pitch
    extends ET12Pitch<StandardHeptatonicSystem>
    implements Serializable
{
    // static readonly system = _System;

    constructor(deg: number, acci: AsRational = 0, period: number = 0) {
        super(_System, deg, acci, period);
    }

    serialize() {
        return [this.index, this.acci.serialize(), this.period] as const;
    }

    static deserialize([index, acci, period]: Serialized<_Pitch>) {
        return new _Pitch(index, Rational.deserialize(acci), period);
    }

    /**
     * Parses a string expression of pitch, in the format of note name + accidental + single-digit octave number.
     *
     * For accidentals, use `s` for sharps and `f` for flats. For more than one sharps or flats, either duplicate the letter or add a number like `3f`. For microtonal accidentals, write out a fraction like `3/4s`. An empty accidental or `n` is parsed as `0` (natural).
     *
     * @example
     * parse('c')      // C0 natural
     * parse('c4')     // C4 natural
     * parse('gff3')   // G3 double-flat
     * parse('g3f3')   // G3 triple-flat
     * parse('e2/3s6') // E6 two-thirds sharp
     */
    static parse(ex: string): _Pitch | null {
        ex = ex.toLowerCase();

        const match = ex.match(/^([a-g])([\d\/sf]*?)(\d+)?$/);
        if (!match) return null;

        const index = { c: 0, d: 1, e: 2, f: 3, g: 4, a: 5, b: 6 }[match[1]]!;
        const acci = Accidental.parse(match[2]);
        if (!acci) return null;

        const oct = match[3] ? parseInt(match[3]) : 0;
        if (isNaN(oct)) return null;

        return new _Pitch(index, acci, oct);
    }

    protected override _create(deg: number, acci: AsRational, period: number) {
        return new _Pitch(deg, acci, period) as this;
    }

    override toString(opt?: { noPeriod: boolean }): string {
        const names = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
        return `${names[this.index]}${Accidental.print(this.acci)}${opt?.noPeriod ? '' : this.period}`;
    }

    override intervalTo(b: _Pitch): _Interval {
        const steps = this.stepsTo(b);
        const distance = this.distanceTo(b);
        const sign = distance.num < 0 ? -1 : 1;
        return new _Interval(Math.abs(steps), distance.abs(), sign);
    }

    absoluteIntervalTo(b: _Pitch): _Interval {
        const a = this.withPeriod(0);
        b = b.withPeriod(0);
        return a.intervalTo(b).abs();
    }

    /**
     * Normalize the pitch so that it uses at most double accidentals (i.e. `acci.abs()` < 2)
     */
    normalize(): _Pitch {
        const acciValue = this.acci.value();
        if (Math.abs(acciValue) < 2) return this;
        const direction = acciValue > 0 ? 1 : -1;
        const target = this.acci.add(this.system.degreeOffsets[this.index]);

        let deg = this.index;
        let deltaPeriod = 0;
        let acci = this.acci;
        while (Math.abs(acci.value()) > 2) {
            deg = deg + direction;
            if (deg >= this.system.nDegrees) {
                deg = 0;
                deltaPeriod++;
            }
            if (deg < 0) {
                deg = this.system.nDegrees - 1;
                deltaPeriod--;
            }

            acci = target.sub(this.system.degreeOffsets[deg])
                         .sub(deltaPeriod * this.system.nPitchClasses);
        }
        return new _Pitch(deg, acci, this.period + deltaPeriod);
    }
}

// _Pitch satisfies PitchConstructor<StandardHeptatonicSystem, _Pitch>;
