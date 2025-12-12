import { Rational } from "common";

/**
 * Our model for a **pitch system**. To make it abstract and general enough but also useful, we must make the following assumptions for the system:
 * - It has a **period** expressible as a frequency ratio.
 * - It subdivides a period into N **pitch classes** (think semitones for common-practice heptatonic scales). The subdivision does *not* have to be even, but we assume it has a kind of meaning as to make transposition based on it somewhat meaningful.
 * - It contains M (M < N) **degrees** (think named tones like C, D, E...) among the pitch classes in a period.
 * - Accidentals are treated like pitch class index offsets (but we allow rationals for flexibility). Therefore, combining accidentals must be linear arithmetics.
 */
export abstract class PitchSystem {
    /**
     * The period of the system, also known as the equave, expressed as frequency ratio. For example, most systems use the octave as the period, which is 2:1 = 2. Must be larger than 1.
     */
    abstract readonly periodRatio: Rational;

    /**
     * The number of pitch classes in a period.
     */
    abstract readonly nPitchClasses: number;

    /**
     * The number of degrees in a period.
     */
    abstract readonly nDegrees: number;

    /**
     * The pitch class index for each of the degrees in a period. Must be a strictly increasing array.
     */
    abstract readonly degreeOffsets: readonly Rational[];
}
